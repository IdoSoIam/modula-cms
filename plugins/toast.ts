export default defineNuxtPlugin(() => {
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;

  const getToastOffset = () => {
    const header = document.getElementById('site-header');

    if (!header) {
      return 80;
    }

    const { bottom } = header.getBoundingClientRect();
    return Math.max(Math.round(bottom + 12), 12);
  };

  const showToast = (type: 'success' | 'error', message: string) => {
    const toast = document.getElementById('toast') as HTMLElement | null;

    if (!toast) {
      return;
    }

    toast.style.top = `${getToastOffset()}px`;
    toast.innerHTML = `
      <div class="alert ${type === 'success' ? 'alert-success' : 'alert-error'} shadow-lg">
        <span>${message}</span>
      </div>
    `;
    toast.classList.remove('hidden');

    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }

    hideTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  };

  return {
    provide: {
      toast: {
        success: (message: string) => showToast('success', message),
        error: (message: string) => showToast('error', message),
      },
    },
  };
});
