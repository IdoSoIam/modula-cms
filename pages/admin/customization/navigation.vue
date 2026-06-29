<template>
  <div v-if="model" class="space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.customizationNavigationPage.title') }}</h1>
        <p class="mt-2 max-w-3xl text-sm opacity-70">
          {{ t('admin.customizationNavigationPage.description') }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button class="btn btn-outline" @click="resetToDefaultNavigation">{{ t('admin.customizationNavigationPage.reset') }}</button>
        <button class="btn btn-primary" :disabled="saving" @click="save">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          {{ t('admin.common.save') }}
        </button>
      </div>
    </div>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <div class="tabs tabs-box w-fit">
        <button type="button" class="tab" :class="activeMenuTab === 'PRIMARY' ? 'tab-active' : ''" @click="activeMenuTab = 'PRIMARY'">
          {{ t('admin.customizationNavigationPage.header') }}
        </button>
        <button type="button" class="tab" :class="activeMenuTab === 'FOOTER' ? 'tab-active' : ''" @click="activeMenuTab = 'FOOTER'">
          {{ t('admin.customizationNavigationPage.footer') }}
        </button>
      </div>

      <section
        class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100"
        :class="isOpen('nav-header') ? 'collapse-open' : 'collapse-close'"
      >
        <button type="button" class="collapse-title w-full text-left text-lg font-medium" @click="toggleAccordion('nav-header')">
          {{ activeMenuTab === 'PRIMARY' ? t('admin.customizationNavigationPage.header') : t('admin.customizationNavigationPage.footer') }}
        </button>
        <div class="collapse-content space-y-4">
          <div class="flex justify-end">
            <button class="btn btn-outline" @click="addNavigationItem(activeMenuTab)">{{ t('admin.customizationNavigationPage.addLink') }}</button>
          </div>

          <article
            v-for="(item, index) in activeItems"
            :key="item.id ?? `new-${index}`"
            class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100"
            :class="isOpen(`nav-item-${item.navigationItemKey || index}`) ? 'collapse-open' : 'collapse-close'"
          >
            <button type="button" class="collapse-title w-full text-left font-medium" @click="toggleAccordion(`nav-item-${item.navigationItemKey || index}`)">
              {{ previewText(item.labels) || item.title || t('admin.customizationNavigationPage.link', { index: index + 1 }) }}
            </button>
            <div class="collapse-content space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="text-sm opacity-70">{{ t('admin.customizationNavigationPage.link', { index: index + 1 }) }}</div>
                <button class="btn btn-outline btn-error btn-xs" @click="removeNavigationItem(item)">{{ t('admin.common.delete') }}</button>
              </div>

              <div class="grid gap-4 lg:grid-cols-3">
                <label class="form-control gap-2">
                  <span class="label"><span class="label-text">{{ t('admin.customizationNavigationPage.menuZone') }}</span></span>
                  <select v-model="item.menu" class="select select-bordered w-full">
                    <option value="PRIMARY">{{ t('admin.customizationNavigationPage.header') }}</option>
                    <option value="FOOTER">{{ t('admin.customizationNavigationPage.footer') }}</option>
                  </select>
                </label>

                <label class="form-control gap-2">
                  <span class="label"><span class="label-text">{{ t('admin.customizationNavigationPage.type') }}</span></span>
                  <select v-model="item.itemType" class="select select-bordered w-full">
                    <option value="CMS_PAGE">{{ t('admin.customizationNavigationPage.typeCmsPage') }}</option>
                    <option value="APPLICATION_ROUTE">{{ t('admin.customizationNavigationPage.typeApplicationRoute') }}</option>
                    <option value="EXTERNAL_URL">{{ t('admin.customizationNavigationPage.typeExternalUrl') }}</option>
                  </select>
                </label>

                <label class="form-control gap-2">
                  <span class="label"><span class="label-text">{{ t('admin.customizationNavigationPage.position') }}</span></span>
                  <input v-model.number="item.position" type="number" class="input input-bordered w-full" />
                </label>

                <label class="form-control gap-2">
                  <span class="label"><span class="label-text">{{ t('admin.customizationNavigationPage.parentLink') }}</span></span>
                  <select v-model="item.parentItemKey" class="select select-bordered w-full">
                    <option :value="null">{{ t('admin.customizationNavigationPage.topLevel') }}</option>
                    <option
                      v-for="candidate in parentCandidates(item)"
                      :key="candidate.navigationItemKey"
                      :value="candidate.navigationItemKey"
                    >
                      {{ previewText(candidate.labels) || candidate.title }}
                    </option>
                  </select>
                </label>

                <label class="form-control gap-2">
                  <span class="label"><span class="label-text">{{ t('admin.customizationNavigationPage.internalTitle') }}</span></span>
                  <input v-model="item.title" class="input input-bordered w-full" />
                </label>

                <label class="form-control gap-2 lg:col-span-2">
                  <span class="label"><span class="label-text">{{ t('admin.customizationNavigationPage.url') }}</span></span>
                  <input v-model="item.href" class="input input-bordered w-full" />
                </label>
              </div>

              <AdminPageBuilderTranslationTabs v-model="item.labels" :label="t('admin.customizationNavigationPage.linkLabel')" />

              <div class="grid gap-3 sm:grid-cols-2">
                <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
                  <input v-model="item.visible" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
                  <div>
                    <div class="font-medium">{{ t('admin.customizationNavigationPage.visible') }}</div>
                    <div class="text-sm opacity-70">{{ t('admin.customizationNavigationPage.visibleDescription') }}</div>
                  </div>
                </label>

                <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
                  <input v-model="item.newTab" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
                  <div>
                    <div class="font-medium">{{ t('admin.customizationNavigationPage.newTab') }}</div>
                    <div class="text-sm opacity-70">{{ t('admin.customizationNavigationPage.newTabDescription') }}</div>
                  </div>
                </label>
              </div>
            </div>
          </article>

          <div v-if="!activeItems.length" class="rounded-2xl border border-dashed border-base-300 p-6 text-sm opacity-70">
            {{ t('admin.customizationNavigationPage.empty') }}
          </div>
        </div>
      </section>
    </section>
  </div>
</template>

<script setup lang="ts">
import AdminPageBuilderTranslationTabs from '#modula/components/admin/page-builder/TranslationTabs.vue'
import { createDefaultCmsNavigationItems, type CmsLocalizedText, type CmsNavigationItemPayload, type CmsSiteSettings } from '#modula/shared/cms'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'})

interface SiteShellModel {
  settings: CmsSiteSettings
  navigation: Array<CmsNavigationItemPayload & { id?: number | null }>
}

const { $toast } = useNuxtApp() as any
const { t } = useI18n()
const saving = ref(false)
const previewLocale = ref<'fr' | 'en'>('fr')
const activeMenuTab = ref<'PRIMARY' | 'FOOTER'>('PRIMARY')
const openAccordions = ref<string[]>([])

const isOpen = (id: string) => openAccordions.value.includes(id)
const toggleAccordion = (id: string) => {
  openAccordions.value = isOpen(id)
    ? openAccordions.value.filter(entry => entry !== id)
    : [...openAccordions.value, id]
}
const { data } = await useFetch<SiteShellModel>('/api/admin/cms/site-shell')

if (!data.value) {
  throw createError({
    statusCode: 500,
    statusMessage: t('admin.customizationNavigationPage.loadError')
  })
}

const model = reactive<SiteShellModel>(structuredClone(data.value))

const createNavigationItemKey = () => `nav-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

for (const [index, item] of model.navigation.entries()) {
  item.navigationItemKey ||= createNavigationItemKey()
  item.parentItemKey ??= null
  if (item.position === undefined || item.position === null) {
    item.position = index
  }
}

if (!model.navigation.length) {
  model.navigation = createDefaultCmsNavigationItems().map((item) => ({ ...item }))
}

const primaryItems = computed(() =>
  model.navigation
    .filter((item) => item.menu === 'PRIMARY' && item.visible)
    .sort((a, b) => a.position - b.position)
)

const footerItems = computed(() =>
  model.navigation
    .filter((item) => item.menu === 'FOOTER' && item.visible)
    .sort((a, b) => a.position - b.position)
)

const parentCandidates = (currentItem: CmsNavigationItemPayload & { id?: number | null }) =>
  model.navigation
    .filter((item) =>
      item.menu === currentItem.menu
      && item.navigationItemKey !== currentItem.navigationItemKey
      && !item.parentItemKey
    )
    .sort((a, b) => a.position - b.position)

const activeItems = computed(() =>
  model.navigation
    .filter((item) => item.menu === activeMenuTab.value)
    .sort((a, b) => a.position - b.position)
)

const previewText = (value: CmsLocalizedText | null | undefined) => {
  if (!value) return ''
  return previewLocale.value === 'en' ? value.en : value.fr
}

const addNavigationItem = (menu: 'PRIMARY' | 'FOOTER') => {
  model.navigation.push({
    menu,
    itemType: 'APPLICATION_ROUTE',
    title: t('admin.customizationNavigationPage.newLinkTitle'),
    labels: { fr: '', en: '' },
    navigationItemKey: createNavigationItemKey(),
    parentItemKey: null,
    href: '/',
    pageId: null,
    newTab: false,
    visible: true,
    position: model.navigation.filter((item) => item.menu === menu).length
  })
}

const resetToDefaultNavigation = () => {
  model.navigation = createDefaultCmsNavigationItems().map((item) => ({ ...item }))
}

const removeNavigationItem = (target: CmsNavigationItemPayload & { id?: number | null }) => {
  const index = model.navigation.indexOf(target)
  if (index >= 0) {
    model.navigation.splice(index, 1)
  }
}

const save = async () => {
  saving.value = true
  try {
    await $fetch('/api/admin/cms/site-shell', {
      method: 'PUT',
      body: model
    })
    $toast?.success(t('admin.customizationNavigationPage.saved'))
  } catch (error: any) {
    $toast?.error(error.statusMessage || t('admin.customizationNavigationPage.saveError'))
  } finally {
    saving.value = false
  }
}
</script>
