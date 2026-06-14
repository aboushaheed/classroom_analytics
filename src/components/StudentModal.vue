<template>
  <Transition name="fade">
    <div
      v-if="selectedStudent"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      @click.self="closeStudent"
    >
      <div
        class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <!-- En-tête -->
        <div class="p-6 flex items-start gap-4 border-b border-slate-100">
          <div
            class="w-16 h-16 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-2xl font-bold"
          >
            {{ selectedStudent.name.charAt(0) }}
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-slate-800">
              {{ selectedStudent.name }}
            </h3>
            <p class="text-sm text-slate-500">{{ selectedStudent.email }}</p>
          </div>
          <div class="text-center">
            <div
              :class="['w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold', levelClasses(selectedDetail.level)]"
            >
              {{ selectedDetail.score }}
            </div>
            <p class="text-xs text-slate-400 mt-1 uppercase">
              {{ selectedDetail.level }}
            </p>
          </div>
          <button
            @click="closeStudent"
            class="text-slate-400 hover:text-slate-700 p-2"
          >
            <i class="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div class="p-6 space-y-6">
          <!-- Tendance des notes -->
          <div>
            <h4 class="text-sm font-bold text-slate-700 mb-2">
              Tendance des notes (/20)
            </h4>
            <svg
              v-if="selectedDetail.graded.length >= 2"
              viewBox="0 0 240 60"
              class="w-full h-16"
            >
              <polyline
                :points="sparklinePoints(selectedDetail.graded)"
                fill="none"
                stroke="#3b82f6"
                stroke-width="2"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
            </svg>
            <p v-else class="text-sm text-slate-400">
              Pas assez de notes pour une tendance.
            </p>
          </div>

          <!-- Pourquoi à risque -->
          <div
            v-if="selectedDetail.reasons.length"
            class="bg-red-50/60 border border-red-100 rounded-xl p-4"
          >
            <h4 class="text-sm font-bold text-red-700 mb-2">Pourquoi à risque</h4>
            <ul class="text-sm text-red-600 list-disc pl-5 space-y-1">
              <li v-for="(reason, i) in selectedDetail.reasons" :key="i">
                {{ reason }}
              </li>
            </ul>
          </div>

          <!-- Complétion par cours -->
          <div>
            <h4 class="text-sm font-bold text-slate-700 mb-3">
              Complétion par cours
            </h4>
            <div class="space-y-3">
              <div v-for="c in selectedDetail.byCourse" :key="c.courseId">
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-slate-600">{{ c.name }}</span>
                  <span class="font-medium text-slate-700">{{ c.rate }}%</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2">
                  <div
                    class="bg-blue-500 h-2 rounded-full"
                    :style="{ width: c.rate + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Devoirs à problème -->
          <div v-if="selectedDetail.problems.length">
            <h4 class="text-sm font-bold text-slate-700 mb-3">
              Devoirs manquants / en retard
            </h4>
            <div class="space-y-2">
              <div
                v-for="(p, i) in selectedDetail.problems"
                :key="i"
                class="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2"
              >
                <span class="text-slate-700 truncate">{{ p.assignmentTitle }}</span>
                <span
                  :class="p.state === 'missing' ? 'text-red-500' : 'text-amber-500'"
                  class="font-medium flex-shrink-0 ml-2"
                >
                  {{ p.state === 'missing' ? 'Manquant' : 'En retard' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Action -->
          <button
            @click="relancer(selectedStudent)"
            class="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            <i class="fa-solid fa-paper-plane"></i>
            Relancer cet élève
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { useClassroom } from "../composables/useClassroom.js";
const {
  selectedStudent,
  closeStudent,
  selectedDetail,
  sparklinePoints,
  levelClasses,
  relancer,
} = useClassroom();
</script>
