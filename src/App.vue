<template>
  <Transition name="fade">
    <LoginScreen v-if="!isAuthenticated" />
  </Transition>

  <Transition name="fade">
    <div v-if="isAuthenticated" class="flex h-screen bg-slate-50">
      <Sidebar />
      <main class="flex-1 flex flex-col h-screen overflow-hidden relative">
        <AppHeader />
        <div class="flex-1 overflow-y-auto p-8">
          <div
            v-if="isLoading"
            class="flex flex-col items-center justify-center h-full text-slate-400"
          >
            <i class="fa-solid fa-circle-notch fa-spin text-4xl text-blue-500 mb-4"></i>
            <p class="font-medium text-slate-500">
              Synchronisation avec Google Classroom...
            </p>
            <p v-if="loadProgress.total" class="text-sm text-slate-400 mt-1">
              {{ loadProgress.done }}/{{ loadProgress.total }} cours
            </p>
          </div>
          <DashboardView v-else-if="currentView === 'dashboard'" />
          <CoursesView v-else-if="currentView === 'courses'" />
          <SettingsView v-else-if="currentView === 'settings'" />
          <RiskListView v-else-if="currentView === 'students'" />
          <RelancesView v-else-if="currentView === 'history'" />
        </div>
      </main>
    </div>
  </Transition>

  <StudentModal />
</template>

<script setup>
import { onMounted } from "vue";
import {
  useClassroom,
  initGoogleAuth,
  closeStudent,
} from "./composables/useClassroom.js";
import LoginScreen from "./components/LoginScreen.vue";
import Sidebar from "./components/Sidebar.vue";
import AppHeader from "./components/AppHeader.vue";
import DashboardView from "./components/DashboardView.vue";
import CoursesView from "./components/CoursesView.vue";
import SettingsView from "./components/SettingsView.vue";
import RiskListView from "./components/RiskListView.vue";
import RelancesView from "./components/RelancesView.vue";
import StudentModal from "./components/StudentModal.vue";

const { isAuthenticated, isLoading, loadProgress, currentView } = useClassroom();

onMounted(() => {
  if (window.google) {
    initGoogleAuth();
  } else {
    const t = setInterval(() => {
      if (window.google) {
        clearInterval(t);
        initGoogleAuth();
      }
    }, 100);
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeStudent();
  });
});
</script>
