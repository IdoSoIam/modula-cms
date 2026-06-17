<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Personnalisation email</h1>
        <p class="mt-1 text-sm opacity-70">Builder visuel global pour le layout des emails transactionnels.</p>
      </div>
      <button class="btn btn-primary" :disabled="saving || pending" @click="save">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        Enregistrer
      </button>
    </div>

    <div v-if="pending" class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200 p-4">
      <span class="loading loading-spinner loading-md" />
      <span>Chargement...</span>
    </div>

    <div v-else class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4">
        <label class="form-control gap-2">
          <span class="label-text">Nom de marque</span>
          <input v-model="form.brandName" class="input input-bordered w-full" />
        </label>
        <div class="form-control gap-2">
          <span class="label-text">Logo</span>
          <ImageInput v-model="form.logoUrl" />
        </div>
        <label class="form-control gap-2">
          <span class="label-text">Texte de footer</span>
          <textarea v-model="form.footerText" class="textarea textarea-bordered w-full" rows="3" />
        </label>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="form-control gap-2">
            <span class="label-text">Couleur accent</span>
            <input v-model="form.accentColor" type="color" class="input input-bordered h-11 w-full p-1" />
          </label>
          <label class="form-control gap-2">
            <span class="label-text">Fond email</span>
            <input v-model="form.backgroundColor" type="color" class="input input-bordered h-11 w-full p-1" />
          </label>
          <label class="form-control gap-2">
            <span class="label-text">Fond carte</span>
            <input v-model="form.cardColor" type="color" class="input input-bordered h-11 w-full p-1" />
          </label>
          <label class="form-control gap-2">
            <span class="label-text">Couleur texte</span>
            <input v-model="form.textColor" type="color" class="input input-bordered h-11 w-full p-1" />
          </label>
        </div>
        <label class="form-control gap-2">
          <span class="label-text">Arrondi boutons (px)</span>
          <input v-model.number="form.buttonRadiusPx" type="range" class="range range-primary" min="0" max="28" />
        </label>
      </section>

      <section class="rounded-box border border-base-300 p-5" :style="previewShellStyle">
        <div class="mx-auto max-w-[560px] rounded-3xl border p-6 shadow-sm" :style="previewCardStyle">
          <div class="rounded-2xl px-5 py-4 text-white" :style="{ background: `linear-gradient(135deg, ${form.accentColor}, #1f2937)` }">
            <img v-if="previewLogoUrl" :src="previewLogoUrl" alt="logo" class="mb-3 h-10 w-auto object-contain" />
            <div class="text-xs uppercase opacity-80 tracking-[0.16em]">{{ previewBrandName }}</div>
            <div class="mt-2 text-2xl font-semibold">Nouveau message</div>
          </div>
          <div class="pt-5 text-sm leading-relaxed" :style="{ color: form.textColor }">
            <p>Bonjour,</p>
            <p>Ce template applique un rendu lisible, mobile-first, avec hiérarchie claire et CTA explicite.</p>
            <button class="btn btn-sm mt-2 text-white border-0" :style="{ backgroundColor: form.accentColor, borderRadius: `${form.buttonRadiusPx}px` }">Voir le détail</button>
            <div class="mt-5 border-t pt-4 text-xs opacity-70">
              {{ previewFooterText }}
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '#modula/shared/adminRoutes'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.customizationEmails
  }
})

type EmailVisualTemplateConfig = {
  brandName: string
  logoUrl: string
  accentColor: string
  backgroundColor: string
  cardColor: string
  textColor: string
  footerText: string
  buttonRadiusPx: number
}

const { $toast } = useNuxtApp() as any
const saving = ref(false)
const siteConfig = await useSiteConfig()
const { data, pending } = await useFetch<{ config: EmailVisualTemplateConfig }>('/api/admin/settings/email-visual-template')

const form = reactive<EmailVisualTemplateConfig>({
  brandName: '',
  logoUrl: '',
  accentColor: '#4b56d2',
  backgroundColor: '#f6f7fb',
  cardColor: '#ffffff',
  textColor: '#1f2937',
  footerText: '',
  buttonRadiusPx: 10
})

function normalizePreviewAssetUrl(value: string | null | undefined) {
  const src = (value || '').trim()
  if (!src) return ''
  if (src.startsWith('/') || /^[a-z]+:\/\//i.test(src) || src.startsWith('data:')) return src
  return `/images/${src.replace(/^\.?\//, '')}`
}

watchEffect(() => {
  if (!data.value?.config) return
  Object.assign(form, data.value.config)
})

const previewBrandName = computed(() =>
  form.brandName.trim()
  || siteConfig.value?.siteName
  || 'Modula CMS'
)

const previewLogoUrl = computed(() =>
  normalizePreviewAssetUrl(form.logoUrl)
  || normalizePreviewAssetUrl(siteConfig.value?.cms?.settings?.logo?.src)
)

const previewFooterText = computed(() =>
  form.footerText.trim()
  || previewBrandName.value
)

const previewShellStyle = computed(() => ({
  backgroundColor: form.backgroundColor
}))

const previewCardStyle = computed(() => ({
  backgroundColor: form.cardColor
}))

const save = async () => {
  saving.value = true
  try {
    await $fetch('/api/admin/settings/email-visual-template', {
      method: 'PUT',
      body: form
    })
    $toast?.success('Template email enregistré.')
  } catch (error: any) {
    $toast?.error(error?.message || error?.data?.message || 'Impossible d’enregistrer le template email.')
  } finally {
    saving.value = false
  }
}
</script>
