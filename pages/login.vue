<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200">
    <div class="card w-96 bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title mb-4">Connexion</h2>

        <AuthForm :show-heading="false" @success="handleSuccess" />

        <div class="text-sm mt-4">
          <p>Vous n'avez pas de compte ? Contactez l'administrateur.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()

const handleSuccess = async () => {
  await router.push('/profile')
}
</script>
