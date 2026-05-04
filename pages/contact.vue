<script setup lang="ts">
interface ContactForm {
  name: string
  email: string
  message: string
}

const { t } = useI18n()
const { $toast } = useNuxtApp() as any

const form = ref<ContactForm>({
  name: '',
  email: '',
  message: ''
})

const errors = ref<Partial<ContactForm>>({})
const sending = ref(false)

const validateForm = (): boolean => {
  errors.value = {}
  let isValid = true

  if (!form.value.name.trim()) {
    errors.value.name = t('pages.contact.nameRequired')
    isValid = false
  }

  if (!form.value.email.trim()) {
    errors.value.email = t('pages.contact.emailRequired')
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = t('pages.contact.emailInvalid')
    isValid = false
  }

  if (!form.value.message.trim()) {
    errors.value.message = t('pages.contact.messageRequired')
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validateForm()) return

  sending.value = true
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: form.value
    })
    $toast?.success('Message envoyé')
    form.value = { name: '', email: '', message: '' }
    errors.value = {}
  } catch (error: any) {
    $toast?.error(error.statusMessage || 'Erreur lors de l envoi')
  } finally {
    sending.value = false
  }
}


interface SiteConfig {
  farmPickup: {
    address: string
    dayOfWeek: number
    startTime: string
    endTime: string
    slotLabel: string
  },
  adminEmail: string
  adminPhone: string
}

const { data: siteConfig } = await useFetch<SiteConfig>('/api/site-config')

const farmDayLabel = computed(() => {
  const day = siteConfig.value?.farmPickup.dayOfWeek
  const labels = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  return typeof day === 'number' ? labels[day] : ''
})
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div class="mx-auto max-w-4xl">
      <h1 class="mb-8 text-center text-4xl font-bold text-base-content">{{ $t('pages.contact.title') }}</h1>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div class="card bg-base-200 shadow-lg">
          <div class="card-body">
            <h2 class="card-title mb-4 text-2xl">{{ $t('pages.contact.sendMessage') }}</h2>
            <form class="space-y-6" @submit.prevent="handleSubmit">
              <div class="form-control w-full">
                <label class="label pb-1">
                  <span class="label-text text-base font-semibold">{{ $t('pages.contact.name') }}</span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  :placeholder="$t('pages.contact.namePlaceholder')"
                  class="input input-bordered w-full bg-base-100"
                  :class="{ 'input-error': errors.name }"
                />
                <label v-if="errors.name" class="label pt-1">
                  <span class="label-text-alt text-error">{{ errors.name }}</span>
                </label>
              </div>

              <div class="form-control w-full">
                <label class="label pb-1">
                  <span class="label-text text-base font-semibold">{{ $t('pages.contact.email') }}</span>
                </label>
                <input
                  v-model="form.email"
                  type="email"
                  :placeholder="$t('pages.contact.emailPlaceholder')"
                  class="input input-bordered w-full bg-base-100"
                  :class="{ 'input-error': errors.email }"
                />
                <label v-if="errors.email" class="label pt-1">
                  <span class="label-text-alt text-error">{{ errors.email }}</span>
                </label>
              </div>

              <div class="form-control w-full">
                <label class="label pb-1">
                  <span class="label-text text-base font-semibold">{{ $t('pages.contact.message') }}</span>
                </label>
                <textarea
                  v-model="form.message"
                  :placeholder="$t('pages.contact.messagePlaceholder')"
                  class="textarea textarea-bordered min-h-[150px] w-full bg-base-100"
                  :class="{ 'textarea-error': errors.message }"
                ></textarea>
                <label v-if="errors.message" class="label pt-1">
                  <span class="label-text-alt text-error">{{ errors.message }}</span>
                </label>
              </div>

              <div class="form-control mt-8">
                <button type="submit" class="btn btn-primary w-full" :disabled="sending">
                  <span v-if="sending" class="loading loading-spinner loading-sm" />
                  <Icon v-else name="mdi:send" class="mr-2" />
                  {{ $t('pages.contact.sendButton') }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="space-y-6">
          <div class="card bg-base-200 shadow-lg">
            <div class="card-body">
              <h2 class="card-title mb-4 text-2xl">{{ $t('pages.contact.ourCoordinates') }}</h2>

              <div class="space-y-4">
                <div class="flex items-start space-x-3">
                  <Icon name="mdi:map-marker" class="mt-1 text-xl text-primary" />
                  <div>
                    <h3 class="font-medium">{{ $t('pages.contact.address') }}</h3>
                    <p class="text-base-content/80">{{ siteConfig?.farmPickup.address }}</p>
                  </div>
                </div>

                <div class="flex items-start space-x-3">
                  <Icon name="mdi:phone" class="mt-1 text-xl text-primary" />
                  <div>
                    <h3 class="font-medium">{{ $t('pages.contact.phone') }}</h3>
                    <p class="text-base-content/80">{{ siteConfig?.adminPhone || '07 68 55 06 64' }}</p>
                  </div>
                </div>

                <div class="flex items-start space-x-3">
                  <Icon name="mdi:email" class="mt-1 text-xl text-primary" />
                  <div>
                    <h3 class="font-medium">Email</h3>
                    <p class="text-base-content/80">{{ siteConfig?.adminEmail || 'ferme.campeyrigoux@gmail.com' }}</p>
                  </div>
                </div>

                <div class="flex items-start space-x-3">
                  <Icon name="mdi:clock" class="mt-1 text-xl text-primary" />
                  <div>
                    <h3 class="font-medium">{{ $t('pages.contact.openingHours') }}</h3>
                    <p class="text-base-content/80">{{ $t('pages.contact.directSale') }}</p>
                    <p class="text-base-content/80">{{ farmDayLabel }} {{ siteConfig?.farmPickup.startTime }} - {{ siteConfig?.farmPickup.endTime }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card bg-base-200 shadow-lg">
            <div class="card-body">
              <h2 class="card-title mb-4 text-2xl">{{ $t('pages.contact.followUs') }}</h2>
              <div class="flex gap-4">
                <a href="https://www.facebook.com/profile.php?id=61571709076079" target="_blank" class="btn btn-circle btn-primary btn-outline">
                  <Icon name="mdi:facebook" size="24" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>