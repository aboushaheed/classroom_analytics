<template>
  <header
    class="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center z-10 sticky top-0"
  >
    <h2 class="text-2xl font-bold text-slate-800 capitalize">
      {{ viewTitle }}
    </h2>
    <div class="flex items-center gap-4">
      <span
        v-if="isDemoMode"
        class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
        >Mode Démo Actif</span
      >
      <button
        v-if="!isDemoMode"
        @click="fetchData"
        class="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg transition-colors"
        title="Rafraîchir les données"
      >
        <i class="fa-solid fa-rotate-right" :class="{'animate-spin': isLoading}"></i>
      </button>
    </div>
  </header>
</template>

<script setup>
import { useClassroom } from "../composables/useClassroom.js";
const { viewTitle, isDemoMode, isLoading, fetchData } = useClassroom();
</script>
