<template>
  <div
    class="max-w-2xl bg-white border border-slate-100 rounded-2xl shadow-sm p-8"
  >
    <div class="mb-8">
      <h3 class="text-lg font-bold text-slate-800 mb-2">
        Configuration API Google
      </h3>
      <p class="text-slate-500 text-sm">
        L'accès aux vraies données de Google Classroom repose sur un Client ID
        OAuth. En usage normal, il est fourni par l'administrateur de l'app —
        vous n'avez rien à configurer.
      </p>
    </div>

    <!-- Cas normal : Client ID fourni par le déploiement -->
    <div
      v-if="isClientIdFromEnv"
      class="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800 flex gap-3 mb-8"
    >
      <i class="fa-solid fa-circle-check mt-0.5 text-green-500"></i>
      <div>
        <p class="font-bold mb-1">Application configurée</p>
        <p class="text-green-700/80">
          Le Client ID est fourni par l'administrateur (variable
          d'environnement). Connectez-vous simplement avec votre compte de
          l'établissement — aucune action requise ici.
        </p>
      </div>
    </div>

    <!-- Cas dev / non configuré : override manuel du Client ID -->
    <template v-else>
      <div class="space-y-4 mb-8">
        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-2"
            >Google Client ID (override avancé)</label
          >
          <input
            type="text"
            v-model="settingsClientId"
            placeholder="ex: 123456789-abcde.apps.googleusercontent.com"
            class="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>
      </div>

      <div
        class="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex gap-3"
      >
        <i class="fa-solid fa-circle-info mt-0.5 text-blue-500"></i>
        <div>
          <p class="font-bold mb-1">
            Administrateur : comment configurer l'app pour tous ?
          </p>
          <ol class="list-decimal pl-4 space-y-1 text-blue-700/80">
            <li>
              Sur
              <a
                href="https://console.cloud.google.com"
                target="_blank"
                class="underline font-medium hover:text-blue-900"
                >Google Cloud Console</a
              >, activez l'API <b>Google Classroom</b>.
            </li>
            <li>
              Écran de consentement OAuth en <b>« Internal »</b> (même
              établissement Google Workspace).
            </li>
            <li>
              Créez un <b>ID client OAuth</b> (Application Web) et ajoutez l'URL
              du site aux origines autorisées.
            </li>
            <li>
              Définissez la variable <b>VITE_GOOGLE_CLIENT_ID</b> (voir
              <code>DEPLOY.md</code>) — les professeurs n'auront alors rien à
              saisir.
            </li>
          </ol>
        </div>
      </div>
    </template>

    <div class="mt-8 flex gap-4">
      <button
        v-if="!isClientIdFromEnv"
        @click="saveSettings"
        class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors"
      >
        Sauvegarder
      </button>
      <button
        v-if="isDemoMode"
        @click="logout"
        class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-6 rounded-xl transition-colors"
      >
        Quitter le mode démo
      </button>
    </div>

    <div
      v-if="settingsSavedMessage"
      class="mt-4 text-green-600 text-sm font-medium flex items-center gap-2"
    >
      <i class="fa-solid fa-check"></i> Paramètres sauvegardés. Déconnectez-vous
      pour appliquer.
    </div>
  </div>
</template>

<script setup>
import { useClassroom } from "../composables/useClassroom.js";
const {
  settingsClientId,
  saveSettings,
  settingsSavedMessage,
  isDemoMode,
  isClientIdFromEnv,
  logout,
} = useClassroom();
</script>
