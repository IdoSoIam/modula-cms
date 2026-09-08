<template>
  <div class="space-y-6">
    <div class="grid gap-3 sm:grid-cols-2">
      <label class="form-control gap-2">
        <span class="label-text font-medium">{{ t('admin.settingsGlobalPage.rentalTimezone') }}</span>
        <input v-model="model.timezone" class="input input-bordered w-full" autocomplete="off" />
      </label>
      <label class="form-control gap-2">
        <span class="label-text font-medium">{{ t('admin.settingsGlobalPage.holidayCountry') }}</span>
        <select v-model="model.holidayCountry" class="select select-bordered w-full">
          <option value="FR">France</option>
        </select>
      </label>
    </div>

    <label class="flex cursor-pointer items-start gap-3 rounded-xl border border-base-300 bg-base-200/60 p-4">
      <input v-model="model.excludePublicHolidays" type="checkbox" class="toggle toggle-primary mt-0.5" />
      <span>
        <span class="block font-medium">{{ t('admin.settingsGlobalPage.excludePublicHolidays') }}</span>
        <span class="mt-1 block text-sm opacity-70">{{ t('admin.settingsGlobalPage.excludePublicHolidaysHelp') }}</span>
      </span>
    </label>

    <div class="space-y-3">
      <div>
        <h3 class="font-semibold">{{ t('admin.settingsGlobalPage.weeklyHours') }}</h3>
        <p class="text-sm opacity-70">{{ t('admin.settingsGlobalPage.weeklyHoursHelp') }}</p>
      </div>
      <article v-for="day in orderedDays" :key="day.dayOfWeek" class="rounded-xl border border-base-300 bg-base-100 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <label class="flex cursor-pointer items-center gap-3 font-medium">
            <input v-model="day.enabled" type="checkbox" class="toggle toggle-sm toggle-primary" @change="ensureRange(day)" />
            {{ dayName(day.dayOfWeek) }}
          </label>
          <button v-if="day.enabled" type="button" class="btn btn-ghost btn-sm" @click="addRange(day)">
            <span class="i-mdi-plus" aria-hidden="true" /> {{ t('admin.settingsGlobalPage.addTimeRange') }}
          </button>
        </div>
        <div v-if="day.enabled" class="mt-4 grid gap-3">
          <div v-for="(range, index) in day.ranges" :key="index" class="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-2 max-sm:grid-cols-[1fr_1fr_auto]">
            <label class="form-control gap-1">
              <span class="label-text text-xs opacity-70">{{ t('admin.settingsGlobalPage.openingStart') }}</span>
              <input v-model="range.start" type="time" class="input input-bordered input-sm w-full" />
            </label>
            <span class="pb-2 max-sm:hidden">-</span>
            <label class="form-control gap-1">
              <span class="label-text text-xs opacity-70">{{ t('admin.settingsGlobalPage.openingEnd') }}</span>
              <input v-model="range.end" type="time" class="input input-bordered input-sm w-full" />
            </label>
            <button type="button" class="btn btn-ghost btn-sm btn-square text-error" :aria-label="t('common.delete')" @click="removeRange(day, index)">
              <span class="i-mdi-delete-outline text-lg" aria-hidden="true" />
            </button>
          </div>
        </div>
        <p v-else class="mt-2 text-sm opacity-60">{{ t('admin.settingsGlobalPage.closedDay') }}</p>
      </article>
    </div>

    <div class="space-y-3">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 class="font-semibold">{{ t('admin.settingsGlobalPage.exceptionalClosures') }}</h3>
          <p class="text-sm opacity-70">{{ t('admin.settingsGlobalPage.exceptionalClosuresHelp') }}</p>
        </div>
        <button type="button" class="btn btn-outline btn-sm" @click="addClosure">
          <span class="i-mdi-plus" aria-hidden="true" /> {{ t('admin.settingsGlobalPage.addClosure') }}
        </button>
      </div>
      <p v-if="!model.closures.length" class="rounded-xl border border-dashed border-base-300 p-5 text-center text-sm opacity-60">
        {{ t('admin.settingsGlobalPage.noClosure') }}
      </p>
      <article v-for="(closure, index) in model.closures" :key="closure.id" class="grid gap-3 rounded-xl border border-base-300 p-4 md:grid-cols-[minmax(0,1.5fr)_1fr_1fr_auto] md:items-end">
        <label class="form-control gap-1">
          <span class="label-text text-xs opacity-70">{{ t('admin.settingsGlobalPage.closureLabel') }}</span>
          <input v-model="closure.label" class="input input-bordered input-sm w-full" />
        </label>
        <label class="form-control gap-1">
          <span class="label-text text-xs opacity-70">{{ t('admin.settingsGlobalPage.closureStart') }}</span>
          <input v-model="closure.startDate" type="date" class="input input-bordered input-sm w-full" />
        </label>
        <label class="form-control gap-1">
          <span class="label-text text-xs opacity-70">{{ t('admin.settingsGlobalPage.closureEnd') }}</span>
          <input v-model="closure.endDate" type="date" class="input input-bordered input-sm w-full" />
        </label>
        <button type="button" class="btn btn-ghost btn-sm text-error md:btn-square" :aria-label="t('common.delete')" @click="model.closures.splice(index, 1)">
          <span class="i-mdi-delete-outline text-lg" aria-hidden="true" /><span class="md:hidden">{{ t('common.delete') }}</span>
        </button>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RentalCalendarConfig, RentalWeeklyDay } from '#modula/shared/rentalCalendar'

const model = defineModel<RentalCalendarConfig>({ required: true })
const { t } = useI18n()
const orderedDays = computed(() => [1, 2, 3, 4, 5, 6, 0].map(day => model.value.weekly.find(entry => entry.dayOfWeek === day)!).filter(Boolean))
const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

function dayName(day: number) {
  return t(`admin.settingsGlobalPage.days.${dayKeys[day]}`)
}

function ensureRange(day: RentalWeeklyDay) {
  if (day.enabled && !day.ranges.length) day.ranges.push({ start: '09:00', end: '18:00' })
}

function addRange(day: RentalWeeklyDay) {
  const previous = day.ranges.at(-1)
  day.ranges.push(previous ? { start: previous.end, end: '18:00' } : { start: '09:00', end: '18:00' })
}

function removeRange(day: RentalWeeklyDay, index: number) {
  day.ranges.splice(index, 1)
  if (!day.ranges.length) day.enabled = false
}

function addClosure() {
  model.value.closures.push({
    id: globalThis.crypto?.randomUUID?.() ?? `closure-${Date.now()}`,
    label: '',
    startDate: '',
    endDate: '',
  })
}
</script>
