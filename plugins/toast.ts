export default defineNuxtPlugin((nuxtApp) => {
  return {
    provide: {
      toast: {
        success: (message: string) => {
          // Utilise la bibliothèque toast de DaisyUI
          const toast = document.getElementById('toast') as HTMLElement;
          if (toast) {
            toast.innerHTML = `
              <div class="alert alert-success">
                <span>${message}</span>
              </div>
            `;
            toast.style.display = 'block';
            setTimeout(() => {
              toast.style.display = 'none';
            }, 3000);
          }
        },
        error: (message: string) => {
          const toast = document.getElementById('toast') as HTMLElement;
          if (toast) {
            toast.innerHTML = `
              <div class="alert alert-error">
                <span>${message}</span>
              </div>
            `;
            toast.style.display = 'block';
            setTimeout(() => {
              toast.style.display = 'none';
            }, 3000);
          }
        }
      }
    }
  }
})
