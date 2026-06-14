import { ref, computed } from "vue";
import * as ClassroomLogic from "../lib/classroom-logic.js";
import * as ClassroomApi from "../lib/classroom-api.js";

// --- État singleton : partagé par tous les composants qui appellent useClassroom() ---

// -- ÉTAT GLOBAL --
const isAuthenticated = ref(false);
const isDemoMode = ref(false);
const isLoading = ref(false);
const currentView = ref("dashboard");

// Paramètres
const savedClientId = localStorage.getItem("google_client_id") || "";
const settingsClientId = ref(savedClientId);
const settingsSavedMessage = ref(false);

// Données
const accessToken = ref(null);
const courses = ref([]);
const students = ref([]);

const courseNamesById = computed(() => {
  const map = {};
  courses.value.forEach((c) => (map[c.id] = c.name));
  return map;
});

const NOW = new Date();
const rankedStudents = computed(() =>
  students.value
    .map((s) => {
      const score = ClassroomLogic.computeRiskScore(s, NOW);
      return {
        student: s,
        score,
        level: ClassroomLogic.riskLevel(score),
        reasons: ClassroomLogic.riskReasons(s, NOW),
      };
    })
    .sort((a, b) => b.score - a.score),
);

// -- VUE ÉLÈVES EN DIFFICULTÉ (filtres) --
const riskCourseFilter = ref("all");
const riskLevelFilter = ref("all");
const filteredRanked = computed(() =>
  rankedStudents.value.filter((r) => {
    const okCourse =
      riskCourseFilter.value === "all" ||
      r.student.courseIds.includes(riskCourseFilter.value);
    const okLevel =
      riskLevelFilter.value === "all" || r.level === riskLevelFilter.value;
    return okCourse && okLevel;
  }),
);
const levelClasses = (level) =>
  ({
    élevé: "bg-red-100 text-red-700",
    modéré: "bg-amber-100 text-amber-700",
    faible: "bg-green-100 text-green-700",
  })[level];

// -- VUE ÉLÈVE 360° (modale) --
const selectedStudent = ref(null);
const openStudent = (s) => (selectedStudent.value = s);
const closeStudent = () => (selectedStudent.value = null);

const selectedDetail = computed(() => {
  const s = selectedStudent.value;
  if (!s) return null;
  const score = ClassroomLogic.computeRiskScore(s, NOW);
  const graded = s.submissions
    .filter((x) => x.grade != null && x.maxGrade)
    .slice()
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .map((x) => Math.round((x.grade / x.maxGrade) * 20));
  const problems = s.submissions.filter(
    (x) => x.state === "missing" || x.state === "late",
  );
  const byCourse = s.courseIds.map((cid) => {
    const subs = s.submissions.filter((x) => x.courseId === cid);
    const done = subs.filter((x) => x.state !== "missing").length;
    return {
      courseId: cid,
      name: courseNamesById.value[cid] || cid,
      rate: subs.length ? Math.round((done / subs.length) * 100) : 0,
    };
  });
  return {
    score,
    level: ClassroomLogic.riskLevel(score),
    reasons: ClassroomLogic.riskReasons(s, NOW),
    graded,
    problems,
    byCourse,
  };
});

// Sparkline SVG : transforme une liste de notes /20 en points "x,y"
const sparklinePoints = (values) => {
  if (!values || values.length < 2) return "";
  const w = 240,
    h = 60,
    pad = 4;
  const max = 20,
    min = 0;
  return values
    .map((v, i) => {
      const x = pad + (i * (w - 2 * pad)) / (values.length - 1);
      const y = h - pad - ((v - min) / (max - min)) * (h - 2 * pad);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
};

const RELANCE_KEY = "relance_history";
const relanceHistory = ref(
  JSON.parse(localStorage.getItem(RELANCE_KEY) || "[]"),
);

const relancer = (student) => {
  const msg = ClassroomLogic.buildRelanceMessage(student, courseNamesById.value);
  const reasons = ClassroomLogic.riskReasons(student, NOW);
  const motif = reasons.join(" · ") || "Suivi";

  // 1) Ouvrir la messagerie pré-remplie
  const href =
    `mailto:${encodeURIComponent(student.email)}` +
    `?subject=${encodeURIComponent(msg.subject)}` +
    `&body=${encodeURIComponent(msg.body)}`;
  window.location.href = href;

  // 2) Journaliser
  const entry = {
    id: `${student.id}-${new Date().getTime()}`,
    studentId: student.id,
    studentName: student.name,
    dateISO: new Date().toISOString(),
    motif,
    canal: "email",
  };
  relanceHistory.value = [entry, ...relanceHistory.value];
  localStorage.setItem(RELANCE_KEY, JSON.stringify(relanceHistory.value));
};

const studentsAtRisk = computed(() =>
  rankedStudents.value
    .filter((r) => r.score >= 30)
    .slice(0, 5)
    .map((r) => ({
      id: r.student.id,
      name: r.student.name,
      missingCount: r.student.submissions.filter((s) => s.state === "missing")
        .length,
    })),
);

// -- CONSTANTES GOOGLE API --
const SCOPES =
  "https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.rosters.readonly https://www.googleapis.com/auth/classroom.coursework.students.readonly https://www.googleapis.com/auth/classroom.student-submissions.students.readonly";
let tokenClient = null;
const loadProgress = ref({ done: 0, total: 0 });

// Client ID : priorité à la variable d'environnement (intégrée au déploiement,
// commune à tous les profs) ; repli sur le localStorage (override avancé / dev local).
function getClientId() {
  return (
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    localStorage.getItem("google_client_id") ||
    ""
  );
}

// Vrai si le Client ID est fourni par le déploiement (variable d'env) :
// dans ce cas les professeurs n'ont rien à configurer.
const isClientIdFromEnv = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

// -- GETTERS (KPIs) --
const kpis = computed(() => ClassroomLogic.deriveKpis(students.value));
const totalStudents = computed(() => kpis.value.totalStudents);
const globalCompletionRate = computed(() => kpis.value.globalCompletionRate);
const missingSubmissionsCount = computed(
  () => kpis.value.missingSubmissionsCount,
);

const viewTitle = computed(() => {
  const titles = {
    dashboard: "Tableau de bord",
    courses: "Mes Cours",
    students: "Suivi des élèves",
    history: "Historique des relances",
    settings: "Paramètres",
  };
  return titles[currentView.value];
});

// -- MÉTHODES --

// 1. Initialisation Google Auth
function initGoogleAuth() {
  const clientId = getClientId();
  if (!clientId) return; // Pas configuré, on ne charge pas le client

  try {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          accessToken.value = tokenResponse.access_token;
          isAuthenticated.value = true;
          isDemoMode.value = false;
          fetchData(); // Lance la requête réelle
        }
      },
    });
  } catch (e) {
    console.error("Erreur d'initialisation Google:", e);
  }
}

// 2. Action Connexion Google
const loginWithGoogle = () => {
  const clientId = getClientId();
  if (!clientId) {
    alert(
      "Application non configurée : le Client ID Google est manquant (variable VITE_GOOGLE_CLIENT_ID). Contactez l'administrateur de l'app.",
    );
    return;
  }
  if (tokenClient) {
    tokenClient.requestAccessToken();
  } else {
    initGoogleAuth();
    if (tokenClient) tokenClient.requestAccessToken();
  }
};

// 3. Action Mode Démo
const startDemo = () => {
  isAuthenticated.value = true;
  isDemoMode.value = true;
  generateMockData();
};

// 4. Déconnexion
const logout = () => {
  isAuthenticated.value = false;
  accessToken.value = null;
  courses.value = [];
  currentView.value = "dashboard";
};

// 5. Sauvegarde Paramètres
const saveSettings = () => {
  localStorage.setItem("google_client_id", settingsClientId.value);
  settingsSavedMessage.value = true;
  setTimeout(() => (settingsSavedMessage.value = false), 3000);
  initGoogleAuth(); // Réinitialise le client avec le nouvel ID
};

// 6. Récupération des données réelles (jalon Phase 2)
const fetchData = async () => {
  if (isDemoMode.value) {
    generateMockData();
    return;
  }

  if (!accessToken.value) return;

  isLoading.value = true;
  loadProgress.value = { done: 0, total: 0 };
  try {
    const { courses: c, students: s } = await ClassroomApi.fetchClassroomData(
      accessToken.value,
      {
        onProgress: (done, total) => {
          loadProgress.value = { done, total };
        },
      },
    );
    students.value = s;
    courses.value = c;
  } catch (error) {
    console.error(error);
    if (error && (error.status === 401 || error.status === 403)) {
      alert(
        "Accès refusé. Reconnectez-vous et acceptez les autorisations Google Classroom (vous devez être enseignant des cours).",
      );
    } else {
      alert(
        "Erreur de communication avec Google Classroom. Vérifiez que l'API est activée sur votre Cloud Console.",
      );
    }
  } finally {
    isLoading.value = false;
  }
};

// 7. Génération Données Démo
function generateMockData() {
  isLoading.value = true;
  setTimeout(() => {
    const baseCourses = [
      { id: "1", name: "Mathématiques - 3ème A", section: "Matin" },
      { id: "2", name: "Physique-Chimie - 3ème B", section: "Après-midi" },
      { id: "3", name: "Informatique - 1ère NSI", section: "Groupe 1" },
      { id: "4", name: "SNT - 2nde 4", section: "Tronc commun" },
      { id: "5", name: "Mathématiques - 3ème B", section: "Matin" },
    ];
    const generated = ClassroomLogic.generateMockStudents(baseCourses, {
      count: 80,
    });
    students.value = generated;
    courses.value = ClassroomLogic.enrichCourses(baseCourses, generated);
    isLoading.value = false;
  }, 800);
}

// Exposé pour App.vue (cycle de vie : init GIS + touche Échap)
export { initGoogleAuth, closeStudent };

export function useClassroom() {
  return {
    isAuthenticated,
    isDemoMode,
    isLoading,
    loadProgress,
    isClientIdFromEnv,
    currentView,
    viewTitle,
    courses,
    students,
    rankedStudents,
    courseNamesById,
    riskCourseFilter,
    riskLevelFilter,
    filteredRanked,
    levelClasses,
    openStudent,
    selectedStudent,
    closeStudent,
    selectedDetail,
    sparklinePoints,
    relancer,
    relanceHistory,
    totalStudents,
    globalCompletionRate,
    studentsAtRisk,
    missingSubmissionsCount,
    settingsClientId,
    settingsSavedMessage,
    loginWithGoogle,
    startDemo,
    logout,
    saveSettings,
    fetchData,
  };
}
