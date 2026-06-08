<template>
  <div class="space-y-8" v-if="ready">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.settingsUpdatesPage.title') }}</h1>
        <p class="mt-2 max-w-4xl text-sm opacity-70">{{ t('admin.settingsUpdatesPage.description') }}</p>
      </div>
      <button class="btn btn-outline" @click="loadStatus">{{ t('admin.settingsUpdatesPage.refresh') }}</button>
    </div>

    <section class="grid gap-4 md:grid-cols-3">
      <article class="rounded-box border border-base-300 bg-base-100 p-5">
        <div class="text-sm font-medium opacity-70">{{ t('admin.settingsUpdatesPage.agentStatus') }}</div>
        <div class="mt-2 text-lg font-semibold">
          {{ status?.agentReachable ? t('admin.settingsUpdatesPage.agentConfigured') : t('admin.settingsUpdatesPage.agentNotConfigured') }}
        </div>
      </article>
      <article class="rounded-box border border-base-300 bg-base-100 p-5">
        <div class="text-sm font-medium opacity-70">{{ t('admin.settingsUpdatesPage.currentVersion') }}</div>
        <div class="mt-2 text-lg font-semibold">{{ status?.currentVersion || '-' }}</div>
      </article>
      <article class="rounded-box border border-base-300 bg-base-100 p-5">
        <div class="text-sm font-medium opacity-70">{{ t('admin.settingsUpdatesPage.releaseChannel') }}</div>
        <div class="mt-2 text-lg font-semibold">{{ status?.releaseChannel || 'stable' }}</div>
      </article>
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6">
      <h2 class="text-xl font-semibold">{{ t('admin.settingsUpdatesPage.availableReleases') }}</h2>
      <div class="mt-4 overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('admin.settingsUpdatesPage.version') }}</th>
              <th>{{ t('admin.settingsUpdatesPage.channel') }}</th>
              <th>{{ t('admin.settingsUpdatesPage.createdAt') }}</th>
              <th>{{ t('admin.settingsUpdatesPage.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="release in status?.releases || []" :key="release.id">
              <td>{{ release.version }}</td>
              <td>{{ release.channel }}</td>
              <td>{{ formatDate(release.createdAt) }}</td>
              <td>
                <button class="btn btn-sm btn-primary" :disabled="deploying" @click="deployRelease(release.version)">
                  <span v-if="deploying" class="loading loading-spinner loading-xs" />
                  {{ t('admin.settingsUpdatesPage.deploy') }}
                </button>
              </td>
            </tr>
            <tr v-if="!(status?.releases || []).length">
              <td colspan="4" class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.noReleases') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6">
      <h2 class="text-xl font-semibold">{{ t('admin.settingsUpdatesPage.jobs') }}</h2>
      <div class="mt-4 space-y-4">
        <article v-for="job in status?.jobs || []" :key="job.id" class="rounded-xl border border-base-300 p-4">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div class="font-medium">{{ job.version }}</div>
              <div class="text-sm opacity-70">{{ job.status }} · {{ formatDate(job.updatedAt) }}</div>
            </div>
            <button class="btn btn-sm" @click="refreshJob(job.id)">{{ t('admin.settingsUpdatesPage.refreshJob') }}</button>
          </div>
          <ul class="mt-4 space-y-2 text-sm">
            <li v-for="log in job.logs" :key="log.id" class="rounded-lg bg-base-200 px-3 py-2">
              {{ formatDate(log.createdAt) }} - {{ log.message }}
            </li>
          </ul>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '#modula/shared/adminRoutes'
import type { CmsRegistryDeploymentJob, CmsRegistryReleaseRecord } from '#modula/shared/registry'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.settingsUpdates
  }
})

const { t } = useI18n()
const { $toast } = useNuxtApp() as any
const deploying = ref(false)
const status = ref<{
  configured: boolean
  agentReachable: boolean
  currentVersion: string | null
  releaseChannel: string
  releases: CmsRegistryReleaseRecord[]
  jobs: CmsRegistryDeploymentJob[]
} | null>(null)

const loadStatus = async () => {
  status.value = await $fetch('/api/admin/updates/status')
}

await loadStatus()

const ready = computed(() => Boolean(status.value))

const deployRelease = async (version: string) => {
  deploying.value = true
  try {
    const job = await $fetch<CmsRegistryDeploymentJob>('/api/admin/updates/deploy', {
      method: 'POST',
      body: { version }
    })
    status.value?.jobs.unshift(job)
    $toast?.success(t('admin.settingsUpdatesPage.deploymentStarted'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || t('admin.settingsUpdatesPage.deployError'))
  } finally {
    deploying.value = false
  }
}

const refreshJob = async (id: string) => {
  try {
    const job = await $fetch<CmsRegistryDeploymentJob>(`/api/admin/updates/jobs/${encodeURIComponent(id)}`)
    if (!status.value) return
    const index = status.value.jobs.findIndex(item => item.id === id)
    if (index >= 0) {
      status.value.jobs.splice(index, 1, job)
    } else {
      status.value.jobs.unshift(job)
    }
  } catch (error: any) {
    $toast?.error(error?.data?.message || t('admin.settingsUpdatesPage.deployError'))
  }
}

const formatDate = (value: string) => new Date(value).toLocaleString()
</script>
