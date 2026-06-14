<template>
  <div class="max-w-3xl">
    <div
      v-if="relanceHistory.length === 0"
      class="bg-white border border-slate-100 rounded-2xl shadow-sm p-8 text-center text-slate-500"
    >
      <div class="text-5xl text-slate-200 mb-4">
        <i class="fa-solid fa-paper-plane"></i>
      </div>
      <p>Aucune relance envoyée pour l'instant.</p>
    </div>
    <div
      v-else
      class="bg-white border border-slate-100 rounded-2xl shadow-sm divide-y divide-slate-50"
    >
      <div
        v-for="entry in relanceHistory"
        :key="entry.id"
        class="flex items-center gap-4 p-4"
      >
        <div
          class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"
        >
          <i class="fa-solid fa-envelope"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-slate-800 truncate">
            {{ entry.studentName }}
          </p>
          <p class="text-xs text-slate-500 truncate">{{ entry.motif }}</p>
        </div>
        <span class="text-xs text-slate-400 flex-shrink-0">
          {{ new Date(entry.dateISO).toLocaleDateString("fr-FR") }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useClassroom } from "../composables/useClassroom.js";
const { relanceHistory } = useClassroom();
</script>
