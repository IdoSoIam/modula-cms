<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">
          {{ t("admin.onlinePaymentsPage.title") }}
        </h1>
        <p class="mt-1 max-w-3xl text-sm opacity-70">
          {{ t("admin.onlinePaymentsPage.description") }}
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
      <span>{{ t("admin.onlinePaymentsPage.loading") }}</span>
    </div>

    <template v-else>
      <section class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4">
        <div>
          <h2 class="text-lg font-semibold">
            {{ t("admin.onlinePaymentsPage.providerTitle") }}
          </h2>
          <p class="mt-1 text-sm opacity-70">
            {{ t("admin.onlinePaymentsPage.providerDescription") }}
          </p>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-200 p-4 text-sm space-y-2">
          <div class="font-medium">
            {{ t("admin.onlinePaymentsPage.featureGateTitle") }}
          </div>
          <p class="opacity-75">
            {{ t("admin.onlinePaymentsPage.featureGateDescription") }}
          </p>
          <p class="opacity-75">
            {{ t("admin.onlinePaymentsPage.registryInfoDescription") }}
          </p>
        </div>

        <label class="form-control flex flex-col gap-2">
          <span class="label">
            <span class="label-text">{{ t("admin.onlinePaymentsPage.providerLabel") }}</span>
          </span>
          <select v-model="form.provider" class="select select-bordered w-full">
            <option value="none">
              {{ t("admin.onlinePaymentsPage.providers.none") }}
            </option>
            <option value="stripe_connect">
              {{ t("admin.onlinePaymentsPage.providers.stripeConnect") }}
            </option>
          </select>
        </label>

        <div
          class="flex items-center gap-3 rounded-xl border p-4 text-sm"
          :class="statusCardClass"
        >
          <Icon
            :name="publicConfig.enabled ? 'mdi:check-circle-outline' : 'mdi:alert-circle-outline'"
            size="20"
          />
          <span>
            {{
              publicConfig.enabled
                ? t("admin.onlinePaymentsPage.statusEnabled")
                : t("admin.onlinePaymentsPage.statusDisabled")
            }}
          </span>
        </div>
      </section>

      <section class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4">
        <div>
          <h2 class="text-lg font-semibold">
            {{ t("admin.onlinePaymentsPage.stripeTitle") }}
          </h2>
          <p class="mt-1 text-sm opacity-70">
            {{ t("admin.onlinePaymentsPage.stripeDescription") }}
          </p>
        </div>

        <label class="form-control flex flex-col gap-2">
          <span class="label">
            <span class="label-text">{{ t("admin.onlinePaymentsPage.connectedAccountId") }}</span>
          </span>
          <input
            v-model="form.connectedAccountId"
            class="input input-bordered w-full"
            placeholder="acct_..."
            :disabled="form.provider !== 'stripe_connect'"
          />
        </label>

        <label class="form-control flex flex-col gap-2">
          <span class="label">
            <span class="label-text">{{ t("admin.onlinePaymentsPage.connectedAccountLabel") }}</span>
          </span>
          <input
            v-model="form.connectedAccountLabel"
            class="input input-bordered w-full"
            :placeholder="t('admin.onlinePaymentsPage.connectedAccountLabelPlaceholder')"
            :disabled="form.provider !== 'stripe_connect'"
          />
        </label>

        <div class="rounded-xl border border-base-300 bg-base-200 p-4 text-sm space-y-4">
          <div>
            <div class="font-medium">
              {{ t("admin.onlinePaymentsPage.taxTitle") }}
            </div>
            <p class="mt-1 opacity-75">
              {{ t("admin.onlinePaymentsPage.taxDescription") }}
            </p>
          </div>

          <label class="form-control flex gap-3">
            <label class="label cursor-pointer justify-start gap-3">
              <input
                v-model="form.automaticTaxEnabled"
                type="checkbox"
                class="checkbox"
                :disabled="form.provider !== 'stripe_connect'"
              />
              <span class="label-text">{{ t("admin.onlinePaymentsPage.automaticTaxEnabled") }}</span>
            </label>
          </label>

          <p class="opacity-75">
            {{ t("admin.onlinePaymentsPage.automaticTaxHelp") }}
          </p>

          <label class="form-control flex flex-col gap-2">
            <span class="label">
              <span class="label-text">{{ t("admin.onlinePaymentsPage.defaultTaxBehavior") }}</span>
            </span>
            <select
              v-model="form.defaultTaxBehavior"
              class="select select-bordered w-full"
              :disabled="form.provider !== 'stripe_connect'"
            >
              <option value="inclusive">{{ t("admin.onlinePaymentsPage.taxBehaviorInclusive") }}</option>
              <option value="exclusive">{{ t("admin.onlinePaymentsPage.taxBehaviorExclusive") }}</option>
            </select>
          </label>

          <label class="form-control flex flex-col gap-2">
            <span class="label">
              <span class="label-text">{{ t("admin.onlinePaymentsPage.defaultTaxCode") }}</span>
            </span>
            <input
              v-model="form.defaultTaxCode"
              class="input input-bordered w-full"
              placeholder="txcd_..."
              :disabled="form.provider !== 'stripe_connect'"
            />
          </label>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-200 p-4 text-sm space-y-2">
          <div class="font-medium">
            {{ t("admin.onlinePaymentsPage.instanceScopeTitle") }}
          </div>
          <p class="opacity-75">
            {{ t("admin.onlinePaymentsPage.instanceScopeDescription") }}
          </p>
          <p class="opacity-75">
            {{ t("admin.onlinePaymentsPage.platformManagedSecrets") }}
          </p>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CmsRegistryPaymentConfig } from "#modula/shared/registry";

definePageMeta({
  layout: "admin",
  middleware: "auth",
});

interface SettingsData {
  onlinePaymentsEnabled: boolean;
  onlinePayments: CmsRegistryPaymentConfig;
}

const { $toast } = useNuxtApp() as any;
const { t } = useI18n();
const saving = ref(false);
const { data, pending, refresh } = await useFetch<SettingsData>(
  "/api/admin/payments/config",
  { key: "admin-payments-config" },
);

const form = reactive({
  provider: "none" as "none" | "stripe_connect",
  connectedAccountId: "",
  connectedAccountLabel: "",
  automaticTaxEnabled: false,
  defaultTaxBehavior: "inclusive" as "inclusive" | "exclusive",
  defaultTaxCode: "",
});

watchEffect(() => {
  if (!data.value?.onlinePayments) return;
  form.provider = data.value.onlinePayments.provider === "stripe_connect" ? "stripe_connect" : "none";
  form.connectedAccountId = data.value.onlinePayments.connectedAccountId || "";
  form.connectedAccountLabel = data.value.onlinePayments.connectedAccountLabel || "";
  form.automaticTaxEnabled = Boolean(data.value.onlinePayments.automaticTaxEnabled);
  form.defaultTaxBehavior = data.value.onlinePayments.defaultTaxBehavior === "exclusive" ? "exclusive" : "inclusive";
  form.defaultTaxCode = data.value.onlinePayments.defaultTaxCode || "";
});

const publicConfig = computed(() => {
  const enabledByFeature = data.value?.onlinePaymentsEnabled ?? true;
  const configured = Boolean(
    form.provider === "stripe_connect" && form.connectedAccountId.trim().length,
  );
  return {
    enabled: Boolean(enabledByFeature && configured),
  };
});

const statusCardClass = computed(() =>
  publicConfig.value.enabled
    ? "border-success/30 bg-success/10"
    : "border-base-300 bg-base-200",
);

const save = async () => {
  saving.value = true;
  try {
    await $fetch("/api/admin/payments/config", {
      method: "PUT",
      body: {
        provider: form.provider,
        connectedAccountId: form.connectedAccountId.trim(),
        connectedAccountLabel: form.connectedAccountLabel.trim(),
        automaticTaxEnabled: form.automaticTaxEnabled,
        defaultTaxBehavior: form.defaultTaxBehavior,
        defaultTaxCode: form.defaultTaxCode.trim(),
      },
    });
    await refresh();
    $toast?.success(t("admin.onlinePaymentsPage.saved"));
  } catch (error: any) {
    $toast?.error(
      error?.message ||
        error?.data?.message ||
        t("admin.onlinePaymentsPage.saveError"),
    );
  } finally {
    saving.value = false;
  }
};
</script>
