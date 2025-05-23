<template>
  <div class="max-w-md mx-auto p-6 bg-base-100 rounded-lg shadow-xl">
    <div class="tabs tabs-boxed mb-6">
      <a
        class="tab"
        :class="{ 'tab-active': activeTab === 'login' }"
        @click="activeTab = 'login'"
      >
        Connexion
      </a>
      <a
        class="tab"
        :class="{ 'tab-active': activeTab === 'register' }"
        @click="activeTab = 'register'"
      >
        Inscription
      </a>
    </div>

    <!-- Formulaire de connexion -->
    <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="space-y-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Email</span>
        </label>
        <input
          v-model="loginForm.email"
          type="email"
          required
          class="input input-bordered w-full"
          placeholder="votre@email.com"
        />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Mot de passe</span>
        </label>
        <input
          v-model="loginForm.password"
          type="password"
          required
          class="input input-bordered w-full"
          placeholder="••••••••"
        />
      </div>

      <button type="submit" class="btn btn-primary w-full">Se connecter</button>
    </form>

    <!-- Formulaire d'inscription -->
    <form v-else @submit.prevent="handleRegister" class="space-y-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Prénom</span>
        </label>
        <input
          v-model="registerForm.firstName"
          type="text"
          required
          class="input input-bordered w-full"
        />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Nom</span>
        </label>
        <input
          v-model="registerForm.lastName"
          type="text"
          required
          class="input input-bordered w-full"
        />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Date de naissance</span>
        </label>
        <input
          v-model="registerForm.birthDate"
          type="date"
          required
          class="input input-bordered w-full"
        />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Email</span>
        </label>
        <input
          v-model="registerForm.email"
          type="email"
          required
          class="input input-bordered w-full"
          placeholder="votre@email.com"
        />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Mot de passe</span>
        </label>
        <input
          v-model="registerForm.password"
          type="password"
          required
          class="input input-bordered w-full"
          placeholder="••••••••"
        />
      </div>

      <button type="submit" class="btn btn-primary w-full">S'inscrire</button>
    </form>

    <div v-if="error" class="mt-4 text-error">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
const { login, register } = useAuth();

const activeTab = ref("login");
const error = ref("");

const loginForm = reactive({
  email: "",
  password: "",
});

const registerForm = reactive({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  birthDate: "",
});

const handleLogin = async () => {
  error.value = "";
  const result = await login(loginForm.email, loginForm.password);
  if (result && !result.success && result.error) {
    error.value = result.error;
  }
};

const handleRegister = async () => {
  error.value = "";
  const result = await register(registerForm);
  if (result && !result.success && result.error) {
    error.value = result.error;
  }
};
</script>
