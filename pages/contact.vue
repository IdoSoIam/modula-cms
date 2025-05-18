<script setup lang="ts">
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

    const errors = ref<Partial<ContactForm>>({});

    const validateForm = (): boolean => {
    errors.value = {};
    let isValid = true;

    if (!form.value.name.trim()) {
        errors.value.name = 'Le nom est requis';
        isValid = false;
    }

    if (!form.value.email.trim()) {
        errors.value.email = 'L\'email est requis';
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
        errors.value.email = 'L\'email n\'est pas valide';
        isValid = false;
    }

    if (!form.value.message.trim()) {
        errors.value.message = 'Le message est requis';
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
  <div class="container mx-auto px-4 py-12">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-4xl font-bold text-center mb-8">Contactez-nous</h1>
      
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Nom</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Votre nom"
                class="input input-bordered w-full"
                :class="{ 'input-error': errors.name }"
              />
              <label v-if="errors.name" class="label">
                <span class="label-text-alt text-error">{{ errors.name }}</span>
              </label>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Email</span>
              </label>
              <input
                v-model="form.email"
                type="email"
                placeholder="votre@email.com"
                class="input input-bordered w-full"
                :class="{ 'input-error': errors.email }"
              />
              <label v-if="errors.email" class="label">
                <span class="label-text-alt text-error">{{ errors.email }}</span>
              </label>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Message</span>
              </label>
              <textarea
                v-model="form.message"
                placeholder="Votre message"
                class="textarea textarea-bordered h-32"
                :class="{ 'textarea-error': errors.message }"
              ></textarea>
              <label v-if="errors.message" class="label">
                <span class="label-text-alt text-error">{{ errors.message }}</span>
              </label>
            </div>

            <div class="form-control mt-6">
              <button type="submit" class="btn btn-primary">
                Envoyer le message
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Informations de contact -->
      <div class="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="text-center">
          <h3 class="text-xl font-semibold mb-4">Adresse</h3>
          <p>La Ferme du Campeyrigoux</p>
          <p>Saint Sébastien d'Aigrefeuille</p>
        </div>
        <div class="text-center">
          <h3 class="text-xl font-semibold mb-4">Contact direct</h3>
          <p>Email: contact@ferme-campeyrigoux.fr</p>
          <p>Tél: 06 XX XX XX XX</p>
        </div>
      </div>
    </div>
  </div>
</template>
