<template>
  <div class="space-y-6">
    <!-- Filtres -->
    <div class="flex flex-wrap gap-3">
      <select
        v-model="riskCourseFilter"
        class="border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white"
      >
        <option value="all">Tous les cours</option>
        <option v-for="c in courses" :key="c.id" :value="c.id">
          {{ c.name }}
        </option>
      </select>
      <select
        v-model="riskLevelFilter"
        class="border border-slate-200 rounded-xl px-4 py-2 text-sm bg-white"
      >
        <option value="all">Tous les niveaux</option>
        <option value="élevé">Risque élevé</option>
        <option value="modéré">Risque modéré</option>
        <option value="faible">Risque faible</option>
      </select>
      <span class="text-sm text-slate-400 self-center">
        {{ filteredRanked.length }} élève(s)
      </span>
    </div>

    <!-- Liste -->
    <div
      class="bg-white border border-slate-100 rounded-2xl shadow-sm divide-y divide-slate-50"
    >
      <div
        v-for="r in filteredRanked"
        :key="r.student.id"
        @click="openStudent(r.student)"
        class="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors"
      >
        <div
          class="w-11 h-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold flex-shrink-0"
        >
          {{ r.student.name.charAt(0) }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-slate-800 truncate">
            {{ r.student.name }}
          </p>
          <p class="text-xs text-slate-500 truncate">
            {{ r.reasons.join(" · ") || "Aucun signal" }}
          </p>
        </div>
        <span
          :class="['px-2 py-1 rounded-md text-xs font-bold uppercase', levelClasses(r.level)]"
        >
          {{ r.level }}
        </span>
        <div class="w-12 text-right">
          <span class="text-lg font-bold text-slate-800">{{ r.score }}</span>
        </div>
        <button
          @click.stop="relancer(r.student)"
          class="text-slate-400 hover:text-blue-600 p-2"
          title="Relancer"
        >
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>
      <div
        v-if="filteredRanked.length === 0"
        class="p-8 text-center text-slate-500 text-sm"
      >
        Aucun élève ne correspond à ce filtre.
      </div>
    </div>
  </div>
</template>

<script setup>
import { useClassroom } from "../composables/useClassroom.js";
const {
  riskCourseFilter,
  riskLevelFilter,
  courses,
  filteredRanked,
  levelClasses,
  openStudent,
  relancer,
} = useClassroom();
</script>
