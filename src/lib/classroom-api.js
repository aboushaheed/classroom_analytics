// classroom-api.js — orchestration réseau (I/O) de l'API Google Classroom.
// Délègue toute transformation à classroom-logic.js (pur). Non testé unitairement.
import * as ClassroomLogic from "./classroom-logic.js";

const BASE = "https://classroom.googleapis.com/v1";

// Suit nextPageToken et concatène data[itemsKey] sur toutes les pages.
async function fetchAllPages(url, token, itemsKey) {
  const items = [];
  let pageToken = "";
  do {
    const sep = url.includes("?") ? "&" : "?";
    const pageUrl = pageToken ? `${url}${sep}pageToken=${pageToken}` : url;
    const res = await fetch(pageUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = new Error(`Classroom API ${res.status}`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    if (Array.isArray(data[itemsKey])) items.push(...data[itemsKey]);
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return items;
}

// Récupère cours + élèves + devoirs + remises, assemble le modèle student[].
// onProgress(done, total) est appelé après chaque cours traité.
export async function fetchClassroomData(token, { onProgress } = {}) {
  const rawCourses = await fetchAllPages(
    `${BASE}/courses?courseStates=ACTIVE&teacherId=me`,
    token,
    "courses",
  );

  const total = rawCourses.length;
  const perCourse = [];
  let done = 0;

  for (const c of rawCourses) {
    try {
      const [roster, courseWork, submissions] = await Promise.all([
        fetchAllPages(`${BASE}/courses/${c.id}/students`, token, "students"),
        fetchAllPages(`${BASE}/courses/${c.id}/courseWork`, token, "courseWork"),
        fetchAllPages(
          `${BASE}/courses/${c.id}/courseWork/-/studentSubmissions`,
          token,
          "studentSubmissions",
        ),
      ]);
      perCourse.push({
        course: { id: c.id, name: c.name, section: c.section || "" },
        roster,
        courseWork,
        submissions,
      });
    } catch (e) {
      // Échec sur un cours : on le saute et on continue les autres.
      console.error(`Cours ${c.id} ignoré :`, e);
    } finally {
      done += 1;
      if (onProgress) onProgress(done, total);
    }
  }

  const baseCourses = perCourse.map((b) => b.course);
  const students = ClassroomLogic.assembleStudents(perCourse, new Date());
  const courses = ClassroomLogic.enrichCourses(baseCourses, students);
  return { courses, students };
}
