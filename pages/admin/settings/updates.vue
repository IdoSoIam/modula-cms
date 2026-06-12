<template>
  <div class="space-y-8" v-if="ready">
    <div v-if="confirmModal" class="fixed inset-0 z-[1010] flex items-center justify-center bg-neutral/45 px-4">
      <div class="w-full max-w-2xl rounded-[1.5rem] border border-base-300 bg-base-100 p-6 shadow-2xl">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-semibold">{{ confirmModal.title }}</h2>
            <p class="mt-2 text-sm opacity-75">{{ confirmModal.description }}</p>
          </div>
          <button class="btn btn-ghost btn-sm" @click="closeConfirmModal">{{ t('common.cancel') }}</button>
        </div>

        <div class="mt-5 rounded-xl border border-base-300 bg-base-200/50 p-4 text-sm">
          <div class="flex flex-wrap gap-x-6 gap-y-2">
            <div>
              <div class="font-medium opacity-70">{{ t('admin.settingsUpdatesPage.currentVersion') }}</div>
              <div>{{ status?.currentVersion || '-' }}</div>
            </div>
            <div>
              <div class="font-medium opacity-70">{{ t('admin.settingsUpdatesPage.targetVersion') }}</div>
              <div>{{ confirmModal.release.version }}</div>
            </div>
            <div>
              <div class="font-medium opacity-70">{{ t('admin.settingsUpdatesPage.channel') }}</div>
              <div>{{ confirmModal.release.channel }}</div>
            </div>
          </div>
          <div v-if="confirmModal.warning" class="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-warning-content">
            {{ confirmModal.warning }}
          </div>
        </div>

        <div class="mt-6 flex flex-wrap justify-end gap-3">
          <button class="btn btn-ghost" @click="closeConfirmModal">{{ t('common.cancel') }}</button>
          <button
            v-for="action in confirmModal.actions"
            :key="action.key"
            class="btn"
            :class="action.tone === 'warning' ? 'btn-warning' : action.tone === 'neutral' ? 'btn-outline' : 'btn-primary'"
            :disabled="deploying || rollingBack"
            @click="runConfirmAction(action.key)"
          >
            <span v-if="(deploying || rollingBack) && confirmActionInFlight === action.key" class="loading loading-spinner loading-xs" />
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="updateOverlayVisible" class="fixed inset-0 z-[1000] flex items-center justify-center bg-base-100/95 backdrop-blur-sm m-0">
      <div class="mx-4 w-full max-w-xl rounded-[1.5rem] border border-base-300 bg-base-100 p-8 shadow-2xl">
        <div class="flex items-center gap-4">
          <span class="loading loading-spinner loading-lg text-primary" />
          <div>
            <h2 class="text-2xl font-semibold">{{ t('admin.settingsUpdatesPage.overlayTitle') }}</h2>
            <p class="mt-2 text-sm opacity-70">{{ overlayMessage }}</p>
          </div>
        </div>
        <progress class="progress progress-primary mt-6 w-full" :value="overlayProgress" max="100" />
        <div class="mt-3 text-sm opacity-70">{{ overlayStep }}</div>
      </div>
    </div>

    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.settingsUpdatesPage.title') }}</h1>
        <p class="mt-2 max-w-4xl text-sm opacity-70">{{ t('admin.settingsUpdatesPage.description') }}</p>
      </div>
      <button class="btn btn-outline" @click="loadStatus(true, true)">{{ t('admin.settingsUpdatesPage.refresh') }}</button>
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
        <div class="text-sm font-medium opacity-70">{{ t('admin.settingsUpdatesPage.rollbackVersion') }}</div>
        <div class="mt-2 text-lg font-semibold">{{ status?.rollbackVersion || '-' }}</div>
      </article>
    </section>

    <section v-if="!status?.updatesEnabled" class="rounded-box border border-warning/30 bg-warning/10 p-6">
      <h2 class="text-xl font-semibold">{{ t('admin.settingsUpdatesPage.updatesDisabledTitle') }}</h2>
      <p class="mt-2 text-sm opacity-80">{{ updatesDisabledMessage }}</p>
      <ul class="mt-4 space-y-2 text-sm opacity-80">
        <li>{{ t('admin.settingsUpdatesPage.manualUpdateStepPull') }}</li>
        <li>{{ t('admin.settingsUpdatesPage.manualUpdateStepInstall') }}</li>
        <li>{{ t('admin.settingsUpdatesPage.manualUpdateStepMigrate') }}</li>
        <li>{{ t('admin.settingsUpdatesPage.manualUpdateStepRestart') }}</li>
      </ul>
    </section>

    <section v-if="activeJob" class="rounded-box border border-base-300 bg-base-100 p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold">{{ t('admin.settingsUpdatesPage.currentJob') }}</h2>
          <p class="mt-1 text-sm opacity-70">{{ activeJob.version }} · {{ activeJob.status }}</p>
        </div>
        <div class="text-sm font-medium">{{ activeJob.metadata?.progressPercent || 0 }}%</div>
      </div>
      <progress class="progress progress-primary mt-4 w-full" :value="activeJob.metadata?.progressPercent || 0" max="100" />
      <div class="mt-3 text-sm opacity-70">
        {{ formatStep(activeJob.metadata?.currentStep, activeJob.status) }}
      </div>
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h2 class="text-xl font-semibold">{{ t('admin.settingsUpdatesPage.availableReleases') }}</h2>
        <div class="flex flex-wrap items-center gap-2">
          <button class="btn btn-ghost btn-sm" :disabled="releasesPagination.offset === 0" @click="changeReleasesPage(-1)">
            {{ t('admin.settingsUpdatesPage.previousPage') }}
          </button>
          <button class="btn btn-ghost btn-sm" :disabled="!releasesPagination.hasMore" @click="changeReleasesPage(1)">
            {{ t('admin.settingsUpdatesPage.nextPage') }}
          </button>
        </div>
      </div>
      <p class="mt-2 text-sm opacity-70">
        {{ t('admin.settingsUpdatesPage.paginationSummary', {
          start: releasesRange.start,
          end: releasesRange.end,
          total: releasesPagination.total
        }) }}
      </p>
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
            <tr v-for="release in releases" :key="release.id">
              <td>
                <div class="font-medium">{{ release.version }}</div>
                <div class="mt-1 text-xs opacity-70">{{ releaseMeta(release).hint }}</div>
              </td>
              <td>{{ release.channel }}</td>
              <td>{{ formatDate(release.createdAt) }}</td>
              <td>
                <button
                  class="btn btn-sm"
                  :class="releaseMeta(release).disabled ? 'btn-ghost' : 'btn-primary'"
                  :disabled="deploying || rollingBack || !status?.updatesEnabled || !status?.agentReachable || activeJobRunning || releaseMeta(release).disabled"
                  @click="openReleaseConfirm(release)"
                >
                  <span v-if="(deploying || rollingBack) && confirmActionInFlight && confirmModal?.release.id === release.id" class="loading loading-spinner loading-xs" />
                  {{ releaseMeta(release).label }}
                </button>
              </td>
            </tr>
            <tr v-if="!releases.length">
              <td colspan="4" class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.noReleases') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h2 class="text-xl font-semibold">{{ t('admin.settingsUpdatesPage.jobs') }}</h2>
        <div class="flex flex-wrap items-center gap-2">
          <button class="btn btn-ghost btn-sm" :disabled="jobsPagination.offset === 0" @click="changeJobsPage(-1)">
            {{ t('admin.settingsUpdatesPage.previousPage') }}
          </button>
          <button class="btn btn-ghost btn-sm" :disabled="!jobsPagination.hasMore" @click="changeJobsPage(1)">
            {{ t('admin.settingsUpdatesPage.nextPage') }}
          </button>
          <button class="btn btn-outline btn-sm" :disabled="rollingBack || !status?.updatesEnabled || !status?.agentReachable || !status?.rollbackCapabilities?.fast?.available || activeJobRunning" @click="rollbackRelease('fast')">
            <span v-if="rollingBack" class="loading loading-spinner loading-xs" />
            {{ t('admin.settingsUpdatesPage.rollbackFast') }}
          </button>
          <button class="btn btn-outline btn-sm" :disabled="rollingBack || !status?.updatesEnabled || !status?.agentReachable || !status?.rollbackCapabilities?.full?.available || activeJobRunning" @click="rollbackRelease('full')">
            <span v-if="rollingBack" class="loading loading-spinner loading-xs" />
            {{ t('admin.settingsUpdatesPage.rollbackFull') }}
          </button>
        </div>
      </div>
      <div class="mt-3 space-y-2 text-sm opacity-80">
        <p>{{ t('admin.settingsUpdatesPage.rollbackHelpFast') }}</p>
        <p>{{ fastRollbackStatus }}</p>
        <p>{{ fullRollbackStatus }}</p>
        <p class="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-warning-content">
          {{ fullRollbackWarning }}
        </p>
      </div>
      <p class="mt-2 text-sm opacity-70">
        {{ t('admin.settingsUpdatesPage.paginationSummary', {
          start: jobsRange.start,
          end: jobsRange.end,
          total: jobsPagination.total
        }) }}
      </p>
      <div class="mt-4 space-y-4">
        <article v-for="job in jobs" :key="job.id" class="rounded-xl border border-base-300 p-4">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div class="font-medium">{{ job.version }}</div>
              <div class="text-sm opacity-70">{{ job.status }} · {{ formatDate(job.updatedAt) }}</div>
              <div v-if="job.metadata?.rollbackStrategy" class="text-sm opacity-70">
                {{ t('admin.settingsUpdatesPage.rollbackStrategyLabel') }}: {{ formatRollbackStrategy(job.metadata?.rollbackStrategy) }}
              </div>
            </div>
            <button class="btn btn-sm" @click="refreshJob(job.id)">{{ t('admin.settingsUpdatesPage.refreshJob') }}</button>
          </div>
          <progress class="progress progress-primary mt-4 w-full" :value="job.metadata?.progressPercent || 0" max="100" />
          <div class="mt-2 text-sm opacity-70">{{ formatStep(job.metadata?.currentStep, job.status) }}</div>
          <ul class="mt-4 space-y-2 text-sm">
            <li v-for="log in job.logs" :key="log.id" class="rounded-lg bg-base-200 px-3 py-2">
              {{ formatDate(log.createdAt) }} - {{ log.message }}
            </li>
          </ul>
        </article>
        <div v-if="!jobs.length" class="text-sm opacity-70">
          {{ t('admin.settingsUpdatesPage.noJobs') }}
        </div>
      </div>
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6">
      <h2 class="text-xl font-semibold">{{ t('admin.settingsUpdatesPage.systemInfoTitle') }}</h2>
      <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.runtimeTarget') }}</div>
          <div class="mt-1 font-medium">{{ status?.systemInfo?.runtimeTarget || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.appVersion') }}</div>
          <div class="mt-1 font-medium">{{ status?.systemInfo?.appVersion || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.nodeVersion') }}</div>
          <div class="mt-1 font-medium">{{ status?.systemInfo?.nodeVersion || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.npmVersion') }}</div>
          <div class="mt-1 font-medium">{{ status?.systemInfo?.npmVersion || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.nuxtVersion') }}</div>
          <div class="mt-1 font-medium">{{ status?.systemInfo?.nuxtVersion || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.nitroVersion') }}</div>
          <div class="mt-1 font-medium">{{ status?.systemInfo?.nitroVersion || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.osVersion') }}</div>
          <div class="mt-1 font-medium">{{ status?.systemInfo?.platform || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.architecture') }}</div>
          <div class="mt-1 font-medium">{{ status?.systemInfo?.architecture || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.hostname') }}</div>
          <div class="mt-1 font-medium">{{ status?.systemInfo?.hostname || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.freeMemoryMb') }}</div>
          <div class="mt-1 font-medium">{{ status?.systemInfo?.freeMemoryMb ?? '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.totalMemoryMb') }}</div>
          <div class="mt-1 font-medium">{{ status?.systemInfo?.totalMemoryMb ?? '-' }}</div>
        </article>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '#modula/shared/adminRoutes'
import type { CmsRegistryDeploymentJob, CmsRegistryPaginatedResult, CmsRegistryReleaseRecord, CmsRegistryRollbackCapabilities } from '#modula/shared/registry'

type ReleaseActionKey = 'deploy' | 'rollback-fast' | 'rollback-full'

type ReleaseActionDescriptor = {
  key: ReleaseActionKey
  label: string
  tone: 'primary' | 'warning' | 'neutral'
}

type ReleaseMeta = {
  kind: 'current' | 'upgrade' | 'rollback-choice' | 'rollback-fast' | 'rollback-full' | 'unavailable'
  label: string
  hint: string
  disabled: boolean
  reason: string | null
  actions: ReleaseActionDescriptor[]
  warning: string | null
}

type ConfirmModalState = {
  release: CmsRegistryReleaseRecord
  meta: ReleaseMeta
  title: string
  description: string
  warning: string | null
  actions: ReleaseActionDescriptor[]
}

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.settingsUpdates
  }
})

const { t } = useI18n()
const { $toast } = useNuxtApp() as any
const authHeaders = process.server ? useRequestHeaders(['cookie']) : undefined
const deploying = ref(false)
const rollingBack = ref(false)
const reconnecting = ref(false)
const overlayJob = ref<CmsRegistryDeploymentJob | null>(null)
const confirmModal = ref<ConfirmModalState | null>(null)
const confirmActionInFlight = ref<ReleaseActionKey | null>(null)
const releases = ref<CmsRegistryReleaseRecord[]>([])
const releasesPagination = reactive({
  total: 0,
  limit: 10,
  offset: 0,
  hasMore: false
})
const jobs = ref<CmsRegistryDeploymentJob[]>([])
const jobsPagination = reactive({
  total: 0,
  limit: 10,
  offset: 0,
  hasMore: false
})
let pollTimer: ReturnType<typeof setInterval> | null = null
let reconnectTimer: ReturnType<typeof setInterval> | null = null
const status = ref<{
  configured: boolean
  updatesEnabled: boolean
  updatesDisabledReason: string | null
  agentReachable: boolean
  currentVersion: string | null
  rollbackVersion: string | null
  releaseChannel: string
  releases: CmsRegistryReleaseRecord[]
  releasesPagination: CmsRegistryPaginatedResult<CmsRegistryReleaseRecord>
  jobs: CmsRegistryDeploymentJob[]
  jobsPagination: CmsRegistryPaginatedResult<CmsRegistryDeploymentJob>
  rollbackCapabilities: CmsRegistryRollbackCapabilities
  systemInfo: {
    appVersion: string | null
    runtimeTarget: string | null
    nodeVersion: string | null
    npmVersion: string | null
    nuxtVersion: string | null
    nitroVersion: string | null
    platform: string | null
    architecture: string | null
    hostname: string | null
    totalMemoryMb: number | null
    freeMemoryMb: number | null
  }
} | null>(null)

async function apiFetch<T>(url: string, options: Parameters<typeof $fetch<T>>[1] = {}) {
  if (process.server) {
    const requestFetch = useRequestFetch()
    return await requestFetch<T>(url, {
      ...options,
      headers: {
        ...(authHeaders || {}),
        ...((options as any)?.headers || {})
      }
    })
  }

  return await $fetch<T>(url, options)
}

function syncJobsFromStatus() {
  jobs.value = status.value?.jobs || []
  jobsPagination.total = status.value?.jobsPagination?.total || jobs.value.length
  jobsPagination.limit = status.value?.jobsPagination?.limit || Math.max(jobs.value.length, 1)
  jobsPagination.offset = status.value?.jobsPagination?.offset || 0
  jobsPagination.hasMore = status.value?.jobsPagination?.hasMore || false
}

function syncReleasesFromStatus() {
  releases.value = status.value?.releases || []
  releasesPagination.total = status.value?.releasesPagination?.total || releases.value.length
  releasesPagination.limit = status.value?.releasesPagination?.limit || Math.max(releases.value.length, 1)
  releasesPagination.offset = status.value?.releasesPagination?.offset || 0
  releasesPagination.hasMore = status.value?.releasesPagination?.hasMore || false
}

const loadStatus = async (preserveJobsPage = false, preserveReleasesPage = false) => {
  const previousReleasesOffset = releasesPagination.offset
  const previousOffset = jobsPagination.offset
  status.value = await apiFetch('/api/admin/updates/status')
  syncReleasesFromStatus()
  syncJobsFromStatus()
  if (preserveReleasesPage && previousReleasesOffset > 0) {
    await loadReleasesPage(previousReleasesOffset)
  }
  if (preserveJobsPage && previousOffset > 0) {
    await loadJobsPage(previousOffset)
  }
}

await loadStatus()

const ready = computed(() => Boolean(status.value))
const activeJob = computed(() => jobs.value.find(job => job.status === 'pending' || job.status === 'running') || null)
const activeJobRunning = computed(() => Boolean(activeJob.value))
const releasesRange = computed(() => {
  if (!releasesPagination.total) {
    return { start: 0, end: 0 }
  }
  return {
    start: releasesPagination.offset + 1,
    end: Math.min(releasesPagination.offset + releases.value.length, releasesPagination.total)
  }
})
const jobsRange = computed(() => {
  if (!jobsPagination.total) {
    return { start: 0, end: 0 }
  }
  return {
    start: jobsPagination.offset + 1,
    end: Math.min(jobsPagination.offset + jobs.value.length, jobsPagination.total)
  }
})
const fastRollbackStatus = computed(() => {
  const rollback = status.value?.rollbackCapabilities?.fast
  if (rollback?.available) {
    return t('admin.settingsUpdatesPage.rollbackFastAvailable')
  }
  return `${t('admin.settingsUpdatesPage.rollbackFastUnavailable')} ${rollback?.reason || ''}`.trim()
})
const fullRollbackStatus = computed(() => {
  const rollback = status.value?.rollbackCapabilities?.full
  if (rollback?.available) {
    return rollback?.backupCreatedAt
      ? t('admin.settingsUpdatesPage.rollbackFullAvailableWithBackup', { date: formatDate(rollback.backupCreatedAt) })
      : t('admin.settingsUpdatesPage.rollbackFullAvailable')
  }
  return `${t('admin.settingsUpdatesPage.rollbackFullUnavailable')} ${rollback?.reason || ''}`.trim()
})
const fullRollbackWarning = computed(() => status.value?.rollbackCapabilities?.full?.warning || t('admin.settingsUpdatesPage.rollbackFullWarning'))
const updateOverlayVisible = computed(() => reconnecting.value || Boolean(overlayJob.value))
const overlayProgress = computed(() => overlayJob.value?.metadata?.progressPercent ?? (reconnecting.value ? 95 : 0))
const overlayStep = computed(() => {
  if (reconnecting.value) return t('admin.settingsUpdatesPage.steps.reconnecting')
  return formatStep(overlayJob.value?.metadata?.currentStep, overlayJob.value?.status)
})
const overlayMessage = computed(() => reconnecting.value
  ? t('admin.settingsUpdatesPage.overlayReconnect')
  : t('admin.settingsUpdatesPage.overlayDeploying'))
const updatesDisabledMessage = computed(() => {
  if (status.value?.updatesDisabledReason === 'cloudflare') {
    return t('admin.settingsUpdatesPage.updatesDisabledCloudflare')
  }
  return t('admin.settingsUpdatesPage.updatesDisabledDevelopment')
})

const compareVersions = (left: string, right: string) => {
  const leftParts = left.split('.').map(part => Number.parseInt(part, 10))
  const rightParts = right.split('.').map(part => Number.parseInt(part, 10))
  const length = Math.max(leftParts.length, rightParts.length)
  for (let index = 0; index < length; index += 1) {
    const leftValue = Number.isFinite(leftParts[index]) ? leftParts[index]! : 0
    const rightValue = Number.isFinite(rightParts[index]) ? rightParts[index]! : 0
    if (leftValue > rightValue) return 1
    if (leftValue < rightValue) return -1
  }
  return left.localeCompare(right)
}

const releaseMeta = (release: CmsRegistryReleaseRecord): ReleaseMeta => {
  const currentVersion = status.value?.currentVersion || null
  const rollbackVersion = status.value?.rollbackVersion || null
  const rollbackCapabilities = status.value?.rollbackCapabilities

  if (release.version === currentVersion) {
    return {
      kind: 'current',
      label: t('admin.settingsUpdatesPage.currentRelease'),
      hint: t('admin.settingsUpdatesPage.currentReleaseHint'),
      disabled: true,
      reason: null,
      actions: [],
      warning: null
    }
  }

  if (!currentVersion || compareVersions(release.version, currentVersion) > 0) {
    return {
      kind: 'upgrade',
      label: t('admin.settingsUpdatesPage.deploy'),
      hint: t('admin.settingsUpdatesPage.deployUpgradeHint'),
      disabled: !status.value?.updatesEnabled,
      reason: null,
      actions: [
        {
          key: 'deploy',
          label: t('admin.settingsUpdatesPage.confirmDeploy'),
          tone: 'primary'
        }
      ],
      warning: null
    }
  }

  if (release.version !== rollbackVersion) {
    return {
      kind: 'unavailable',
      label: t('admin.settingsUpdatesPage.deploy'),
      hint: t('admin.settingsUpdatesPage.rollbackNeedsMatchingBackup'),
      disabled: true,
      reason: t('admin.settingsUpdatesPage.rollbackNeedsMatchingBackup'),
      actions: [],
      warning: null
    }
  }

  const fastAvailable = Boolean(rollbackCapabilities?.fast?.available)
  const fullAvailable = Boolean(rollbackCapabilities?.full?.available)
  const fallbackReason = rollbackCapabilities?.full?.reason || rollbackCapabilities?.fast?.reason || t('admin.settingsUpdatesPage.rollbackUnavailable')
  const fullWarning = rollbackCapabilities?.full?.warning || t('admin.settingsUpdatesPage.rollbackFullWarning')

  if (!fastAvailable && !fullAvailable) {
    return {
      kind: 'unavailable',
      label: t('admin.settingsUpdatesPage.deploy'),
      hint: fallbackReason,
      disabled: true,
      reason: fallbackReason,
      actions: [],
      warning: null
    }
  }

  if (fastAvailable && fullAvailable) {
    return {
      kind: 'rollback-choice',
      label: t('admin.settingsUpdatesPage.deploy'),
      hint: t('admin.settingsUpdatesPage.rollbackChoiceHint'),
      disabled: !status.value?.updatesEnabled,
      reason: null,
      actions: [
        {
          key: 'rollback-fast',
          label: t('admin.settingsUpdatesPage.confirmRollbackFast'),
          tone: 'neutral'
        },
        {
          key: 'rollback-full',
          label: t('admin.settingsUpdatesPage.confirmRollbackFull'),
          tone: 'warning'
        }
      ],
      warning: fullWarning
    }
  }

  if (fastAvailable) {
    return {
      kind: 'rollback-fast',
      label: t('admin.settingsUpdatesPage.deploy'),
      hint: t('admin.settingsUpdatesPage.rollbackFastOnlyHint'),
      disabled: !status.value?.updatesEnabled,
      reason: null,
      actions: [
        {
          key: 'rollback-fast',
          label: t('admin.settingsUpdatesPage.confirmRollbackFast'),
          tone: 'primary'
        }
      ],
      warning: null
    }
  }

  return {
    kind: 'rollback-full',
    label: t('admin.settingsUpdatesPage.deploy'),
    hint: t('admin.settingsUpdatesPage.rollbackFullOnlyHint'),
    disabled: !status.value?.updatesEnabled,
    reason: null,
    actions: [
      {
        key: 'rollback-full',
        label: t('admin.settingsUpdatesPage.confirmRollbackFull'),
        tone: 'warning'
      }
    ],
    warning: fullWarning
  }
}

async function loadReleasesPage(offset = releasesPagination.offset) {
  const page = await apiFetch<CmsRegistryPaginatedResult<CmsRegistryReleaseRecord>>('/api/admin/updates/releases', {
    query: {
      limit: releasesPagination.limit,
      offset
    }
  })
  releases.value = page.items
  releasesPagination.total = page.total
  releasesPagination.limit = page.limit
  releasesPagination.offset = page.offset
  releasesPagination.hasMore = page.hasMore
}

async function changeReleasesPage(direction: -1 | 1) {
  const nextOffset = Math.max(releasesPagination.offset + (direction * releasesPagination.limit), 0)
  if (direction > 0 && !releasesPagination.hasMore) return
  if (direction < 0 && releasesPagination.offset === 0) return
  await loadReleasesPage(nextOffset)
}

const deployRelease = async (version: string) => {
  deploying.value = true
  try {
    const job = await apiFetch<CmsRegistryDeploymentJob>('/api/admin/updates/deploy', {
      method: 'POST',
      body: { version }
    })
    jobsPagination.offset = 0
    jobs.value.unshift(job)
    jobs.value = jobs.value.slice(0, jobsPagination.limit)
    jobsPagination.total += 1
    jobsPagination.hasMore = jobsPagination.total > jobs.value.length
    overlayJob.value = job
    if (import.meta.client) {
      sessionStorage.setItem('modula:update-pending', JSON.stringify({ version, startedAt: Date.now() }))
    }
    ensurePolling()
    $toast?.success(t('admin.settingsUpdatesPage.deploymentStarted'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || t('admin.settingsUpdatesPage.deployError'))
  } finally {
    deploying.value = false
  }
}

const rollbackRelease = async (mode: 'fast' | 'full') => {
  rollingBack.value = true
  try {
    const job = await apiFetch<CmsRegistryDeploymentJob>('/api/admin/updates/rollback', {
      method: 'POST',
      body: { mode }
    })
    jobsPagination.offset = 0
    jobs.value.unshift(job)
    jobs.value = jobs.value.slice(0, jobsPagination.limit)
    jobsPagination.total += 1
    jobsPagination.hasMore = jobsPagination.total > jobs.value.length
    overlayJob.value = job
    if (import.meta.client) {
      sessionStorage.setItem('modula:update-pending', JSON.stringify({ version: job.version, startedAt: Date.now(), mode: `rollback-${mode}` }))
    }
    ensurePolling()
    $toast?.success(mode === 'full'
      ? t('admin.settingsUpdatesPage.rollbackFullStarted')
      : t('admin.settingsUpdatesPage.rollbackStarted'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || t('admin.settingsUpdatesPage.rollbackError'))
  } finally {
    rollingBack.value = false
  }
}

const openReleaseConfirm = (release: CmsRegistryReleaseRecord) => {
  const meta = releaseMeta(release)
  if (meta.disabled || !meta.actions.length) return

  confirmModal.value = {
    release,
    meta,
    title: meta.kind === 'upgrade'
      ? t('admin.settingsUpdatesPage.confirmDeployTitle', { version: release.version })
      : t('admin.settingsUpdatesPage.confirmRollbackTitle', { version: release.version }),
    description: meta.kind === 'upgrade'
      ? t('admin.settingsUpdatesPage.confirmDeployDescription', { current: status.value?.currentVersion || '-', target: release.version })
      : t('admin.settingsUpdatesPage.confirmRollbackDescription', { current: status.value?.currentVersion || '-', target: release.version }),
    warning: meta.warning,
    actions: meta.actions
  }
}

const closeConfirmModal = () => {
  if (deploying.value || rollingBack.value) return
  confirmModal.value = null
  confirmActionInFlight.value = null
}

const runConfirmAction = async (action: ReleaseActionKey) => {
  const modal = confirmModal.value
  if (!modal) return
  confirmActionInFlight.value = action
  try {
    if (action === 'deploy') {
      await deployRelease(modal.release.version)
    } else if (action === 'rollback-fast') {
      await rollbackRelease('fast')
    } else {
      await rollbackRelease('full')
    }
    confirmModal.value = null
  } finally {
    confirmActionInFlight.value = null
  }
}

const refreshJob = async (id: string, silent = false) => {
  try {
    const job = await apiFetch<CmsRegistryDeploymentJob>(`/api/admin/updates/jobs/${encodeURIComponent(id)}`)
    const index = jobs.value.findIndex(item => item.id === id)
    if (index >= 0) {
      jobs.value.splice(index, 1, job)
    }
    return job
  } catch (error: any) {
    if (!silent) {
      $toast?.error(error?.data?.message || t('admin.settingsUpdatesPage.deployError'))
    }
    throw error
  }
}

async function loadJobsPage(offset = jobsPagination.offset) {
  const page = await apiFetch<CmsRegistryPaginatedResult<CmsRegistryDeploymentJob>>('/api/admin/updates/jobs', {
    query: {
      limit: jobsPagination.limit,
      offset
    }
  })
  jobs.value = page.items
  jobsPagination.total = page.total
  jobsPagination.limit = page.limit
  jobsPagination.offset = page.offset
  jobsPagination.hasMore = page.hasMore
}

async function changeJobsPage(direction: -1 | 1) {
  const nextOffset = Math.max(jobsPagination.offset + (direction * jobsPagination.limit), 0)
  if (direction > 0 && !jobsPagination.hasMore) return
  if (direction < 0 && jobsPagination.offset === 0) return
  await loadJobsPage(nextOffset)
}

const refreshActiveJob = async () => {
  const trackedJob = overlayJob.value || activeJob.value
  if (!trackedJob) {
    overlayJob.value = null
    stopPolling()
    return
  }

  try {
    await refreshJob(trackedJob.id, true)
    await loadStatus(jobsPagination.offset > 0, releasesPagination.offset > 0)
    overlayJob.value = jobs.value.find(job => job.id === trackedJob.id) || null
    if (!overlayJob.value || !['pending', 'running'].includes(overlayJob.value.status)) {
      finalizeOverlay(overlayJob.value)
      stopPolling()
    }
  } catch {
    startReconnectMode()
    stopPolling()
  }
}

const ensurePolling = () => {
  if (pollTimer || !import.meta.client) return
  pollTimer = setInterval(() => {
    refreshActiveJob().catch(() => {})
  }, 1500)
}

const stopPolling = () => {
  if (!pollTimer) return
  clearInterval(pollTimer)
  pollTimer = null
}

const startReconnectMode = () => {
  reconnecting.value = true
  overlayJob.value = overlayJob.value || activeJob.value || null
  if (reconnectTimer || !import.meta.client) return
  reconnectTimer = setInterval(async () => {
    try {
      const response = await fetch('/api/health', { cache: 'no-store' })
      if (!response.ok) return
      stopReconnectMode()
      finalizeOverlaySuccess()
    } catch {}
  }, 1500)
}

const stopReconnectMode = () => {
  reconnecting.value = false
  if (!reconnectTimer) return
  clearInterval(reconnectTimer)
  reconnectTimer = null
}

const finalizeOverlaySuccess = () => {
  overlayJob.value = null
  stopReconnectMode()
  if (!import.meta.client) return
  sessionStorage.removeItem('modula:update-pending')
  sessionStorage.setItem('modula:update-success', '1')
  window.location.reload()
}

const finalizeOverlay = (job: CmsRegistryDeploymentJob | null) => {
  if (!job || job.status === 'completed') {
    finalizeOverlaySuccess()
    return
  }

  overlayJob.value = null
  stopReconnectMode()
  if (import.meta.client) {
    sessionStorage.removeItem('modula:update-pending')
  }

  if (job.status === 'rolled_back') {
    $toast?.error(t('admin.settingsUpdatesPage.rollbackPerformed'))
    return
  }

  $toast?.error(t('admin.settingsUpdatesPage.deployError'))
}

watch(activeJobRunning, (running) => {
  if (running) ensurePolling()
  else stopPolling()
}, { immediate: true })

onBeforeUnmount(() => {
  stopPolling()
  stopReconnectMode()
})

onMounted(async () => {
  if (!import.meta.client) return
  if (sessionStorage.getItem('modula:update-success') === '1') {
    sessionStorage.removeItem('modula:update-success')
    $toast?.success(t('admin.settingsUpdatesPage.deploymentFinished'))
  }

  const pending = sessionStorage.getItem('modula:update-pending')
  if (pending) {
    overlayJob.value = activeJob.value
    startReconnectMode()
  }
})

const formatStep = (step?: string, status?: CmsRegistryDeploymentJob['status']) => {
  if (!step) {
    if (status === 'completed') return t('admin.settingsUpdatesPage.steps.completed')
    if (status === 'failed') return t('admin.settingsUpdatesPage.steps.failed')
    if (status === 'rolled_back') return t('admin.settingsUpdatesPage.steps.rollback-complete')
    return t('admin.settingsUpdatesPage.stepIdle')
  }
  return t(`admin.settingsUpdatesPage.steps.${step}`, step)
}

const formatRollbackStrategy = (strategy?: 'fast' | 'full' | null) => {
  if (strategy === 'full') return t('admin.settingsUpdatesPage.rollbackFull')
  if (strategy === 'fast') return t('admin.settingsUpdatesPage.rollbackFast')
  return '-'
}

const formatDate = (value: string) => new Date(value).toLocaleString()
</script>
