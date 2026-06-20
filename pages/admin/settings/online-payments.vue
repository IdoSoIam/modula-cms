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
      <section
        class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4"
      >
        <div>
          <h2 class="text-lg font-semibold">
            {{ t("admin.onlinePaymentsPage.providerTitle") }}
          </h2>
          <p class="mt-1 text-sm opacity-70">
            {{ t("admin.onlinePaymentsPage.providerDescription") }}
          </p>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-200 p-4 text-sm">
          <div class="font-medium">
            {{ t("admin.onlinePaymentsPage.featureGateTitle") }}
          </div>
          <p class="mt-1 opacity-75">
            {{ t("admin.onlinePaymentsPage.featureGateDescription") }}
          </p>
        </div>

        <label class="form-control flex flex-col gap-2">
          <span class="label">
            <span class="label-text">{{
              t("admin.onlinePaymentsPage.providerLabel")
            }}</span>
          </span>
          <select v-model="form.provider" class="select select-bordered w-full">
            <option value="none">
              {{ t("admin.onlinePaymentsPage.providers.none") }}
            </option>
            <option value="stripe">Stripe Checkout</option>
          </select>
        </label>

        <div
          class="flex items-center gap-3 rounded-xl border p-4 text-sm"
          :class="
            publicConfig.enabled
              ? 'border-success/30 bg-success/10'
              : 'border-base-300 bg-base-200'
          "
        >
          <Icon
            :name="
              publicConfig.enabled
                ? 'mdi:check-circle-outline'
                : 'mdi:alert-circle-outline'
            "
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

      <section
        class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4"
        :class="form.provider !== 'stripe' ? 'opacity-60' : ''"
      >
        <div>
          <h2 class="text-lg font-semibold">
            {{ t("admin.onlinePaymentsPage.stripeTitle") }}
          </h2>
          <p class="mt-1 text-sm opacity-70">
            {{ t("admin.onlinePaymentsPage.stripeDescription") }}
          </p>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <label class="form-control flex flex-col gap-2">
            <span class="label">
              <span class="label-text">{{
                t("admin.onlinePaymentsPage.publishableKey")
              }}</span>
            </span>
            <input
              v-model="form.stripePublishableKey"
              class="input input-bordered w-full"
              placeholder="pk_live_..."
              autocomplete="off"
              :disabled="form.provider !== 'stripe'"
            />
          </label>

          <label class="form-control flex flex-col gap-2">
            <span class="label">
              <span class="label-text">{{
                t("admin.onlinePaymentsPage.secretKey")
              }}</span>
            </span>
            <input
              v-model="form.stripeSecretKey"
              type="password"
              class="input input-bordered w-full"
              placeholder="sk_live_..."
              autocomplete="off"
              :disabled="form.provider !== 'stripe'"
            />
          </label>

          <label class="form-control flex flex-col gap-2 lg:col-span-2">
            <span class="label">
              <span class="label-text">{{
                t("admin.onlinePaymentsPage.webhookSecret")
              }}</span>
            </span>
            <input
              v-model="form.stripeWebhookSecret"
              type="password"
              class="input input-bordered w-full"
              placeholder="whsec_..."
              autocomplete="off"
              :disabled="form.provider !== 'stripe'"
            />
          </label>
        </div>

        <div class="rounded-xl border border-base-300 bg-base-200 p-4 space-y-4">
          <div>
            <div class="font-medium">
              {{ t("admin.onlinePaymentsPage.taxTitle") }}
            </div>
            <p class="mt-1 text-sm opacity-75">
              {{ t("admin.onlinePaymentsPage.taxDescription") }}
            </p>
          </div>

          <label class="form-control flex gap-2">
            <span class="label">
              <span class="label-text">{{
                t("admin.onlinePaymentsPage.automaticTaxEnabled")
              }}</span>
            </span>
            <label class="label cursor-pointer justify-start gap-3">
              <input
                v-model="form.stripeAutomaticTaxEnabled"
                type="checkbox"
                class="checkbox"
                :disabled="form.provider !== 'stripe'"
              />
              <span class="label-text">{{
                t("admin.onlinePaymentsPage.automaticTaxHelp")
              }}</span>
            </label>
          </label>

          <div class="grid gap-4 lg:grid-cols-2">
            <label class="form-control flex flex-col gap-2">
              <span class="label">
                <span class="label-text">{{
                  t("admin.onlinePaymentsPage.defaultTaxBehavior")
                }}</span>
              </span>
              <select
                v-model="form.stripeDefaultTaxBehavior"
                class="select select-bordered w-full"
                :disabled="form.provider !== 'stripe' || !form.stripeAutomaticTaxEnabled"
              >
                <option value="inclusive">
                  {{ t("admin.onlinePaymentsPage.taxBehaviorInclusive") }}
                </option>
                <option value="exclusive">
                  {{ t("admin.onlinePaymentsPage.taxBehaviorExclusive") }}
                </option>
              </select>
            </label>

            <label class="form-control flex flex-col gap-2">
              <span class="label">
                <span class="label-text">{{
                  t("admin.onlinePaymentsPage.defaultTaxCode")
                }}</span>
              </span>
              <input
                v-model="form.stripeDefaultTaxCode"
                class="input input-bordered w-full"
                placeholder="txcd_..."
                autocomplete="off"
                :disabled="form.provider !== 'stripe' || !form.stripeAutomaticTaxEnabled"
              />
            </label>
          </div>
        </div>

        <div
          class="rounded-xl border border-base-300 bg-base-200 p-4 text-sm space-y-2"
        >
          <div class="font-medium">
            {{ t("admin.onlinePaymentsPage.webhookHelpTitle") }}
          </div>
          <p class="opacity-75">
            {{ t("admin.onlinePaymentsPage.webhookHelpDescription") }}
          </p>
          <code
            class="block overflow-x-auto rounded-lg bg-base-300 px-3 py-2 text-xs"
          >
            {{ webhookUrl }}
          </code>
        </div>
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
    paths: ADMIN_I18N_PATHS.settingsOnlinePayments,
  },
});

interface SettingsData {
  onlinePaymentsEnabled: boolean;
  onlinePayments: {
    provider: "stripe" | "none";
    stripePublishableKey: string;
    stripeSecretKey: string;
    stripeWebhookSecret: string;
    stripeAutomaticTaxEnabled: boolean;
    stripeDefaultTaxCode: string;
    stripeDefaultTaxBehavior: "inclusive" | "exclusive";
  };
}

const { $toast } = useNuxtApp() as any;
const { t } = useI18n();
const saving = ref(false);
const { data, pending, refresh } = await useFetch<SettingsData>(
  "/api/admin/settings",
);

const form = reactive({
  provider: "none" as "stripe" | "none",
  stripePublishableKey: "",
  stripeSecretKey: "",
  stripeWebhookSecret: "",
  stripeAutomaticTaxEnabled: false,
  stripeDefaultTaxCode: "",
  stripeDefaultTaxBehavior: "inclusive" as "inclusive" | "exclusive",
});

watchEffect(() => {
  if (!data.value) return;
  form.provider =
    data.value.onlinePayments?.provider === "stripe" ? "stripe" : "none";
  form.stripePublishableKey =
    data.value.onlinePayments?.stripePublishableKey || "";
  form.stripeSecretKey = data.value.onlinePayments?.stripeSecretKey || "";
  form.stripeWebhookSecret =
    data.value.onlinePayments?.stripeWebhookSecret || "";
  form.stripeAutomaticTaxEnabled =
    Boolean(data.value.onlinePayments?.stripeAutomaticTaxEnabled);
  form.stripeDefaultTaxCode =
    data.value.onlinePayments?.stripeDefaultTaxCode || "";
  form.stripeDefaultTaxBehavior =
    data.value.onlinePayments?.stripeDefaultTaxBehavior === "exclusive"
      ? "exclusive"
      : "inclusive";
});

const publicConfig = computed(() => {
  const enabledByFeature = data.value?.onlinePaymentsEnabled ?? true;
  const providerEnabled = form.provider === "stripe";
  const hasSecret = Boolean(form.stripeSecretKey.trim());
  return {
    enabled: Boolean(enabledByFeature && providerEnabled && hasSecret),
  };
});

const webhookUrl = computed(() => {
  const { origin } = useRequestURL();
  return `${origin}/api/payments/webhook`;
});

const save = async () => {
  saving.value = true;
  try {
    await $fetch("/api/admin/settings", {
      method: "PUT",
      body: {
        onlinePayments: {
          provider: form.provider,
          stripePublishableKey: form.stripePublishableKey.trim(),
          stripeSecretKey: form.stripeSecretKey.trim(),
          stripeWebhookSecret: form.stripeWebhookSecret.trim(),
          stripeAutomaticTaxEnabled: form.stripeAutomaticTaxEnabled,
          stripeDefaultTaxCode: form.stripeDefaultTaxCode.trim(),
          stripeDefaultTaxBehavior: form.stripeDefaultTaxBehavior,
        },
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
