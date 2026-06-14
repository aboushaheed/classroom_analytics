<template>
  <div class="space-y-6">
    <!-- KPIs -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col"
      >
        <div class="flex justify-between items-start mb-4">
          <div
            class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl"
          >
            <i class="fa-solid fa-chalkboard-user"></i>
          </div>
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider"
            >Actifs</span
          >
        </div>
        <h3 class="text-3xl font-bold text-slate-800">{{ courses.length }}</h3>
        <p class="text-slate-500 text-sm mt-1">Cours importés</p>
      </div>

      <div
        class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col"
      >
        <div class="flex justify-between items-start mb-4">
          <div
            class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl"
          >
            <i class="fa-solid fa-user-group"></i>
          </div>
        </div>
        <h3 class="text-3xl font-bold text-slate-800">{{ totalStudents }}</h3>
        <p class="text-slate-500 text-sm mt-1">Élèves suivis</p>
      </div>

      <div
        class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col"
      >
        <div class="flex justify-between items-start mb-4">
          <div
            class="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl"
          >
            <i class="fa-solid fa-check-double"></i>
          </div>
          <span
            class="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-md"
            >+2% ce mois</span
          >
        </div>
        <h3 class="text-3xl font-bold text-slate-800">
          {{ globalCompletionRate }}%
        </h3>
        <p class="text-slate-500 text-sm mt-1">Taux de devoirs rendus</p>
      </div>

      <div
        class="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col"
      >
        <div class="flex justify-between items-start mb-4">
          <div
            class="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl"
          >
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
        </div>
        <h3 class="text-3xl font-bold text-slate-800">
          {{ missingSubmissionsCount }}
        </h3>
        <p class="text-slate-500 text-sm mt-1">Devoirs en retard</p>
      </div>
    </div>

    <!-- Section Graphiques / Listes -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Derniers cours -->
      <div
        class="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm p-6"
      >
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-bold text-slate-800">Aperçu des cours</h3>
          <button
            @click="currentView = 'courses'"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Voir tout
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr
                class="text-xs uppercase text-slate-400 border-b border-slate-100"
              >
                <th class="pb-3 font-semibold">Nom du cours</th>
                <th class="pb-3 font-semibold text-center">Élèves</th>
                <th class="pb-3 font-semibold text-right">Taux de rendu</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="course in courses.slice(0, 4)"
                :key="course.id"
                class="border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                <td class="py-4">
                  <div class="font-medium text-slate-800">{{ course.name }}</div>
                  <div class="text-xs text-slate-500">
                    {{ course.section || 'Général' }}
                  </div>
                </td>
                <td class="py-4 text-center">
                  <span
                    class="inline-flex items-center justify-center bg-slate-100 text-slate-600 rounded-full px-3 py-1 text-sm font-medium"
                  >
                    {{ course.studentsCount || 0 }}
                  </span>
                </td>
                <td class="py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <div class="w-24 bg-slate-100 rounded-full h-2">
                      <div
                        class="bg-green-500 h-2 rounded-full"
                        :style="{ width: (course.completionRate || 0) + '%' }"
                      ></div>
                    </div>
                    <span class="text-sm font-medium text-slate-700 w-8"
                      >{{ course.completionRate || 0 }}%</span
                    >
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Alertes -->
      <div class="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
        <h3 class="text-lg font-bold text-slate-800 mb-6">
          À surveiller
          <i class="fa-solid fa-bell text-amber-500 ml-1"></i>
        </h3>
        <div class="space-y-4">
          <div
            v-for="student in studentsAtRisk"
            :key="student.id"
            class="flex items-center gap-4 p-3 rounded-xl bg-red-50/50 border border-red-100"
          >
            <div
              class="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold"
            >
              {{ student.name.charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-slate-800 truncate">
                {{ student.name }}
              </p>
              <p class="text-xs text-red-500">
                {{ student.missingCount }} devoirs manquants
              </p>
            </div>
          </div>
          <div
            v-if="studentsAtRisk.length === 0"
            class="text-center p-4 text-slate-500 text-sm"
          >
            Aucun élève en difficulté détecté.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useClassroom } from "../composables/useClassroom.js";
const {
  courses,
  totalStudents,
  globalCompletionRate,
  missingSubmissionsCount,
  studentsAtRisk,
  currentView,
} = useClassroom();
</script>
