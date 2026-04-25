interface ContactForm {
  name: string;
  email: string;
  message: string;
}

export const useContact = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const success = ref(false);

  const sendContactForm = async (form: ContactForm) => {
    loading.value = true;
    error.value = null;
    success.value = false;

    try {
      await $fetch('/api/contact', {
        method: 'POST',
        body: form
      });
      success.value = true;
    } catch (e) {
      error.value = 'Erreur lors de l\'envoi du message';
      console.error(e);
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    success,
    sendContactForm
  };
};
