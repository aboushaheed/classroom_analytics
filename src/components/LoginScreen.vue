<template>
  <div
    class="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden"
  >
    <!-- Décoration de fond -->
    <div
      class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
    ></div>
    <div
      class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
    ></div>

    <div
      class="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl z-10 border border-slate-100 text-center"
    >
      <div
        class="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner"
      >
        <i class="fa-solid fa-graduation-cap text-4xl text-blue-600"></i>
      </div>
      <h1 class="text-3xl font-bold text-slate-800 mb-2">Classroom Analytics</h1>
      <p class="text-slate-500 mb-8">
        Pilotez l'engagement de vos classes d'un seul coup d'œil.
      </p>

      <div class="space-y-4">
        <button
          @click="loginWithGoogle"
          class="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-blue-200 font-semibold py-3 px-4 rounded-xl transition-all"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            class="w-5 h-5"
            alt="Google"
          />
          Connexion avec Google
        </button>

        <div class="relative flex py-2 items-center">
          <div class="flex-grow border-t border-slate-200"></div>
          <span class="flex-shrink-0 mx-4 text-slate-400 text-sm">ou pour tester</span>
          <div class="flex-grow border-t border-slate-200"></div>
        </div>

        <button
          @click="startDemo"
          class="w-full flex items-center justify-center gap-3 bg-slate-800 text-white hover:bg-slate-900 font-semibold py-3 px-4 rounded-xl transition-all shadow-md"
        >
          <i class="fa-solid fa-play"></i>
          Essayer le Mode Démo
        </button>
      </div>

      <div
        v-if="isClientIdFromEnv"
        class="mt-8 text-xs text-slate-400 bg-slate-50 p-3 rounded-lg text-left"
      >
        <p>
          <i class="fa-solid fa-circle-info mr-1"></i>
          Connectez-vous avec votre <b>compte de l'établissement</b> pour
          accéder à vos classes.
        </p>
      </div>
      <div
        v-else
        class="mt-8 text-xs text-amber-700 bg-amber-50 border border-amber-100 p-3 rounded-lg text-left"
      >
        <p>
          <i class="fa-solid fa-triangle-exclamation mr-1"></i>
          Application non configurée : l'administrateur doit définir
          <b>VITE_GOOGLE_CLIENT_ID</b> (ou utilisez le Mode Démo).
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useClassroom } from "../composables/useClassroom.js";
const { loginWithGoogle, startDemo, isClientIdFromEnv } = useClassroom();
</script>
