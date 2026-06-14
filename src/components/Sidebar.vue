<template>
  <aside
    class="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm"
  >
    <div class="p-6 flex items-center gap-3 border-b border-slate-100">
      <div
        class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md"
      >
        <i class="fa-solid fa-chart-pie text-white text-lg"></i>
      </div>
      <span class="font-bold text-xl text-slate-800">Analytics</span>
    </div>

    <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
      <a
        href="#"
        @click.prevent="currentView = 'dashboard'"
        :class="['flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors', currentView === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700']"
      >
        <i class="fa-solid fa-border-all w-5"></i> Vue Globale
      </a>
      <a
        href="#"
        @click.prevent="currentView = 'courses'"
        :class="['flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors', currentView === 'courses' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700']"
      >
        <i class="fa-solid fa-book w-5"></i> Mes Cours
      </a>
      <a
        href="#"
        @click.prevent="currentView = 'students'"
        :class="['flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors', currentView === 'students' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700']"
      >
        <i class="fa-solid fa-users w-5"></i> Élèves en difficulté
      </a>
      <a
        href="#"
        @click.prevent="currentView = 'history'"
        :class="['flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors', currentView === 'history' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700']"
      >
        <i class="fa-solid fa-paper-plane w-5"></i> Relances
      </a>
      <a
        v-if="!isClientIdFromEnv"
        href="#"
        @click.prevent="currentView = 'settings'"
        :class="['flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors', currentView === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700']"
      >
        <i class="fa-solid fa-gear w-5"></i> Paramètres API
      </a>
    </nav>

    <div class="p-4 border-t border-slate-100">
      <div class="flex items-center gap-3 mb-4 px-2">
        <div
          class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
        >
          {{ isDemoMode ? 'P' : 'G' }}
        </div>
        <div>
          <p class="text-sm font-bold text-slate-800">
            {{ isDemoMode ? 'Professeur (Démo)' : 'Professeur Connecté' }}
          </p>
          <p class="text-xs text-green-500">
            <i class="fa-solid fa-circle text-[8px] mr-1"></i>En ligne
          </p>
        </div>
      </div>
      <button
        @click="logout"
        class="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm font-medium"
      >
        <i class="fa-solid fa-arrow-right-from-bracket"></i>
        Déconnexion
      </button>
    </div>
  </aside>
</template>

<script setup>
import { useClassroom } from "../composables/useClassroom.js";
const { currentView, isDemoMode, isClientIdFromEnv, logout } = useClassroom();
</script>
