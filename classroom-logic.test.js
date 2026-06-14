import { test } from "node:test";
import assert from "node:assert/strict";
import * as L from "./src/lib/classroom-logic.js";

test("le module expose un objet api", () => {
  assert.equal(typeof L, "object");
});

const NOW = new Date("2026-06-14T00:00:00Z");

function sub(state, opts = {}) {
  return {
    courseId: opts.courseId || "c1",
    assignmentId: opts.assignmentId || "a1",
    assignmentTitle: opts.assignmentTitle || "Devoir",
    dueDate: opts.dueDate || "2026-05-01T00:00:00Z",
    state,
    grade: opts.grade ?? null,
    maxGrade: opts.maxGrade ?? 20,
    submittedDate: opts.submittedDate ?? null,
  };
}

test("élève parfait => score 0", () => {
  const student = {
    id: "s1", name: "Alice Bon", email: "a@x.fr", photoUrl: "", courseIds: ["c1"],
    submissions: [
      // Vraiment "parfait" : notes stables (aucune baisse) et dernière remise = NOW
      // (aucune inactivité) => les 4 signaux valent 0.
      sub("returned", { grade: 18, submittedDate: "2026-06-13T00:00:00Z" }),
      sub("turned_in", { grade: 18, submittedDate: "2026-06-14T00:00:00Z" }),
    ],
  };
  assert.equal(L.computeRiskScore(student, NOW), 0);
});

test("100% manquant + inactif => score élevé (>= 55)", () => {
  const student = {
    id: "s2", name: "Bob Risque", email: "b@x.fr", photoUrl: "", courseIds: ["c1"],
    submissions: [sub("missing"), sub("missing"), sub("missing")],
  };
  const score = L.computeRiskScore(student, NOW);
  assert.ok(score >= 55, `score=${score}`);
});

test("score borné à 100", () => {
  const student = {
    id: "s3", name: "C", email: "c@x.fr", photoUrl: "", courseIds: ["c1"],
    submissions: [sub("missing"), sub("late", { submittedDate: "2026-01-01T00:00:00Z", grade: 2 })],
  };
  const score = L.computeRiskScore(student, NOW);
  assert.ok(score >= 0 && score <= 100, `score=${score}`);
});

test("une submittedDate invalide ne casse pas le score", () => {
  const student = {
    id: "s7", name: "F", email: "f@x.fr", photoUrl: "", courseIds: ["c1"],
    submissions: [sub("turned_in", { grade: 15, submittedDate: "pas-une-date" })],
  };
  const score = L.computeRiskScore(student, NOW);
  assert.ok(Number.isFinite(score), `score=${score}`);
  assert.ok(score >= 0 && score <= 100);
});

test("niveaux de risque", () => {
  assert.equal(L.riskLevel(10), "faible");
  assert.equal(L.riskLevel(29), "faible");
  assert.equal(L.riskLevel(30), "modéré");
  assert.equal(L.riskLevel(59), "modéré");
  assert.equal(L.riskLevel(60), "élevé");
  assert.equal(L.riskLevel(100), "élevé");
});

test("riskReasons liste les facteurs actifs", () => {
  const student = {
    id: "s4", name: "Dora", email: "d@x.fr", photoUrl: "", courseIds: ["c1"],
    submissions: [
      sub("missing"),
      sub("missing"),
      sub("late", { submittedDate: "2026-04-01T00:00:00Z", grade: 8 }),
    ],
  };
  const reasons = L.riskReasons(student, NOW);
  assert.ok(reasons.some((r) => r.includes("manquant")), reasons.join("|"));
  assert.ok(reasons.some((r) => r.includes("retard")), reasons.join("|"));
});

test("riskReasons d'un élève sans souci est court", () => {
  const student = {
    id: "s5", name: "Eve", email: "e@x.fr", photoUrl: "", courseIds: ["c1"],
    submissions: [sub("returned", { grade: 19, submittedDate: "2026-06-12T00:00:00Z" })],
  };
  assert.deepEqual(L.riskReasons(student, NOW), []);
});

test("buildRelanceMessage personnalise sujet et corps", () => {
  const student = {
    id: "s6", name: "Lucas Martin", email: "lucas@x.fr", photoUrl: "", courseIds: ["c1"],
    submissions: [
      sub("missing", { assignmentTitle: "Algèbre", courseId: "c1" }),
      sub("late", { assignmentTitle: "Géométrie", courseId: "c1", submittedDate: "2026-05-01T00:00:00Z" }),
    ],
  };
  const msg = L.buildRelanceMessage(student, { c1: "Mathématiques" });
  assert.ok(msg.subject.includes("Lucas Martin"));
  assert.ok(msg.body.includes("Lucas")); // prénom
  assert.ok(msg.body.includes("2")); // 2 devoirs en problème
  assert.ok(msg.body.includes("Mathématiques"));
});

test("deriveKpis agrège sur les élèves", () => {
  const students = [
    { id: "s1", name: "A", email: "", photoUrl: "", courseIds: ["c1"],
      submissions: [sub("turned_in", { grade: 15 }), sub("missing")] },
    { id: "s2", name: "B", email: "", photoUrl: "", courseIds: ["c1"],
      submissions: [sub("returned", { grade: 12 }), sub("returned", { grade: 14 })] },
  ];
  const kpis = L.deriveKpis(students);
  assert.equal(kpis.totalStudents, 2);
  assert.equal(kpis.missingSubmissionsCount, 1);
  // 4 remises, 1 manquante => 75% complétion
  assert.equal(kpis.globalCompletionRate, 75);
});

test("enrichCourses calcule les stats par cours", () => {
  const courses = [{ id: "c1", name: "Maths", section: "A" }];
  const students = [
    { id: "s1", name: "A", email: "", photoUrl: "", courseIds: ["c1"],
      submissions: [sub("turned_in", { courseId: "c1", assignmentId: "a1" }),
                    sub("missing", { courseId: "c1", assignmentId: "a2" })] },
    { id: "s2", name: "B", email: "", photoUrl: "", courseIds: ["c1"],
      submissions: [sub("returned", { courseId: "c1", assignmentId: "a1" })] },
  ];
  const enriched = L.enrichCourses(courses, students);
  assert.equal(enriched[0].studentsCount, 2);
  assert.equal(enriched[0].assignmentsCount, 2); // a1, a2 distincts
  // 3 remises pour c1, 1 manquante => 67%
  assert.equal(enriched[0].completionRate, 67);
});

test("generateMockStudents produit des données cohérentes", () => {
  const courses = [
    { id: "1", name: "Mathématiques - 3ème A", section: "Matin" },
    { id: "2", name: "Physique-Chimie - 3ème B", section: "PM" },
    { id: "3", name: "Informatique - 1ère NSI", section: "G1" },
  ];
  const students = L.generateMockStudents(courses, { count: 40, now: NOW });

  assert.equal(students.length, 40);
  const courseIds = new Set(courses.map((c) => c.id));
  for (const s of students) {
    assert.ok(s.id && s.name && s.email, "champs de base présents");
    assert.ok(s.courseIds.length >= 1, "inscrit à au moins un cours");
    assert.ok(s.submissions.length >= 1, "au moins une remise");
    for (const sub of s.submissions) {
      assert.ok(courseIds.has(sub.courseId), "courseId valide");
      assert.ok(s.courseIds.includes(sub.courseId), "remise dans un cours suivi");
      assert.ok(["turned_in", "missing", "late", "returned"].includes(sub.state));
    }
  }
});

test("la distribution de risque contient des élèves à risque", () => {
  const courses = [{ id: "1", name: "Maths", section: "A" }];
  const students = L.generateMockStudents(courses, { count: 60, now: NOW });
  const atRisk = students.filter((s) => L.computeRiskScore(s, NOW) >= 30);
  assert.ok(atRisk.length >= 1, "au moins un élève à risque modéré/élevé");
});

test("la calibration produit des élèves en risque élevé (rouge)", () => {
  const courses = [
    { id: "1", name: "Maths", section: "A" },
    { id: "2", name: "Physique", section: "B" },
    { id: "3", name: "Info", section: "C" },
  ];
  const students = L.generateMockStudents(courses, { count: 100, now: NOW });
  const eleves = students.filter((s) => L.computeRiskScore(s, NOW) >= 60);
  assert.ok(eleves.length >= 1, `élevés=${eleves.length}`);
});

// ---------- Transformation API Google Classroom ----------

test("dueDateToISO convertit date + heure UTC", () => {
  assert.equal(
    L.dueDateToISO({ year: 2026, month: 5, day: 1 }, { hours: 23, minutes: 59 }),
    "2026-05-01T23:59:00Z",
  );
  assert.equal(L.dueDateToISO({ year: 2026, month: 3, day: 9 }), "2026-03-09T00:00:00Z");
  assert.equal(L.dueDateToISO(null), null);
  assert.equal(L.dueDateToISO({}), null);
});

test("mapSubmissionState couvre tous les états", () => {
  const past = "2026-05-01T00:00:00Z";
  const future = "2026-12-01T00:00:00Z";
  assert.equal(L.mapSubmissionState({ state: "RETURNED" }, past, NOW), "returned");
  assert.equal(L.mapSubmissionState({ state: "TURNED_IN", late: true }, past, NOW), "late");
  assert.equal(L.mapSubmissionState({ state: "TURNED_IN" }, past, NOW), "turned_in");
  assert.equal(L.mapSubmissionState({ state: "CREATED" }, past, NOW), "missing");
  assert.equal(L.mapSubmissionState({ state: "NEW" }, future, NOW), null);
  assert.equal(L.mapSubmissionState({ state: "CREATED" }, null, NOW), null);
});

test("submittedDateFromSubmission privilégie l'historique TURNED_IN", () => {
  const sub = {
    updateTime: "2026-06-01T00:00:00Z",
    submissionHistory: [
      { stateHistory: { state: "CREATED", stateTimestamp: "2026-04-01T00:00:00Z" } },
      { stateHistory: { state: "TURNED_IN", stateTimestamp: "2026-05-10T08:00:00Z" } },
    ],
  };
  assert.equal(L.submittedDateFromSubmission(sub), "2026-05-10T08:00:00Z");
  assert.equal(
    L.submittedDateFromSubmission({ updateTime: "2026-06-01T00:00:00Z" }),
    "2026-06-01T00:00:00Z",
  );
  assert.equal(L.submittedDateFromSubmission({}), null);
});

test("assembleStudents agrège par élève à travers les cours", () => {
  const perCourse = [
    {
      course: { id: "c1", name: "Maths" },
      roster: [
        { userId: "u1", profile: { name: { fullName: "Alice B" }, emailAddress: "alice@e.fr" } },
      ],
      courseWork: [
        { id: "w1", title: "Algèbre", maxPoints: 20, dueDate: { year: 2026, month: 5, day: 1 } },
        { id: "w2", title: "Géométrie", maxPoints: 20, dueDate: { year: 2026, month: 5, day: 10 } },
      ],
      submissions: [
        { userId: "u1", courseWorkId: "w1", state: "RETURNED", assignedGrade: 15,
          submissionHistory: [{ stateHistory: { state: "TURNED_IN", stateTimestamp: "2026-04-30T00:00:00Z" } }] },
        { userId: "u1", courseWorkId: "w2", state: "CREATED" }, // dû passé -> missing
      ],
    },
    {
      course: { id: "c2", name: "Physique" },
      roster: [
        { userId: "u1", profile: { name: { fullName: "Alice B" }, emailAddress: "alice@e.fr" } },
      ],
      courseWork: [{ id: "w3", title: "Optique", maxPoints: 20, dueDate: { year: 2026, month: 12, day: 1 } }],
      submissions: [{ userId: "u1", courseWorkId: "w3", state: "NEW" }], // pas encore dû -> exclu
    },
  ];
  const students = L.assembleStudents(perCourse, NOW);
  assert.equal(students.length, 1);
  const a = students[0];
  assert.equal(a.id, "u1");
  assert.equal(a.name, "Alice B");
  assert.equal(a.email, "alice@e.fr");
  assert.deepEqual(a.courseIds.sort(), ["c1", "c2"]); // transversal
  assert.equal(a.submissions.length, 2); // w3 (NEW, pas dû) exclu
  const w1 = a.submissions.find((s) => s.assignmentId === "w1");
  assert.equal(w1.state, "returned");
  assert.equal(w1.grade, 15);
  assert.equal(w1.maxGrade, 20);
  assert.equal(w1.submittedDate, "2026-04-30T00:00:00Z");
  const w2 = a.submissions.find((s) => s.assignmentId === "w2");
  assert.equal(w2.state, "missing");
  assert.equal(w2.submittedDate, null);
});
