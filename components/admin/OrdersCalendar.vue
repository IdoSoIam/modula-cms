<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body p-4">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button class="btn btn-sm btn-ghost" @click="$emit('change-month', -1)">
            <Icon name="mdi:chevron-left" size="18" />
          </button>

          <div class="relative">
            <button class="btn btn-sm btn-ghost text-base font-semibold normal-case" @click="$emit('toggle-month-picker')">
              {{ monthLabel }}
              <Icon name="mdi:chevron-down" size="16" />
            </button>

            <div
              v-if="showMonthPicker"
              class="absolute left-0 top-full z-10 mt-2 rounded-xl border border-base-300 bg-base-100 p-3 shadow-xl"
            >
              <label class="mb-2 block text-xs font-semibold uppercase opacity-60">{{ t('admin.ordersPage.monthPicker') }}</label>
              <input :value="monthInput" type="month" class="input input-bordered input-sm" @input="$emit('update:month-input', ($event.target as HTMLInputElement).value)" @change="$emit('apply-month-input')" />
            </div>
          </div>

          <button class="btn btn-sm btn-ghost" @click="$emit('change-month', 1)">
            <Icon name="mdi:chevron-right" size="18" />
          </button>
        </div>

        <button class="btn btn-sm btn-outline" @click="$emit('go-current-month')">{{ t('admin.ordersPage.today') }}</button>
      </div>

      <div class="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase opacity-60">
        <div v-for="day in dayNames" :key="day">{{ day }}</div>
      </div>

      <div class="grid grid-cols-7 gap-2">
        <button
          v-for="day in days"
          :key="day.iso"
          class="min-h-36 rounded-xl border p-2 text-left transition hover:border-primary/60"
          :class="[
            day.inCurrentMonth ? 'border-base-300 bg-base-100' : 'border-base-300/60 bg-base-300/50 opacity-70',
            day.isToday ? 'ring-2 ring-primary/40' : ''
          ]"
          @click="$emit('select-day', day)"
        >
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-semibold">{{ day.dayNumber }}</span>
            <span v-if="day.total" class="badge badge-sm">{{ day.page }}/{{ day.totalPages }}</span>
          </div>

          <div class="space-y-1">
            <div
              v-for="item in day.items"
              :key="item.id"
              class="cursor-pointer rounded-lg px-2 py-1 text-xs text-white"
              :class="eventClass(item.status)"
              @click.stop="$emit('select-item', item)"
            >
              <div class="truncate font-medium">{{ item.customerName }}</div>
              <div class="truncate opacity-90">{{ item.basket.name }}</div>
              <div v-if="item.time" class="truncate opacity-90">{{ item.time }}</div>
            </div>

            <div v-if="day.totalPages > 1" class="join mt-1 w-full">
              <button class="btn join-item btn-xs flex-1" :disabled="day.page === 1" @click.stop="$emit('change-day-page', day, day.page - 1)">
                <Icon name="mdi:chevron-left" size="14" />
              </button>
              <button class="btn join-item btn-xs flex-1" :disabled="day.page === day.totalPages" @click.stop="$emit('change-day-page', day, day.page + 1)">
                <Icon name="mdi:chevron-right" size="14" />
              </button>
            </div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  days: any[]
  monthLabel: string
  monthInput: string
  showMonthPicker: boolean
  dayNames: string[]
  eventClass: (status: string) => string
}>()

defineEmits<{
  'change-month': [offset: number]
  'toggle-month-picker': []
  'apply-month-input': []
  'go-current-month': []
  'select-day': [day: any]
  'select-item': [item: any]
  'change-day-page': [day: any, page: number]
  'update:month-input': [value: string]
}>()

const { t } = useI18n()
</script>
