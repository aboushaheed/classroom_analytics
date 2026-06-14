// classroom-logic.js — logique pure (module ES), sans Vue ni DOM. Branchable sur l'API Google Classroom.

  const DAY = 86400000;
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);


  function submissionStats(student, now) {
    now = now || new Date();
    const subs = student.submissions || [];
    const total = subs.length;
    const missing = subs.filter((s) => s.state === "missing").length;
    const late = subs.filter((s) => s.state === "late").length;
    const graded = subs
      .filter((s) => s.grade != null && s.maxGrade)
      .slice()
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .map((s) => (s.grade / s.maxGrade) * 20);
    const dates = subs
      .map((s) => s.submittedDate)
      .filter(Boolean)
      .map((d) => new Date(d).getTime())
      .filter((t) => !isNaN(t));
    const lastSubmission = dates.length ? new Date(Math.max(...dates)) : null;
    return { total, missing, late, graded, lastSubmission };
  }

  function gradeTrendDrop(graded) {
    // points de baisse (sur 20) entre la moitié ancienne et la moitié récente
    if (graded.length < 2) return 0;
    const mid = Math.floor(graded.length / 2);
    const older = avg(graded.slice(0, mid));
    const recent = avg(graded.slice(mid));
    return Math.max(0, older - recent);
  }

  function computeRiskScore(student, now) {
    now = now || new Date();
    const st = submissionStats(student, now);
    if (st.total === 0) return 0;

    const missingRate = st.missing / st.total;
    const lateRate = st.late / st.total;

    const drop = gradeTrendDrop(st.graded);
    const olderAvg = st.graded.length >= 2
      ? avg(st.graded.slice(0, Math.floor(st.graded.length / 2)))
      : 0;
    const trend = olderAvg > 0 ? clamp01(drop / olderAvg) : 0;

    let inactivity;
    if (st.lastSubmission) {
      const days = (now.getTime() - st.lastSubmission.getTime()) / DAY;
      inactivity = clamp01(days / 21);
    } else {
      inactivity = 1;
    }

    const score = missingRate * 40 + trend * 25 + lateRate * 20 + inactivity * 15;
    return Math.max(0, Math.min(100, Math.round(score)));
  }


  function riskLevel(score) {
    if (score >= 60) return "élevé";
    if (score >= 30) return "modéré";
    return "faible";
  }

  function riskReasons(student, now) {
    now = now || new Date();
    const st = submissionStats(student, now);
    const reasons = [];
    if (st.missing > 0)
      reasons.push(`${st.missing} devoir${st.missing > 1 ? "s" : ""} manquant${st.missing > 1 ? "s" : ""}`);
    const drop = gradeTrendDrop(st.graded);
    if (drop >= 1) reasons.push(`notes en baisse (-${Math.round(drop)} pts)`);
    if (st.late > 0)
      reasons.push(`${st.late} remise${st.late > 1 ? "s" : ""} en retard`);
    if (st.lastSubmission) {
      const days = Math.floor((now.getTime() - st.lastSubmission.getTime()) / DAY);
      if (days >= 10) reasons.push(`inactif depuis ${days} jours`);
    } else if (st.total > 0) {
      reasons.push("aucune remise enregistrée");
    }
    return reasons;
  }

  function buildRelanceMessage(student, courseNamesById) {
    courseNamesById = courseNamesById || {};
    const subs = student.submissions || [];
    const problems = subs.filter((s) => s.state === "missing" || s.state === "late");
    const count = problems.length;
    const firstName = (student.name || "").split(" ")[0] || student.name;
    const courseNames = Array.from(
      new Set(problems.map((s) => courseNamesById[s.courseId]).filter(Boolean))
    );
    const enCours = courseNames.length ? ` en ${courseNames.join(", ")}` : "";

    const subject = `Suivi de ${student.name} — point sur les devoirs`;
    const body =
      `Bonjour,\n\n` +
      `Je me permets de vous écrire au sujet de ${firstName}. ` +
      `Je remarque actuellement ${count} devoir${count > 1 ? "s" : ""} en retard ou non rendu${count > 1 ? "s" : ""}${enCours}.\n\n` +
      `Je reste disponible pour en échanger et trouver ensemble des solutions afin de l'aider à se remettre à jour.\n\n` +
      `N'hésitez pas à revenir vers moi.\n\nCordialement.`;

    return { subject, body };
  }

  function deriveKpis(students) {
    let total = 0;
    let missing = 0;
    let completed = 0;
    for (const s of students) {
      for (const sub of s.submissions || []) {
        total += 1;
        if (sub.state === "missing") missing += 1;
        else completed += 1;
      }
    }
    return {
      totalStudents: students.length,
      missingSubmissionsCount: missing,
      globalCompletionRate: total ? Math.round((completed / total) * 100) : 0,
    };
  }

  function enrichCourses(courses, students) {
    return courses.map((course) => {
      const enrolled = students.filter((s) => (s.courseIds || []).includes(course.id));
      const subs = [];
      for (const s of enrolled)
        for (const sub of s.submissions || [])
          if (sub.courseId === course.id) subs.push(sub);
      const assignmentIds = new Set(subs.map((s) => s.assignmentId));
      const missing = subs.filter((s) => s.state === "missing").length;
      const completionRate = subs.length
        ? Math.round(((subs.length - missing) / subs.length) * 100)
        : 0;
      return {
        ...course,
        studentsCount: enrolled.length,
        assignmentsCount: assignmentIds.size,
        completionRate,
      };
    });
  }

  const FIRST_NAMES = ["Lucas","Emma","Léa","Hugo","Chloé","Nathan","Manon","Louis","Sarah","Théo",
    "Inès","Jules","Camille","Gabriel","Jade","Adam","Lina","Raphaël","Zoé","Noah",
    "Kévin","Thomas","Maya","Yanis","Clara","Ethan","Anaïs","Maël","Eva","Mohamed"];
  const LAST_NAMES = ["Martin","Bernard","Dubois","Robert","Petit","Durand","Moreau","Laurent",
    "Simon","Michel","Garcia","Roux","David","Fontaine","Rousseau","Blanc","Garnier","Faure",
    "Benoit","Bonnet","Diallo","Traoré","Nguyen","Lopez","Da Silva"];

  // Profils: bon (peu de soucis), moyen, fragile (manquants/retards),
  // décrocheur (trajectoire en chute: bien noté -> notes basses -> manquants).
  const PROFILES = [
    { name: "bon", weight: 0.55, pMissing: 0.04, pLate: 0.08, gradeMin: 13, gradeMax: 20 },
    { name: "moyen", weight: 0.22, pMissing: 0.18, pLate: 0.2, gradeMin: 9, gradeMax: 16 },
    { name: "fragile", weight: 0.13, pMissing: 0.45, pLate: 0.25, gradeMin: 4, gradeMax: 12 },
    { name: "décrocheur", weight: 0.1, collapse: true, pMissing: 0, pLate: 0, gradeMin: 2, gradeMax: 18 },
  ];

  function pickProfile(rng) {
    const r = rng();
    let acc = 0;
    for (const p of PROFILES) {
      acc += p.weight;
      if (r <= acc) return p;
    }
    return PROFILES[PROFILES.length - 1];
  }

  function generateAssignments(course, now, rng) {
    const count = 6 + Math.floor(rng() * 7); // 6..12
    const assignments = [];
    for (let i = 0; i < count; i++) {
      const daysAgo = 5 + Math.floor(rng() * 85); // échéances passées 5..90 j
      assignments.push({
        assignmentId: `${course.id}-a${i + 1}`,
        assignmentTitle: `${course.name} — Devoir ${i + 1}`,
        dueDate: new Date(now.getTime() - daysAgo * DAY).toISOString(),
        maxGrade: 20,
      });
    }
    return assignments;
  }

  function generateMockStudents(courses, opts) {
    opts = opts || {};
    const rng = opts.rng || Math.random;
    const now = opts.now || new Date();
    const count = opts.count || 80;

    const assignmentsByCourse = {};
    for (const c of courses) assignmentsByCourse[c.id] = generateAssignments(c, now, rng);

    const students = [];
    for (let i = 0; i < count; i++) {
      const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
      const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
      const name = `${first} ${last}`;
      const email = `${first}.${last}`.toLowerCase().replace(/[^a-z]/g, "") + `${i}@ecole.fr`;
      const profile = pickProfile(rng);

      // inscription à 1..3 cours
      const nbCourses = 1 + Math.floor(rng() * Math.min(3, courses.length));
      const pool = courses.slice();
      const enrolled = [];
      for (let k = 0; k < nbCourses && pool.length; k++) {
        enrolled.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
      }

      const submissions = [];
      for (const course of enrolled) {
        // Décrocheur: génération chronologique en chute (bien -> bas -> manquant).
        if (profile.collapse) {
          const sorted = assignmentsByCourse[course.id]
            .slice()
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
          const n = sorted.length;
          const goodEnd = Math.max(1, Math.round(n * 0.2));
          const lateEnd = goodEnd + Math.max(1, Math.round(n * 0.25));
          sorted.forEach((a, idx) => {
            let state, grade, submittedDate;
            if (idx < goodEnd) {
              state = "returned";
              grade = 17 + Math.floor(rng() * 4); // 17-20, bien noté
              submittedDate = new Date(
                new Date(a.dueDate).getTime() - Math.floor(rng() * 2) * DAY,
              ).toISOString();
            } else if (idx < lateEnd) {
              state = "late";
              grade = 2 + Math.floor(rng() * 4); // 2-5, effondrement
              submittedDate = new Date(
                new Date(a.dueDate).getTime() + (1 + Math.floor(rng() * 5)) * DAY,
              ).toISOString();
            } else {
              state = "missing"; // devoirs récents non rendus
              grade = null;
              submittedDate = null;
            }
            submissions.push({
              courseId: course.id,
              assignmentId: a.assignmentId,
              assignmentTitle: a.assignmentTitle,
              dueDate: a.dueDate,
              state,
              grade,
              maxGrade: a.maxGrade,
              submittedDate,
            });
          });
          continue;
        }
        for (const a of assignmentsByCourse[course.id]) {
          const roll = rng();
          let state, grade, submittedDate;
          if (roll < profile.pMissing) {
            state = "missing"; grade = null; submittedDate = null;
          } else if (roll < profile.pMissing + profile.pLate) {
            state = "late";
            grade = Math.round(profile.gradeMin + rng() * (profile.gradeMax - profile.gradeMin));
            submittedDate = new Date(new Date(a.dueDate).getTime() + (1 + Math.floor(rng() * 6)) * DAY).toISOString();
          } else {
            state = rng() < 0.5 ? "returned" : "turned_in";
            grade = Math.round(profile.gradeMin + rng() * (profile.gradeMax - profile.gradeMin));
            submittedDate = new Date(new Date(a.dueDate).getTime() - Math.floor(rng() * 2) * DAY).toISOString();
          }
          submissions.push({
            courseId: course.id,
            assignmentId: a.assignmentId,
            assignmentTitle: a.assignmentTitle,
            dueDate: a.dueDate,
            state,
            grade,
            maxGrade: a.maxGrade,
            submittedDate,
          });
        }
      }

      students.push({
        id: `mock-${i + 1}`,
        name,
        email,
        photoUrl: "",
        courseIds: enrolled.map((c) => c.id),
        submissions,
      });
    }
    return students;
  }

  // ============================================================
  // Transformation des réponses de l'API Google Classroom
  // (pur : aucune I/O — consommé par classroom-api.js)
  // ============================================================

  // {year,month,day} + {hours,minutes}? (UTC) -> ISO, ou null si pas de date.
  function dueDateToISO(dueDate, dueTime) {
    if (!dueDate || !dueDate.year) return null;
    const p = (n) => String(n).padStart(2, "0");
    const y = dueDate.year;
    const m = p(dueDate.month || 1);
    const d = p(dueDate.day || 1);
    const h = p((dueTime && dueTime.hours) || 0);
    const min = p((dueTime && dueTime.minutes) || 0);
    return `${y}-${m}-${d}T${h}:${min}:00Z`;
  }

  // Dernière remise effective d'après l'historique d'état, sinon updateTime, sinon null.
  function submittedDateFromSubmission(apiSub) {
    let latest = null;
    for (const h of apiSub.submissionHistory || []) {
      const sh = h.stateHistory;
      if (
        sh &&
        (sh.state === "TURNED_IN" || sh.state === "RETURNED") &&
        sh.stateTimestamp
      ) {
        if (!latest || new Date(sh.stateTimestamp) > new Date(latest)) {
          latest = sh.stateTimestamp;
        }
      }
    }
    return latest || apiSub.updateTime || null;
  }

  // Mappe un studentSubmission vers notre état, ou null si "en attente" (exclu).
  function mapSubmissionState(apiSub, dueISO, now) {
    now = now || new Date();
    if (apiSub.state === "RETURNED") return "returned";
    if (apiSub.state === "TURNED_IN") return apiSub.late ? "late" : "turned_in";
    // NEW / CREATED / RECLAIMED_BY_STUDENT : non rendu
    if (dueISO && new Date(dueISO) < now) return "missing";
    return null; // pas encore dû ou sans date => en attente
  }

  // perCourse = [{ course, roster, courseWork, submissions }] -> student[]
  // Agrège par userId à travers tous les cours (vue 360° transversale).
  function assembleStudents(perCourse, now) {
    now = now || new Date();
    const byUser = new Map();

    const ensure = (userId, profile) => {
      if (!byUser.has(userId)) {
        byUser.set(userId, {
          id: userId,
          name: (profile && profile.name && profile.name.fullName) || "Élève",
          email: (profile && profile.emailAddress) || "",
          photoUrl: "",
          courseIds: [],
          submissions: [],
        });
      }
      return byUser.get(userId);
    };

    for (const block of perCourse || []) {
      const course = block.course;
      const cwById = {};
      for (const cw of block.courseWork || []) {
        cwById[cw.id] = {
          title: cw.title || "Devoir",
          dueISO: dueDateToISO(cw.dueDate, cw.dueTime),
          maxGrade: cw.maxPoints || 20,
        };
      }

      for (const r of block.roster || []) {
        const st = ensure(r.userId, r.profile);
        if (!st.courseIds.includes(course.id)) st.courseIds.push(course.id);
      }

      for (const sub of block.submissions || []) {
        const cw = cwById[sub.courseWorkId];
        if (!cw) continue;
        const mapped = mapSubmissionState(sub, cw.dueISO, now);
        if (mapped === null) continue;
        const st = ensure(sub.userId, null);
        if (!st.courseIds.includes(course.id)) st.courseIds.push(course.id);
        st.submissions.push({
          courseId: course.id,
          assignmentId: sub.courseWorkId,
          assignmentTitle: cw.title,
          dueDate: cw.dueISO,
          state: mapped,
          grade: sub.assignedGrade != null ? sub.assignedGrade : null,
          maxGrade: cw.maxGrade,
          submittedDate:
            mapped === "missing" ? null : submittedDateFromSubmission(sub),
        });
      }
    }

    return Array.from(byUser.values());
  }

export {
  computeRiskScore,
  riskLevel,
  riskReasons,
  buildRelanceMessage,
  deriveKpis,
  enrichCourses,
  generateMockStudents,
  dueDateToISO,
  submittedDateFromSubmission,
  mapSubmissionState,
  assembleStudents,
};
