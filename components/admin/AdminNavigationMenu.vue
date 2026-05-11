<template>
  <nav v-if="variant === 'sidebar'" class="space-y-5">
    <section v-for="section in sections" :key="section.id" class="space-y-2">
      <div class="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-55" :class="collapsed ? 'text-center' : ''">
        <span v-if="!collapsed">{{ section.label }}</span>
        <span v-else>•</span>
      </div>

      <div class="space-y-1">
        <NuxtLink
          v-for="item in section.items"
          :key="item.id"
          :to="localePath(item.path)"
          class="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm transition"
          :class="linkClass(item)"
        >
          <Icon v-if="item.icon" :name="item.icon" size="18" class="shrink-0" />
          <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </section>
  </nav>

  <div v-else class="space-y-3">
    <div v-for="section in sections" :key="section.id" class="space-y-1">
      <div class="px-1 text-xs font-semibold uppercase tracking-[0.14em] opacity-60">
        {{ section.label }}
      </div>
      <div class="space-y-1">
        <NuxtLink
          v-for="item in section.items"
          :key="item.id"
          :to="localePath(item.path)"
          class="block rounded-lg px-3 py-2 text-sm transition hover:bg-base-200"
          :class="isActive(item) ? 'bg-base-200 font-medium text-primary' : ''"
        >
          {{ item.label }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminNavigationItem, AdminNavigationSection } from '~/shared/adminNavigation'

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

const linkClass = (item: AdminNavigationItem) => {
  const active = isActive(item)
  return {
    'justify-center': props.collapsed,
    'bg-primary text-primary-content shadow-sm': active,
    'hover:bg-base-200': !active
  }
}
</script>
