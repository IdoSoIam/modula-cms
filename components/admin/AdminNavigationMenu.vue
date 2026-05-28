<template>
  <nav v-if="variant === 'sidebar'" class="space-y-3">
    <template v-for="section in sections" :key="section.id">
      <NuxtLink
        v-if="section.items.length === 1"
        :to="localePath(section.items[0]!.path)"
        class="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition"
        :class="linkClass(section.items[0]!)"
      >
        <Icon v-if="section.items[0]!.icon" :name="section.items[0]!.icon" size="18" class="shrink-0" />
        <span v-if="!collapsed" class="truncate">{{ t(section.items[0]!.labelKey) }}</span>
      </NuxtLink>

      <section v-else class="rounded-2xl border border-base-300/80 bg-base-200/40">
        <button
          type="button"
          class="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-base-100/60"
          :class="collapsed ? 'justify-center' : ''"
          @click="toggleSection(section.id)"
        >
          <Icon :name="section.icon || section.items[0]?.icon || 'mdi:folder-outline'" size="18" class="shrink-0" />
          <span v-if="!collapsed" class="flex-1 truncate">{{ t(section.labelKey) }}</span>
          <Icon
            v-if="!collapsed"
            :name="isSectionOpen(section.id) ? 'mdi:chevron-up' : 'mdi:chevron-down'"
            size="18"
            class="shrink-0 opacity-60"
          />
        </button>

        <div v-if="!collapsed && isSectionOpen(section.id)" class="space-y-1 px-2 pb-2">
          <NuxtLink
            v-for="item in section.items"
            :key="item.id"
            :to="localePath(item.path)"
            class="flex min-h-10 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition"
            :class="linkClass(item)"
          >
            <Icon v-if="item.icon" :name="item.icon" size="18" class="shrink-0" />
            <span class="truncate">{{ t(item.labelKey) }}</span>
          </NuxtLink>
        </div>
      </section>
    </template>
  </nav>

  <div v-else class="space-y-3">
    <div v-for="section in sections" :key="section.id" class="space-y-1">
      <div class="px-1 text-xs font-semibold uppercase tracking-[0.14em] opacity-60">
        {{ t(section.labelKey) }}
      </div>
      <div class="space-y-1">
        <NuxtLink
          v-for="item in section.items"
          :key="item.id"
          :to="localePath(item.path)"
          class="block cursor-pointer rounded-lg px-3 py-2 text-sm transition hover:bg-base-200"
          :class="isActive(item) ? 'bg-base-200 font-medium text-primary' : ''"
        >
          {{ t(item.labelKey) }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminNavigationItem, AdminNavigationSection } from '#modula/shared/adminNavigation'

const props = withDefaults(defineProps<{
  sections: AdminNavigationSection[]
  variant?: 'sidebar' | 'text'
  collapsed?: boolean
}>(), {
  variant: 'sidebar',
  collapsed: false
})

const localePath = useLocalePath()
const route = useRoute()
const { t } = useI18n()
const openSectionIds = ref<string[]>([])

const matchesPath = (path: string) => {
  const localizedPath = localePath(path)
  if (localizedPath === localePath('/admin')) {
    return route.path === localizedPath
  }
  return route.path === localizedPath || route.path.startsWith(`${localizedPath}/`)
}

const isActive = (item: AdminNavigationItem) => {
  const paths = item.activePaths?.length ? item.activePaths : [item.path]
  return paths.some(matchesPath)
}

const syncOpenSections = () => {
  const activeSectionIds = props.sections
    .filter(section => section.items.length > 1 && section.items.some(item => isActive(item)))
    .map(section => section.id)

  openSectionIds.value = Array.from(new Set([
    ...openSectionIds.value.filter(id => props.sections.some(section => section.id === id && section.items.length > 1)),
    ...activeSectionIds
  ]))
}

watch(() => route.path, syncOpenSections, { immediate: true })
watch(() => props.sections, syncOpenSections, { deep: true })

const isSectionOpen = (sectionId: string) => openSectionIds.value.includes(sectionId)

const toggleSection = (sectionId: string) => {
  if (openSectionIds.value.includes(sectionId)) {
    openSectionIds.value = openSectionIds.value.filter(id => id !== sectionId)
    return
  }

  openSectionIds.value = [...openSectionIds.value, sectionId]
}

const linkClass = (item: AdminNavigationItem) => {
  const active = isActive(item)
  return {
    'justify-center': props.collapsed,
    'bg-primary text-primary-content shadow-sm': active,
    'hover:bg-base-200': !active
  }
}
</script>
