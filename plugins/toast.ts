export default defineNuxtPlugin(() => {
  let hideTimeout: ReturnType<typeof setTimeout> | null = null;
  type ToastPopoverElement = HTMLElement & {
    showPopover?: () => void
    hidePopover?: () => void
    matches: (selectors: string) => boolean
  }

  const getToastOffset = () => {
    const header = document.getElementById('site-header');

    if (!header) {
      return 80;
    }

    const { bottom } = header.getBoundingClientRect();
    return Math.max(Math.round(bottom + 12), 12);
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const toast = document.getElementById('toast') as ToastPopoverElement | null;

    if (!toast) {
      return;
    }

    const alertClass = {
      success: 'alert-success',
      error: 'alert-error',
      warning: 'alert-warning',
      info: 'alert-info',
    }[type] || 'alert-success';

    toast.style.top = `${getToastOffset()}px`;
    toast.innerHTML = `
      <div class="alert ${alertClass} shadow-lg">
        <span>${message}</span>
      </div>
    `;

    if (typeof toast.showPopover === 'function') {
      if (!toast.matches(':popover-open')) {
        toast.showPopover();
      }
    } else {
      toast.style.display = 'block';
    }

    if (hideTimeout) {
      clearTimeout(hideTimeout);
    }

    hideTimeout = setTimeout(() => {
      if (typeof toast.hidePopover === 'function') {
        if (toast.matches(':popover-open')) {
          toast.hidePopover();
        }
      } else {
        toast.style.display = 'none';
      }
    }, 3000);
  };

  return {
    provide: {
      toast: {
        success: (message: string) => showToast('success', message),
        error: (message: string) => showToast('error', message),
        warning: (message: string) => showToast('warning', message),
        info: (message: string) => showToast('info', message),
      },
    },
  };
});
