<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">
          {{ t("admin.settingsFeaturesPage.title") }}
        </h1>
        <p class="mt-1 text-sm opacity-70">
          {{ t("admin.settingsFeaturesPage.description") }}
        </p>
      </div>

      <button
        class="btn btn-primary"
        :disabled="saving || pending"
        @click="save"
      >
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        {{ t("admin.common.save") }}
      </button>
    </div>

    <div
      v-if="pending"
      class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200 p-4"
    >
      <span class="loading loading-spinner loading-md" />
      <span>{{ t("admin.settingsFeaturesPage.loading") }}</span>
    </div>

    <template v-else>
      <section
        class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4"
      >
        <h2 class="text-lg font-semibold">
          {{ t("admin.settingsFeaturesPage.siteBehavior") }}
        </h2>

        <div class="grid gap-4 md:grid-cols-2">
          <label class="flex label cursor-pointer justify-start gap-3">
            <input
              v-model="form.inDevelopment"
              type="checkbox"
              class="toggle toggle-primary"
            />
            <span class="label-text">{{
              t("admin.settingsFeaturesPage.inDevelopment")
            }}</span>
          </label>
          <label class="flex label cursor-pointer justify-start gap-3">
            <input
              v-model="form.registerEnabled"
              type="checkbox"
              class="toggle toggle-primary"
            />
            <span class="label-text">{{
              t("admin.settingsFeaturesPage.registerEnabled")
            }}</span>
          </label>
          <label class="flex label cursor-pointer justify-start gap-3">
            <input
              v-model="form.subscriptionsEnabled"
              type="checkbox"
              class="toggle toggle-primary"
            />
            <span class="label-text">{{
              t("admin.settingsFeaturesPage.subscriptionsEnabled")
            }}</span>
          </label>
          <label class="flex label cursor-pointer justify-start gap-3">
            <input
              v-model="form.onlinePaymentsEnabled"
              type="checkbox"
              class="toggle toggle-primary"
            />
            <span class="label-text">{{
              t("admin.settingsFeaturesPage.onlinePaymentsEnabled")
            }}</span>
          </label>
        </div>
      </section>

      <section
        class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4"
      >
        <h2 class="text-lg font-semibold">
          {{ t("admin.settingsFeaturesPage.shopTitle") }}
        </h2>
        <label class="flex label cursor-pointer justify-start gap-3">
          <input
            v-model="form.featureFlags.shop.enabled"
            type="checkbox"
            class="toggle toggle-primary"
          />
          <span class="label-text">{{
            t("admin.settingsFeaturesPage.shopEnabled")
          }}</span>
        </label>

        <div class="grid gap-4 md:grid-cols-2">
          <label
            class="flex label cursor-pointer justify-start gap-3"
            :class="!form.featureFlags.shop.enabled ? 'opacity-50' : ''"
          >
            <input
              v-model="form.featureFlags.shop.basketsEnabled"
              type="checkbox"
              class="toggle toggle-primary"
              :disabled="!form.featureFlags.shop.enabled"
            />
            <span class="label-text">{{
              t("admin.settingsFeaturesPage.shopBasketsEnabled")
            }}</span>
          </label>
          <label
            class="flex label cursor-pointer justify-start gap-3"
            :class="!form.featureFlags.shop.enabled ? 'opacity-50' : ''"
          >
            <input
              v-model="form.featureFlags.shop.vegetablesEnabled"
              type="checkbox"
              class="toggle toggle-primary"
              :disabled="!form.featureFlags.shop.enabled"
            />
            <span class="label-text">{{
              t("admin.settingsFeaturesPage.shopProductsEnabled")
            }}</span>
          </label>
        </div>
      </section>

      <section
        class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4"
      >
        <h2 class="text-lg font-semibold">
          {{ t("admin.settingsFeaturesPage.contentTitle") }}
        </h2>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="flex label cursor-pointer justify-start gap-3">
            <input
              v-model="form.featureFlags.newsEnabled"
              type="checkbox"
              class="toggle toggle-primary"
            />
            <span class="label-text">{{
              t("admin.settingsFeaturesPage.newsEnabled")
            }}</span>
          </label>
          <label class="flex label cursor-pointer justify-start gap-3">
            <input
              v-model="form.featureFlags.eventsEnabled"
              type="checkbox"
              class="toggle toggle-primary"
            />
            <span class="label-text">{{
              t("admin.settingsFeaturesPage.eventsEnabled")
            }}</span>
          </label>
        </div>
      </section>

      <section
        class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4"
      >
        <h2 class="text-lg font-semibold">
          {{ t("admin.settingsFeaturesPage.associationTitle") }}
        </h2>
        <label class="flex label cursor-pointer justify-start gap-3">
          <input
            v-model="form.featureFlags.associationRolesEnabled"
            type="checkbox"
            class="toggle toggle-primary"
          />
          <span class="label-text">{{
            t("admin.settingsFeaturesPage.associationRolesEnabled")
          }}</span>
        </label>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from "#modula/shared/adminRoutes";

definePageMeta({
  layout: "admin",
  middleware: "auth",
  i18n: {
    paths: ADMIN_I18N_PATHS.settingsFeatures,
  },
});

interface SettingsData {
  inDevelopment: boolean;
  registerEnabled: boolean;
  subscriptionsEnabled: boolean;
  onlinePaymentsEnabled: boolean;
  featureFlags: {
    inDevelopment: boolean;
    registerEnabled: boolean;
    subscriptionsEnabled: boolean;
    onlinePaymentsEnabled: boolean;
    shop: {
      enabled: boolean;
      basketsEnabled: boolean;
      vegetablesEnabled: boolean;
    };
    associationRolesEnabled: boolean;
    eventsEnabled: boolean;
    newsEnabled: boolean;
  };
  ordersOpenFrom: string;
  ordersOpenTo: string;
  ordersClosedMessage: string;
}

const { $toast } = useNuxtApp() as any;
const { t } = useI18n();
const saving = ref(false);
const { data, pending } = await useFetch<SettingsData>("/api/admin/settings");

const form = reactive({
  inDevelopment: false,
  registerEnabled: false,
  subscriptionsEnabled: false,
  onlinePaymentsEnabled: true,
  featureFlags: {
    inDevelopment: false,
    registerEnabled: false,
    subscriptionsEnabled: false,
    onlinePaymentsEnabled: true,
    shop: {
      enabled: true,
      basketsEnabled: true,
      vegetablesEnabled: true,
    },
    associationRolesEnabled: true,
    eventsEnabled: true,
    newsEnabled: true,
  },
});

watchEffect(() => {
  if (!data.value) return;
  form.inDevelopment = data.value.inDevelopment;
  form.registerEnabled = data.value.registerEnabled;
  form.subscriptionsEnabled = data.value.subscriptionsEnabled;
  form.onlinePaymentsEnabled = data.value.onlinePaymentsEnabled;
  form.featureFlags = structuredClone(data.value.featureFlags);
});

watch(
  () => form.featureFlags.shop.enabled,
  (enabled) => {
    if (!enabled) {
      form.featureFlags.shop.basketsEnabled = false;
      form.featureFlags.shop.vegetablesEnabled = false;
    }
  },
);

watch(
  () => form.onlinePaymentsEnabled,
  (enabled) => {
    form.featureFlags.onlinePaymentsEnabled = enabled;
  },
);

const save = async () => {
  saving.value = true;
  try {
    await $fetch("/api/admin/settings", {
      method: "PUT",
      body: {
        inDevelopment: form.inDevelopment,
        registerEnabled: form.registerEnabled,
        subscriptionsEnabled: form.subscriptionsEnabled,
        onlinePaymentsEnabled: form.onlinePaymentsEnabled,
        featureFlags: {
          ...form.featureFlags,
          onlinePaymentsEnabled: form.onlinePaymentsEnabled,
        },
      },
    });
    $toast?.success(t("admin.settingsFeaturesPage.saved"));
  } catch (error: any) {
    $toast?.error(
      error?.message ||
        error?.data?.message ||
        t("admin.settingsFeaturesPage.saveError"),
    );
  } finally {
    saving.value = false;
  }
};
</script>
