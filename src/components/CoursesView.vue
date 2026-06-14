<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="course in courses"
        :key="course.id"
        class="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
      >
        <div class="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 p-4 relative">
          <div
            class="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-bold uppercase"
          >
            Actif
          </div>
          <h3
            class="text-white font-bold text-lg truncate pr-16"
            :title="course.name"
          >
            {{ course.name }}
          </h3>
          <p class="text-blue-100 text-sm truncate">{{ course.section }}</p>
        </div>
        <div class="p-5">
          <div class="flex justify-between items-center mb-4">
            <div class="text-center">
              <p class="text-xs text-slate-500 uppercase font-semibold">Élèves</p>
              <p class="text-xl font-bold text-slate-800">
                {{ course.studentsCount }}
              </p>
            </div>
            <div class="text-center">
              <p class="text-xs text-slate-500 uppercase font-semibold">Devoirs</p>
              <p class="text-xl font-bold text-slate-800">
                {{ course.assignmentsCount || 0 }}
              </p>
            </div>
          </div>
          <div class="pt-4 border-t border-slate-100">
            <div class="flex justify-between text-sm mb-1">
              <span class="text-slate-500 font-medium">Taux de complétion</span>
              <span class="font-bold text-slate-700">{{ course.completionRate }}%</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2">
              <div
                :class="['h-2 rounded-full', course.completionRate > 75 ? 'bg-green-500' : (course.completionRate > 50 ? 'bg-amber-400' : 'bg-red-500')]"
                :style="{ width: course.completionRate + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useClassroom } from "../composables/useClassroom.js";
const { courses } = useClassroom();
</script>
