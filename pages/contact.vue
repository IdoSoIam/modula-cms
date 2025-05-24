<script setup lang="ts">
    const { t } = useI18n();

    interface ContactForm {
    name: string;
    email: string;
    message: string;
    }

    const form = ref<ContactForm>({
    name: '',
    email: '',
    message: ''
    });

    const errors = ref<Partial<ContactForm>>({});    const validateForm = (): boolean => {
    errors.value = {};
    let isValid = true;

    if (!form.value.name.trim()) {
        errors.value.name = t('pages.contact.nameRequired');
        isValid = false;
    }

    if (!form.value.email.trim()) {
        errors.value.email = t('pages.contact.emailRequired');
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
        errors.value.email = t('pages.contact.emailInvalid');
        isValid = false;
    }

    if (!form.value.message.trim()) {
        errors.value.message = t('pages.contact.messageRequired');
        isValid = false;
    }

    return isValid;
    };

    const handleSubmit = async () => {
    if (!validateForm()) return;

    // Ici, vous pouvez ajouter la logique d'envoi du formulaire
    console.log('Formulaire envoyé:', form.value);
    // Réinitialiser le formulaire
    form.value = {
        name: '',
        email: '',
        message: ''
    };
    };
</script>

<template>
  <div class="container mx-auto px-4 py-12">    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold text-center mb-8 text-base-content">{{ $t('pages.contact.title') }}</h1>
      
      <!-- Carte principale -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Formulaire -->
        <div class="card bg-base-200 shadow-lg">
          <div class="card-body">
            <h2 class="card-title text-2xl mb-4">{{ $t('pages.contact.sendMessage') }}</h2>
            <form @submit.prevent="handleSubmit" class="space-y-6">    <div class="form-control w-full">
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
        class="textarea textarea-bordered w-full bg-base-100 min-h-[150px]"
        :class="{ 'textarea-error': errors.message }"
      ></textarea>
      <label v-if="errors.message" class="label pt-1">
        <span class="label-text-alt text-error">{{ errors.message }}</span>
      </label>
    </div>

    <div class="form-control mt-8">
      <button type="submit" class="btn btn-primary w-full">
        <Icon name="mdi:send" class="mr-2" />
        {{ $t('pages.contact.sendButton') }}
      </button>
    </div>
  </form>
          </div>
        </div>

        <!-- Informations de contact -->
        <div class="space-y-6">          <div class="card bg-base-200 shadow-lg">
            <div class="card-body">
              <h2 class="card-title text-2xl mb-4">{{ $t('pages.contact.ourCoordinates') }}</h2>
              
              <div class="space-y-4">
                <div class="flex items-start space-x-3">
                  <Icon name="mdi:map-marker" class="text-primary text-xl mt-1" />
                  <div>
                    <h3 class="font-medium">{{ $t('pages.contact.address') }}</h3>
                    <p class="text-base-content/80">Campeyrigoux</p>
                    <p class="text-base-content/80">30140 Saint Sébastien d'Aigrefeuille</p>
                  </div>
                </div>

                <div class="flex items-start space-x-3">
                  <Icon name="mdi:phone" class="text-primary text-xl mt-1" />
                  <div>
                    <h3 class="font-medium">{{ $t('pages.contact.phone') }}</h3>
                    <p class="text-base-content/80">07 68 55 06 64</p>
                  </div>
                </div>

                <div class="flex items-start space-x-3">
                  <Icon name="mdi:email" class="text-primary text-xl mt-1" />
                  <div>
                    <h3 class="font-medium">Email</h3>
                    <p class="text-base-content/80">adele.godefroid@gmail.com</p>
                  </div>
                </div>

                <div class="flex items-start space-x-3">
                  <Icon name="mdi:clock" class="text-primary text-xl mt-1" />
                  <div>
                    <h3 class="font-medium">{{ $t('pages.contact.openingHours') }}</h3>
                    <p class="text-base-content/80">{{ $t('pages.contact.directSale') }}</p>
                    <p class="text-base-content/80">{{ $t('pages.contact.schedule') }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Carte des réseaux sociaux -->
          <div class="card bg-base-200 shadow-lg">
            <div class="card-body">
              <h2 class="card-title text-2xl mb-4">{{ $t('pages.contact.followUs') }}</h2>
              <div class="flex gap-4">
                <a href="https://facebook.com/Ferme-du-Campeyrigoux" 
                   target="_blank" 
                   class="btn btn-circle btn-primary btn-outline">
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