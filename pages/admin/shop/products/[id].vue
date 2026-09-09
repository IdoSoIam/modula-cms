<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <button class="btn btn-ghost btn-sm mb-3" @click="goBack">
          <Icon name="mdi:arrow-left" size="16" />
          {{ t('admin.productEditorPage.back') }}
        </button>
        <h1 class="text-3xl font-bold">
          {{ isCreateMode ? t('admin.productEditorPage.createTitle') : t('admin.productEditorPage.editTitle') }}
        </h1>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.productEditorPage.description') }}</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <NuxtLink
          v-if="previewPath"
          :to="previewPath"
          target="_blank"
          class="btn btn-outline"
        >
          <Icon name="mdi:open-in-new" size="18" />
          {{ t('admin.productEditorPage.preview') }}
        </NuxtLink>
        <button v-if="!isCreateMode" class="btn btn-outline btn-error" :disabled="saving || deleting" @click="removeProduct">
          <span v-if="deleting" class="loading loading-spinner loading-sm" />
          <Icon v-else name="mdi:delete" size="18" />
          {{ t('admin.productEditorPage.delete') }}
        </button>
        <button class="btn btn-primary" :disabled="saving" @click="save">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          <Icon v-else name="mdi:content-save-outline" size="18" />
          {{ t('admin.common.save') }}
        </button>
      </div>
    </div>

    <div v-if="loadingProduct" class="card bg-base-100 p-6">
      <span class="loading loading-spinner" />
    </div>

    <template v-else>
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="space-y-6">
          <section class="card bg-base-100 p-6 shadow-sm">
            <h2 class="text-xl font-semibold">{{ t('admin.productEditorPage.generalCard') }}</h2>
            <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div class="form-control flex flex-col gap-3 md:col-span-2">
                <AdminPageBuilderTranslationTabs v-model="editing.nameLocalized" :label="t('admin.productsPage.fieldName')" />
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.productsPage.fieldSlug') }}</span></label>
                <input v-model="editing.slug" class="input input-bordered" :placeholder="t('admin.productEditorPage.slugPlaceholder')" />
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.productsPage.fieldCategory') }}</span></label>
                <select v-model.number="editing.categoryId" class="select select-bordered">
                  <option :value="0">{{ t('admin.productsPage.noCategory') }}</option>
                  <option v-for="category in categories || []" :key="category.id" :value="category.id">{{ category.name }}</option>
                </select>
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.productsPage.fieldSaleType') }}</span></label>
                <select v-model="editing.saleType" class="select select-bordered">
                  <option value="SALE">{{ t('admin.productsPage.saleTypeSale') }}</option>
                  <option value="RENTAL">{{ t('admin.productsPage.saleTypeRental') }}</option>
                </select>
              </div>
              <div v-if="editing.saleType !== 'RENTAL'" class="form-control flex flex-col gap-3">
                <AdminPageBuilderTranslationTabs v-model="editing.unitLabelLocalized" :label="t('admin.productsPage.fieldUnit')" />
              </div>
              <div class="form-control flex flex-col gap-3 md:col-span-2">
                <AdminPageBuilderTranslationTabs v-model="editing.excerptLocalized" :label="t('admin.productsPage.fieldExcerpt')" multiline />
              </div>
              <div class="form-control flex flex-col gap-3 md:col-span-2">
                <AdminPageBuilderTranslationTabs v-model="editing.descriptionLocalized" :label="t('admin.productsPage.fieldDescription')" multiline />
              </div>
            </div>
          </section>

          <section class="card bg-base-100 p-6 shadow-sm">
            <h2 class="text-xl font-semibold">{{ t('admin.productEditorPage.mediaCard') }}</h2>
            <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div class="form-control flex flex-col gap-3 md:col-span-2">
                <label class="label"><span class="label-text">{{ t('admin.productsPage.fieldImage') }}</span></label>
                <ImageInput v-model="editing.imageUrl" />
              </div>
              <div v-if="editing.imageUrl" class="md:col-span-2">
                <AppImage :src="editing.imageUrl" :alt="localizedName || 'product'" class="h-72 w-full rounded-3xl object-cover" sizes="100vw" />
              </div>
            </div>
          </section>

          <section v-if="editing.saleType === 'RENTAL'" class="card bg-base-100 p-6 shadow-sm">
            <h2 class="text-xl font-semibold">{{ t('admin.productEditorPage.rentalCard') }}</h2>
            <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label class="form-control gap-2 md:col-span-2">
                <span class="label-text">{{ t('admin.productsPage.rentalBookingMode') }}</span>
                <select v-model="editing.rentalBookingMode" class="select select-bordered w-full">
                  <option value="SINGLE_DAY">{{ t('admin.productsPage.rentalModeSingleDay') }}</option>
                  <option value="MULTI_DAY">{{ t('admin.productsPage.rentalModeMultiDay') }}</option>
                  <option value="BOTH">{{ t('admin.productsPage.rentalModeBoth') }}</option>
                </select>
              </label>
              <label class="form-control gap-2 md:col-span-2">
                <span class="label-text">{{ t('admin.productsPage.rentalApprovalMode') }}</span>
                <select v-model="editing.rentalApprovalMode" class="select select-bordered w-full">
                  <option value="AUTO">{{ t('admin.productsPage.rentalApprovalAuto') }}</option>
                  <option value="MANUAL">{{ t('admin.productsPage.rentalApprovalManual') }}</option>
                </select>
                <span class="text-xs opacity-60">{{ t('admin.productsPage.rentalApprovalHelp') }}</span>
              </label>
              <label v-if="editing.rentalBookingMode !== 'MULTI_DAY'" class="form-control gap-2">
                <span class="label-text">{{ t('admin.productsPage.rentalHourlyPrice') }}</span>
                <input v-model.number="editing.rentalHourlyPrice" type="number" min="0" step="0.01" class="input input-bordered w-full" />
              </label>
              <label v-if="editing.rentalBookingMode !== 'SINGLE_DAY'" class="form-control gap-2">
                <span class="label-text">{{ t('admin.productsPage.rentalDailyPrice') }}</span>
                <input v-model.number="editing.rentalDailyPrice" type="number" min="0" step="0.01" class="input input-bordered w-full" />
              </label>
              <label class="form-control gap-2 md:col-span-2">
                <span class="label-text">{{ t('admin.productsPage.rentalPricingStrategy') }}</span>
                <select v-model="editing.rentalPricingStrategy" class="select select-bordered w-full">
                  <option value="LINEAR">{{ t('admin.productsPage.rentalPricingLinear') }}</option>
                  <option value="GRID">{{ t('admin.productsPage.rentalPricingGrid') }}</option>
                </select>
                <span class="text-xs opacity-60">{{ t('admin.productsPage.rentalPricingStrategyHelp') }}</span>
              </label>
              <div v-if="editing.rentalPricingStrategy === 'GRID'" class="md:col-span-2 rounded-box border border-base-300 p-4">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div class="font-medium">{{ t('admin.productsPage.rentalRateGrid') }}</div>
                    <div class="text-xs opacity-65">{{ t('admin.productsPage.rentalRateGridHelp') }}</div>
                  </div>
                  <button type="button" class="btn btn-sm btn-outline" @click="addRentalRate">{{ t('admin.productsPage.rentalRateAdd') }}</button>
                </div>
                <div v-if="editing.rentalRates.length" class="mt-4 space-y-3">
                  <div v-for="(rate, rateIndex) in editing.rentalRates" :key="rateIndex" class="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                    <label class="form-control gap-1">
                      <span class="label-text text-xs">{{ t('admin.productsPage.rentalRateMode') }}</span>
                      <select v-model="rate.pricingMode" class="select select-bordered select-sm">
                        <option value="HOURLY">{{ t('admin.productsPage.rentalRateHourly') }}</option>
                        <option value="DAILY">{{ t('admin.productsPage.rentalRateDaily') }}</option>
                      </select>
                    </label>
                    <label class="form-control gap-1">
                      <span class="label-text text-xs">{{ rate.pricingMode === 'HOURLY' ? t('admin.productsPage.rentalRateMinutes') : t('admin.productsPage.rentalRateDays') }}</span>
                      <input v-model.number="rate.duration" type="number" min="1" step="1" class="input input-bordered input-sm" />
                    </label>
                    <label class="form-control gap-1">
                      <span class="label-text text-xs">{{ t('admin.productsPage.rentalRatePrice') }}</span>
                      <input v-model.number="rate.price" type="number" min="0" step="0.01" class="input input-bordered input-sm" />
                    </label>
                    <button type="button" class="btn btn-sm btn-ghost text-error" @click="editing.rentalRates.splice(rateIndex, 1)">
                      <Icon name="mdi:delete-outline" size="18" />
                    </button>
                  </div>
                </div>
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.productsPage.fieldRentalAvailableFrom') }}</span></label>
                <input v-model="editing.rentalAvailableFrom" type="date" class="input input-bordered" />
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.productsPage.fieldRentalAvailableTo') }}</span></label>
                <input v-model="editing.rentalAvailableTo" type="date" class="input input-bordered" />
              </div>
              <div v-if="editing.rentalBookingMode !== 'SINGLE_DAY'" class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.productsPage.fieldRentalMinDays') }}</span></label>
                <input v-model.number="editing.rentalMinDays" type="number" min="1" step="1" class="input input-bordered" />
              </div>
              <div v-if="editing.rentalBookingMode !== 'SINGLE_DAY'" class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.productsPage.fieldRentalMaxDays') }}</span></label>
                <input v-model.number="editing.rentalMaxDays" type="number" min="1" step="1" class="input input-bordered" />
              </div>
              <label v-if="editing.rentalBookingMode !== 'MULTI_DAY'" class="form-control gap-2">
                <span class="label-text">{{ t('admin.productsPage.rentalDurations') }}</span>
                <input v-model="rentalDurationsInput" class="input input-bordered w-full" placeholder="60, 120, 240" />
                <span class="text-xs opacity-60">{{ t('admin.productsPage.rentalDurationsHelp') }}</span>
              </label>
              <label v-if="editing.rentalBookingMode !== 'MULTI_DAY'" class="form-control gap-2">
                <span class="label-text">{{ t('admin.productsPage.rentalSlotStep') }}</span>
                <input v-model.number="editing.rentalSlotStepMinutes" type="number" min="5" max="240" step="5" class="input input-bordered w-full" />
              </label>
              <div class="md:col-span-2 text-sm opacity-70">
                {{ t('admin.productsPage.rentalHelp') }}
              </div>
            </div>
          </section>

          <section v-if="editing.saleType === 'RENTAL'" class="card bg-base-100 p-6 shadow-sm">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 class="text-xl font-semibold">{{ t('admin.productEditorPage.lateFeeCard') }}</h2>
                <p class="mt-1 text-sm opacity-70">{{ t('admin.productEditorPage.lateFeeHelp') }}</p>
              </div>
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="editing.rentalLateFeeEnabled" type="checkbox" class="toggle toggle-primary" />
                <span class="label-text">{{ t('admin.productEditorPage.lateFeeEnabled') }}</span>
              </label>
            </div>
            <div v-if="editing.rentalLateFeeEnabled" class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label class="form-control gap-2 md:col-span-2">
                <span class="label-text">{{ t('admin.productEditorPage.lateFeeMode') }}</span>
                <select v-model="editing.rentalLateFeeMode" class="select select-bordered w-full">
                  <option value="FIXED">{{ t('admin.productEditorPage.lateFeeModeFixed') }}</option>
                  <option value="PER_HOUR_STARTED">{{ t('admin.productEditorPage.lateFeeModePerHour') }}</option>
                  <option value="PER_DAY_STARTED">{{ t('admin.productEditorPage.lateFeeModePerDay') }}</option>
                  <option value="HOURLY_MULTIPLIER">{{ t('admin.productEditorPage.lateFeeModeHourlyMultiplier') }}</option>
                  <option value="DAILY_MULTIPLIER">{{ t('admin.productEditorPage.lateFeeModeDailyMultiplier') }}</option>
                </select>
              </label>
              <label v-if="!editing.rentalLateFeeMode.endsWith('_MULTIPLIER')" class="form-control gap-2">
                <span class="label-text">{{ t('admin.productEditorPage.lateFeeAmount') }}</span>
                <input v-model.number="editing.rentalLateFeeAmount" type="number" min="0" step="0.01" class="input input-bordered w-full" />
              </label>
              <label v-else class="form-control gap-2">
                <span class="label-text">{{ t('admin.productEditorPage.lateFeeMultiplier') }}</span>
                <input v-model.number="editing.rentalLateFeeMultiplier" type="number" min="0.01" step="0.05" class="input input-bordered w-full" />
              </label>
              <label class="form-control gap-2">
                <span class="label-text">{{ t('admin.productEditorPage.lateFeeGraceMinutes') }}</span>
                <input v-model.number="editing.rentalLateFeeGraceMinutes" type="number" min="0" step="1" class="input input-bordered w-full" />
              </label>
              <label class="form-control gap-2">
                <span class="label-text">{{ t('admin.productEditorPage.lateFeeMinimum') }}</span>
                <input v-model.number="editing.rentalLateFeeMinimum" type="number" min="0" step="0.01" class="input input-bordered w-full" />
              </label>
              <label class="form-control gap-2">
                <span class="label-text">{{ t('admin.productEditorPage.lateFeeMaximum') }}</span>
                <input v-model.number="editing.rentalLateFeeMaximum" type="number" min="0" step="0.01" class="input input-bordered w-full" />
              </label>
              <label class="form-control gap-2">
                <span class="label-text">{{ t('admin.productEditorPage.lateFeeVatRate') }}</span>
                <input v-model.number="editing.rentalLateFeeVatRate" type="number" min="0" max="100" step="0.01" class="input input-bordered w-full" />
                <span class="text-xs opacity-60">{{ t('admin.productEditorPage.lateFeeVatRateHelp') }}</span>
              </label>
              <div class="alert alert-info py-3 text-sm md:col-span-2">
                <Icon name="mdi:information-outline" size="20" class="shrink-0" />
                {{ t('admin.productEditorPage.lateFeeDecisionHelp') }}
              </div>
            </div>
          </section>

          <section class="card bg-base-100 p-6 shadow-sm">
            <h2 class="text-xl font-semibold">{{ t('admin.productEditorPage.commerceCard') }}</h2>
            <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div v-if="editing.saleType !== 'RENTAL'" class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.productsPage.fieldPrice') }}</span></label>
                <input v-model.number="editing.price" type="number" min="0" step="0.01" class="input input-bordered" />
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.productsPage.fieldVatRate') }}</span></label>
                <input v-model.number="editing.vatRate" type="number" min="0" max="100" step="0.01" class="input input-bordered" />
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.productsPage.fieldAvailable') }}</span></label>
                <input v-model.number="editing.stock" type="number" min="0" step="1" class="input input-bordered" />
              </div>
              <div class="form-control flex gap-3 md:col-span-2">
                <div class="flex flex-wrap gap-x-6 gap-y-2">
                <label class="label cursor-pointer justify-start gap-3">
                  <input v-model="editing.allowOfflinePayment" type="checkbox" class="checkbox" />
                  <span class="label-text">{{ t('admin.productsPage.paymentOffline') }}</span>
                </label>
                <label class="label cursor-pointer justify-start gap-3">
                  <input v-model="editing.allowOnlinePayment" type="checkbox" class="checkbox" :disabled="!onlinePaymentAvailable" />
                  <span class="label-text">{{ t('admin.productsPage.paymentOnline') }}</span>
                </label>
                </div>
                <div v-if="!onlinePaymentAvailable" class="alert alert-warning mt-2 py-3 text-sm">
                  <Icon name="mdi:information-outline" size="20" class="shrink-0" />
                  {{ t('admin.productsPage.paymentOnlineUnavailable') }}
                </div>
              </div>
              <div class="form-control flex gap-3">
                <label class="label cursor-pointer justify-start gap-3">
                  <input v-model="editing.active" type="checkbox" class="checkbox" />
                  <span class="label-text">{{ t('admin.productsPage.fieldActive') }}</span>
                </label>
              </div>
              <div class="form-control flex gap-3">
                <label class="label cursor-pointer justify-start gap-3">
                  <input v-model="editing.catalogVisible" type="checkbox" class="checkbox" />
                  <span class="label-text">{{ t('admin.productOptions.catalogVisible') }}</span>
                </label>
                <span class="text-xs opacity-60">{{ t('admin.productOptions.catalogVisibleHelp') }}</span>
              </div>
              <div class="form-control flex gap-3 md:col-span-2">
                <label class="label cursor-pointer justify-start gap-3">
                  <input v-model="editing.allowCustomerCancellation" type="checkbox" class="checkbox" />
                  <span class="label-text">{{ t('admin.productEditorPage.allowCustomerCancellation') }}</span>
                </label>
              </div>
              <div class="form-control flex gap-3 md:col-span-2">
                <label class="label cursor-pointer justify-start gap-3">
                  <input v-model="editing.allowRefundRequestAfterEngagement" type="checkbox" class="checkbox" />
                  <span class="label-text">{{ t('admin.productEditorPage.allowRefundRequestAfterEngagement') }}</span>
                </label>
              </div>
              <div class="md:col-span-2 text-sm opacity-70">
                {{ t('admin.productEditorPage.refundPolicyHelp') }}
              </div>
            </div>
          </section>

          <section v-if="editing.saleType === 'RENTAL'" class="card bg-base-100 p-6 shadow-sm">
            <h2 class="text-xl font-semibold">{{ t('admin.productEditorPage.depositCard') }}</h2>
            <p class="mt-1 text-sm opacity-70">{{ t('admin.productEditorPage.depositHelp') }}</p>
            <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label class="form-control gap-2">
                <span class="label-text">{{ t('admin.productEditorPage.depositAmount') }}</span>
                <input v-model.number="editing.rentalDepositAmount" type="number" min="0" step="0.01" class="input input-bordered w-full" />
                <span class="text-xs opacity-60">{{ t('admin.productEditorPage.depositAmountHelp') }}</span>
              </label>
              <div v-if="Number(editing.rentalDepositAmount || 0) > 0" class="rounded-box border border-base-300 bg-base-200/35 p-4">
                <div class="font-medium">{{ t('admin.productEditorPage.depositPaymentModes') }}</div>
                <div class="mt-3 flex flex-col gap-2">
                  <label class="label cursor-pointer justify-start gap-3">
                    <input v-model="editing.rentalDepositAllowOnsitePayment" type="checkbox" class="checkbox" />
                    <span class="label-text">{{ t('admin.productEditorPage.depositPaymentOnsite') }}</span>
                  </label>
                  <label class="label cursor-pointer justify-start gap-3">
                    <input v-model="editing.rentalDepositAllowOnlinePayment" type="checkbox" class="checkbox" :disabled="!onlinePaymentAvailable" />
                    <span class="label-text">{{ t('admin.productEditorPage.depositPaymentOnline') }}</span>
                  </label>
                </div>
                <p v-if="!onlinePaymentAvailable" class="mt-2 text-xs text-warning">{{ t('admin.productEditorPage.depositOnlineUnavailable') }}</p>
              </div>
            </div>
          </section>

          <section class="card bg-base-100 p-6 shadow-sm">
            <div>
              <h2 class="text-xl font-semibold">{{ t('admin.productOptions.productCard') }}</h2>
              <p class="mt-1 text-sm opacity-70">{{ t('admin.productOptions.productCardHelp') }}</p>
            </div>

            <div v-if="matchingOptionSets.length" class="mt-5 space-y-4">
              <article v-for="set in matchingOptionSets" :key="set.id" class="rounded-box border border-base-300 bg-base-200/25 p-4">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 class="font-medium">{{ set.name }}</h3>
                    <p class="mt-1 text-xs opacity-65">{{ t('admin.productOptions.inheritedSetHelp') }}</p>
                  </div>
                  <label class="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      class="toggle toggle-primary"
                      :checked="!editing.excludedOptionSetIds.includes(set.id)"
                      @change="toggleOptionSet(set.id, ($event.target as HTMLInputElement).checked)"
                    />
                    <span class="label-text">{{ t('admin.productOptions.applySet') }}</span>
                  </label>
                </div>

                <div v-if="!editing.excludedOptionSetIds.includes(set.id)" class="mt-4 grid gap-3 lg:grid-cols-2">
                  <div v-for="option in set.optionGroups.flatMap(group => group.options)" :key="option.id" class="rounded-box border border-base-300 bg-base-100 p-3">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <div class="font-medium">{{ option.label || option.id }}</div>
                        <div class="mt-1 text-xs opacity-65">{{ inheritedPriceDescription(option) }}</div>
                      </div>
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm"
                        :checked="optionOverride(set.id, option.id).enabled"
                        :aria-label="t('admin.productOptions.enableOption')"
                        @change="setOptionEnabled(set.id, option.id, ($event.target as HTMLInputElement).checked)"
                      />
                    </div>
                    <label class="form-control mt-3 gap-1">
                      <span class="label-text text-xs">{{ t('admin.productOptions.parentPriceOverride') }}</span>
                      <input
                        :value="optionOverride(set.id, option.id).price ?? ''"
                        type="number"
                        min="0"
                        step="0.01"
                        class="input input-bordered input-sm w-full"
                        :placeholder="t('admin.productOptions.keepInheritedPrice')"
                        @input="setOptionPrice(set.id, option.id, ($event.target as HTMLInputElement).value)"
                      />
                    </label>
                  </div>
                </div>
              </article>
            </div>
            <div v-else class="mt-5 rounded-box border border-dashed border-base-300 p-5 text-sm opacity-65">
              {{ t('admin.productOptions.noInheritedSets') }}
            </div>

            <div class="divider">{{ t('admin.productOptions.localOptions') }}</div>
            <p class="mb-4 text-sm opacity-65">{{ t('admin.productOptions.localOptionsHelp') }}</p>
            <AdminShopProductOptionGroupsEditor
              v-model="editing.optionGroups"
              :locales="editorLocales"
              :products="optionProducts"
              :billing-documents="billingDocumentsData || []"
              :excluded-product-id="editing.id"
            />
          </section>

          <section class="card bg-base-100 p-6 shadow-sm">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 class="text-xl font-semibold">{{ t('admin.productEditorPage.sectionsCard') }}</h2>
                <p class="mt-1 text-sm opacity-70">{{ t('admin.productEditorPage.sectionsHelp') }}</p>
              </div>
              <button class="btn btn-outline btn-sm" @click="addSection">
                <Icon name="mdi:plus" size="16" />
                {{ t('admin.productEditorPage.addSection') }}
              </button>
            </div>

            <div class="mt-5 space-y-4">
              <div
                v-for="(section, sectionIndex) in editing.detailSections"
                :key="section.id"
                class="rounded-3xl border border-base-300 bg-base-50 p-4"
              >
                <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div class="form-control flex flex-col gap-3 flex-1">
                    <AdminPageBuilderTranslationTabs v-model="section.titleLocalized" :label="t('admin.productEditorPage.sectionTitle')" />
                  </div>
                  <button class="btn btn-ghost btn-sm text-error lg:self-end" @click="removeSection(sectionIndex)">
                    <Icon name="mdi:delete" size="16" />
                    {{ t('admin.productEditorPage.removeSection') }}
                  </button>
                </div>

                <div class="space-y-3">
                  <div
                    v-for="(item, itemIndex) in section.items"
                    :key="item.id"
                    class="grid grid-cols-1 gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
                  >
                    <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                      <div class="form-control flex flex-col gap-3">
                        <AdminPageBuilderTranslationTabs v-model="item.labelLocalized" :label="t('admin.productEditorPage.fieldLabel')" />
                      </div>
                      <div class="form-control flex flex-col gap-3">
                        <AdminPageBuilderTranslationTabs v-model="item.valueLocalized" :label="t('admin.productEditorPage.fieldValue')" multiline />
                      </div>
                      <button class="btn btn-ghost btn-sm text-error md:self-end" @click="removeSectionItem(sectionIndex, itemIndex)">
                        <Icon name="mdi:close" size="16" />
                      </button>
                    </div>
                    <div class="grid grid-cols-1 gap-3 md:grid-cols-[12rem_minmax(0,1fr)]">
                      <div class="form-control flex flex-col gap-3">
                        <label class="label"><span class="label-text">{{ t('admin.productEditorPage.fieldMediaType') }}</span></label>
                        <select v-model="item.mediaKind" class="select select-bordered">
                          <option :value="null">{{ t('admin.productEditorPage.fieldMediaNone') }}</option>
                          <option value="image">{{ t('admin.productEditorPage.fieldMediaImage') }}</option>
                          <option value="pdf">{{ t('admin.productEditorPage.fieldMediaPdf') }}</option>
                          <option value="billingDocument">{{ t('admin.productEditorPage.fieldMediaBillingDocument') }}</option>
                        </select>
                      </div>
                      <div v-if="item.mediaKind === 'image'" class="form-control flex flex-col gap-3">
                        <label class="label"><span class="label-text">{{ t('admin.productEditorPage.fieldMediaFile') }}</span></label>
                        <ImageInput v-model="item.mediaUrl" />
                      </div>
                      <div v-else-if="item.mediaKind === 'pdf'" class="form-control flex flex-col gap-3">
                        <label class="label"><span class="label-text">{{ t('admin.productEditorPage.fieldMediaFile') }}</span></label>
                        <input v-model="item.mediaUrl" type="url" class="input input-bordered" :placeholder="t('admin.productEditorPage.fieldMediaPdfPlaceholder')" />
                      </div>
                      <div v-else-if="item.mediaKind === 'billingDocument'" class="form-control flex flex-col gap-3">
                        <label class="label"><span class="label-text">{{ t('admin.productEditorPage.fieldMediaBillingDocument') }}</span></label>
                        <select v-model.number="item.mediaDocumentId" class="select select-bordered">
                          <option :value="0">{{ t('admin.productEditorPage.fieldMediaBillingDocumentPlaceholder') }}</option>
                          <option
                            v-for="document in availableBillingDocuments"
                            :key="document.id"
                            :value="document.id"
                          >
                            {{ document.name }} · {{ billingDocumentKindLabel(document.kind) }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <button class="btn btn-ghost btn-sm mt-4" @click="addSectionItem(sectionIndex)">
                  <Icon name="mdi:plus" size="16" />
                  {{ t('admin.productEditorPage.addField') }}
                </button>
              </div>

              <div v-if="!editing.detailSections.length" class="rounded-3xl border border-dashed border-base-300 px-4 py-10 text-center opacity-60">
                {{ t('admin.productEditorPage.noSection') }}
              </div>
            </div>
          </section>
        </div>

        <aside class="space-y-6">
          <section class="card bg-base-100 p-6 shadow-sm">
            <h2 class="text-xl font-semibold">{{ t('admin.productEditorPage.summaryCard') }}</h2>
            <dl class="mt-5 space-y-4 text-sm">
              <div class="flex items-start justify-between gap-4">
                <dt class="font-medium">{{ t('admin.productsPage.headers.status') }}</dt>
                <dd>
                  <span class="badge" :class="editing.active ? 'badge-success' : 'badge-ghost'">
                    {{ editing.active ? t('admin.productsPage.active') : t('admin.productsPage.inactive') }}
                  </span>
                </dd>
              </div>
              <div class="flex items-start justify-between gap-4">
                <dt class="font-medium">{{ t('admin.productsPage.headers.saleType') }}</dt>
                <dd>{{ editing.saleType === 'RENTAL' ? t('admin.productsPage.saleTypeRental') : t('admin.productsPage.saleTypeSale') }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4">
                <dt class="font-medium">{{ t('admin.productsPage.headers.price') }}</dt>
                <dd>{{ $formatPrice(editing.price || 0) }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4">
                <dt class="font-medium">{{ t('admin.productsPage.fieldAvailable') }}</dt>
                <dd>{{ editing.stock || 0 }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4">
                <dt class="font-medium">{{ t('admin.productEditorPage.sectionCount') }}</dt>
                <dd>{{ editing.detailSections.length }}</dd>
              </div>
            </dl>
          </section>
          <AdminSortPositionControl
            v-model="editing.position"
            :label="t('admin.productsPage.fieldPosition')"
            :help="t('admin.productsPage.fieldPositionHelp')"
          />
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { getAdminRoutePath, normalizeAdminRouteLocale } from '#modula/shared/adminRoutes'
import AdminPageBuilderTranslationTabs from '#modula/components/admin/page-builder/TranslationTabs.vue'
import { createEmptyCmsLocalizedText, pickCmsLocalizedText, type CmsLocalizedText } from '#modula/shared/cms'
import type { ProductDetailField, ProductDetailSection, ProductOptionSetPayload, ProductPayload } from '#modula/server/utils/shop'
import type { RentalRate } from '#modula/shared/rentalRates'
import type { ProductOption, ProductOptionGroup, ProductOptionOverride } from '#modula/shared/productOptions'
import type { RentalLateFeeMode } from '#modula/shared/rentalLateFees'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

interface ProductCategory {
  id: number
  name: string
  slug: string
}

interface BillingDocumentOption {
  id: number
  kind: 'INVOICE' | 'CONTRACT' | 'ASSURANCE'
  name: string
  slug: string
  active: boolean
}

interface ProductEditorState {
  id?: number
  nameLocalized: CmsLocalizedText
  slug: string
  saleType: 'SALE' | 'RENTAL'
  categoryId: number
  excerptLocalized: CmsLocalizedText
  descriptionLocalized: CmsLocalizedText
  imageUrl: string
  price: number
  vatRate: number
  stock: number
  rentalAvailableFrom: string
  rentalAvailableTo: string
  rentalMinDays: number
  rentalMaxDays: number | null
  rentalBookingMode: 'SINGLE_DAY' | 'MULTI_DAY' | 'BOTH'
  rentalApprovalMode: 'AUTO' | 'MANUAL'
  rentalHourlyPrice: number | null
  rentalDailyPrice: number | null
  rentalPricingStrategy: 'LINEAR' | 'GRID'
  rentalRates: RentalRate[]
  rentalDurations: number[]
  rentalSlotStepMinutes: number
  rentalDepositAmount: number | null
  rentalDepositAllowOnsitePayment: boolean
  rentalDepositAllowOnlinePayment: boolean
  rentalLateFeeEnabled: boolean
  rentalLateFeeMode: RentalLateFeeMode
  rentalLateFeeAmount: number | null
  rentalLateFeeMultiplier: number | null
  rentalLateFeeGraceMinutes: number
  rentalLateFeeMinimum: number | null
  rentalLateFeeMaximum: number | null
  rentalLateFeeVatRate: number | null
  unitLabelLocalized: CmsLocalizedText
  allowOfflinePayment: boolean
  allowOnlinePayment: boolean
  allowCustomerCancellation: boolean
  allowRefundRequestAfterEngagement: boolean
  active: boolean
  catalogVisible: boolean
  position: number
  detailSections: ProductDetailSection[]
  optionGroups: ProductOptionGroup[]
  excludedOptionSetIds: number[]
  optionOverrides: ProductOptionOverride[]
}

const route = useRoute()
const localePath = useLocalePath()
const { locale, t } = useI18n()
const { locales: siteLocales } = useSiteLocales()
const { $toast } = useNuxtApp() as any
const productsBasePath = computed(() => getAdminRoutePath('shopProducts', normalizeAdminRouteLocale(locale.value)))
const editorLocales = computed(() => siteLocales.value.length ? [...siteLocales.value] : ['fr', 'en'])

const routeId = computed(() => String(route.params.id || ''))
const isCreateMode = computed(() => routeId.value === 'new')
const loadingProduct = ref(false)
const saving = ref(false)
const deleting = ref(false)

const { data: categories } = await useFetch<ProductCategory[]>('/api/admin/product-categories')
const { data: settingsData } = await useFetch<{ shopDefaultVatRate: number }>('/api/admin/settings')
const { data: billingDocumentsData } = await useFetch<BillingDocumentOption[]>('/api/admin/billing-documents')
const { data: productOptionsData, refresh: refreshProductOptions } = await useFetch<ProductOptionSetPayload[]>('/api/admin/product-option-sets')
const { data: optionProductsData } = await useFetch<ProductPayload[]>('/api/admin/products')
const { data: paymentConfigData } = await useFetch<{
  onlinePaymentsEnabled: boolean
  onlinePayments: { provider: 'none' | 'stripe_connect', configured: boolean }
}>('/api/admin/payments/config')

const defaultVatRate = computed(() => Number(settingsData.value?.shopDefaultVatRate ?? 20))
const onlinePaymentAvailable = computed(() => Boolean(
  paymentConfigData.value?.onlinePaymentsEnabled
  && paymentConfigData.value.onlinePayments?.configured
  && paymentConfigData.value.onlinePayments.provider === 'stripe_connect'
))
const availableBillingDocuments = computed(() =>
  (billingDocumentsData.value || []).filter((entry) => entry.kind === 'CONTRACT' || entry.kind === 'ASSURANCE')
)
const optionProducts = computed(() => (optionProductsData.value || []).map(product => ({
  id: product.id,
  name: product.name,
  saleType: product.saleType,
})))
const matchingOptionSets = computed(() => (productOptionsData.value || []).filter((set) => {
  if (!set.active || !set.saleTypes.includes(editing.saleType)) return false
  const hasTargets = set.categoryIds.length > 0 || set.productIds.length > 0
  if (!hasTargets) return true
  return Boolean(editing.id && set.productIds.includes(editing.id))
    || Boolean(editing.categoryId && set.categoryIds.includes(editing.categoryId))
}))

const editing = reactive<ProductEditorState>(createEmptyEditorState(defaultVatRate.value, t, editorLocales.value))
const rentalDurationsInput = computed({
  get: () => editing.rentalDurations.join(', '),
  set: (value: string) => {
    editing.rentalDurations = value.split(',').map(Number).filter(entry => Number.isInteger(entry) && entry > 0)
  }
})
const localizedName = computed(() => pickCmsLocalizedText(locale.value, editing.nameLocalized) || editing.slug || '')

const previewPath = computed(() => {
  if (!editing.slug.trim()) return null
  return localePath(`/products/${editing.slug.trim()}`)
})

watch(defaultVatRate, (value) => {
  if (!editing.id && !editing.vatRate) {
    editing.vatRate = value
  }
})

watch([paymentConfigData, onlinePaymentAvailable], ([config, available]) => {
  if (config && !available) {
    editing.allowOnlinePayment = false
    editing.rentalDepositAllowOnlinePayment = false
  }
}, { immediate: true })

watch(() => routeId.value, async () => {
  await loadProduct()
}, { immediate: true })

async function loadProduct() {
  if (isCreateMode.value) {
    Object.assign(editing, createEmptyEditorState(defaultVatRate.value, t, editorLocales.value))
    return
  }

  loadingProduct.value = true
  try {
    const product = await $fetch<ProductPayload>(`/api/admin/products/${routeId.value}`)
    Object.assign(editing, mapProductToEditor(product))
  } finally {
    loadingProduct.value = false
  }
}

function goBack() {
  return navigateTo(localePath(productsBasePath.value))
}

function addSection() {
  editing.detailSections.push(createDetailSection(t('admin.productEditorPage.newSectionTitle'), editorLocales.value))
}

function removeSection(index: number) {
  editing.detailSections.splice(index, 1)
}

function addSectionItem(sectionIndex: number) {
  editing.detailSections[sectionIndex]?.items.push(createDetailField(editorLocales.value))
}

function removeSectionItem(sectionIndex: number, itemIndex: number) {
  editing.detailSections[sectionIndex]?.items.splice(itemIndex, 1)
}

function billingDocumentKindLabel(kind: BillingDocumentOption['kind']) {
  return kind === 'ASSURANCE'
    ? t('admin.billingDocumentsPage.kindAssurance')
    : kind === 'INVOICE'
      ? t('admin.billingDocumentsPage.kindInvoice')
      : t('admin.billingDocumentsPage.kindContract')
}

async function save() {
  if (!localizedName.value.trim()) {
    $toast.error(t('admin.productEditorPage.nameRequired'))
    return
  }
  if (!editing.allowOfflinePayment && !editing.allowOnlinePayment) {
    $toast.error(t('admin.productEditorPage.paymentRequired'))
    return
  }
  if (editing.saleType === 'RENTAL' && Number(editing.rentalDepositAmount || 0) > 0
    && !editing.rentalDepositAllowOnsitePayment && !editing.rentalDepositAllowOnlinePayment) {
    $toast.error(t('admin.productEditorPage.depositPaymentRequired'))
    return
  }

  saving.value = true
  try {
    const payload = {
      nameLocalized: editing.nameLocalized,
      slug: editing.slug,
      saleType: editing.saleType,
      categoryId: editing.categoryId || null,
      excerptLocalized: editing.excerptLocalized,
      descriptionLocalized: editing.descriptionLocalized,
      imageUrl: editing.imageUrl,
      price: editing.saleType === 'RENTAL'
        ? Number(editing.rentalDailyPrice ?? editing.rentalHourlyPrice ?? editing.price ?? 0)
        : editing.price,
      vatRate: editing.vatRate,
      stock: editing.stock,
      rentalAvailableFrom: editing.saleType === 'RENTAL' ? normalizeDateValue(editing.rentalAvailableFrom) : null,
      rentalAvailableTo: editing.saleType === 'RENTAL' ? normalizeDateValue(editing.rentalAvailableTo) : null,
      rentalMinDays: editing.saleType === 'RENTAL' ? Number(editing.rentalMinDays || 1) : 1,
      rentalMaxDays: editing.saleType === 'RENTAL' ? normalizeNullableNumber(editing.rentalMaxDays) : null,
      rentalBookingMode: editing.rentalBookingMode,
      rentalApprovalMode: editing.rentalApprovalMode,
      rentalHourlyPrice: editing.rentalHourlyPrice,
      rentalDailyPrice: editing.rentalDailyPrice,
      rentalPricingStrategy: editing.rentalPricingStrategy,
      rentalRates: editing.rentalRates,
      rentalDurations: editing.rentalDurations,
      rentalSlotStepMinutes: editing.rentalSlotStepMinutes,
      rentalDepositAmount: editing.saleType === 'RENTAL' ? normalizeNullableNumber(editing.rentalDepositAmount) : null,
      rentalDepositAllowOnsitePayment: editing.rentalDepositAllowOnsitePayment,
      rentalDepositAllowOnlinePayment: editing.rentalDepositAllowOnlinePayment,
      rentalLateFeeEnabled: editing.saleType === 'RENTAL' && editing.rentalLateFeeEnabled,
      rentalLateFeeMode: editing.rentalLateFeeMode,
      rentalLateFeeAmount: normalizeNullableNumber(editing.rentalLateFeeAmount),
      rentalLateFeeMultiplier: normalizeNullableNumber(editing.rentalLateFeeMultiplier),
      rentalLateFeeGraceMinutes: Math.max(0, Number(editing.rentalLateFeeGraceMinutes || 0)),
      rentalLateFeeMinimum: normalizeNullableNumber(editing.rentalLateFeeMinimum),
      rentalLateFeeMaximum: normalizeNullableNumber(editing.rentalLateFeeMaximum),
      rentalLateFeeVatRate: normalizeNullableNumber(editing.rentalLateFeeVatRate),
      unitLabelLocalized: editing.unitLabelLocalized,
      allowOfflinePayment: editing.allowOfflinePayment,
      allowOnlinePayment: editing.allowOnlinePayment,
      allowCustomerCancellation: editing.allowCustomerCancellation,
      allowRefundRequestAfterEngagement: editing.allowRefundRequestAfterEngagement,
      active: editing.active,
      catalogVisible: editing.catalogVisible,
      position: editing.position,
      detailSections: normalizeDetailSectionsForSave(editing.detailSections, editorLocales.value),
      optionGroups: editing.optionGroups,
      excludedOptionSetIds: editing.excludedOptionSetIds,
      optionOverrides: editing.optionOverrides,
    }

    const response = isCreateMode.value
      ? await $fetch<ProductPayload>('/api/admin/products', { method: 'POST', body: payload })
      : await $fetch<ProductPayload>(`/api/admin/products/${editing.id}`, { method: 'PUT', body: payload })

    $toast.success(t('admin.productsPage.saved'))

    if (isCreateMode.value) {
      await navigateTo(localePath(`${productsBasePath.value}/${response.id}`))
      return
    }

    await refreshProductOptions()
    Object.assign(editing, mapProductToEditor(response))
  } catch (error: any) {
    $toast.error(error?.statusMessage || t('common.error'))
  } finally {
    saving.value = false
  }
}

async function removeProduct() {
  if (!editing.id) return
  if (!confirm(t('admin.productsPage.deleteConfirm', { name: localizedName.value || `#${editing.id}` }))) return

  deleting.value = true
  try {
    await $fetch(`/api/admin/products/${editing.id}`, { method: 'DELETE' })
    $toast.success(t('admin.productEditorPage.archived'))
    await navigateTo(localePath(productsBasePath.value))
  } catch (error: any) {
    $toast.error(error?.statusMessage || t('common.error'))
  } finally {
    deleting.value = false
  }
}

function createEmptyEditorState(vatRate: number, translate: (key: string) => string, locales: string[]): ProductEditorState {
  return {
    id: undefined,
    nameLocalized: createEmptyCmsLocalizedText(locales),
    slug: '',
    saleType: 'SALE',
    categoryId: 0,
    excerptLocalized: createEmptyCmsLocalizedText(locales),
    descriptionLocalized: createEmptyCmsLocalizedText(locales),
    imageUrl: '',
    price: 0,
    vatRate,
    stock: 0,
    rentalAvailableFrom: '',
    rentalAvailableTo: '',
    rentalMinDays: 1,
    rentalMaxDays: null,
    rentalBookingMode: 'MULTI_DAY',
    rentalApprovalMode: 'AUTO',
    rentalHourlyPrice: null,
    rentalDailyPrice: null,
    rentalPricingStrategy: 'LINEAR',
    rentalRates: [],
    rentalDurations: [60, 120, 240],
    rentalSlotStepMinutes: 30,
    rentalDepositAmount: null,
    rentalDepositAllowOnsitePayment: true,
    rentalDepositAllowOnlinePayment: false,
    rentalLateFeeEnabled: false,
    rentalLateFeeMode: 'PER_HOUR_STARTED',
    rentalLateFeeAmount: null,
    rentalLateFeeMultiplier: 1.5,
    rentalLateFeeGraceMinutes: 15,
    rentalLateFeeMinimum: null,
    rentalLateFeeMaximum: null,
    rentalLateFeeVatRate: vatRate,
    unitLabelLocalized: createEmptyCmsLocalizedText(locales),
    allowOfflinePayment: true,
    allowOnlinePayment: false,
    allowCustomerCancellation: true,
    allowRefundRequestAfterEngagement: false,
    active: true,
    catalogVisible: true,
    position: 0,
    detailSections: [
      createDetailSection(translate('admin.productEditorPage.defaultSectionGeneral'), locales),
      createDetailSection(translate('admin.productEditorPage.defaultSectionTechnical'), locales),
      createDetailSection(translate('admin.productEditorPage.defaultSectionPractical'), locales)
    ],
    optionGroups: [],
    excludedOptionSetIds: [],
    optionOverrides: []
  }
}

function mapProductToEditor(product: ProductPayload): ProductEditorState {
  return {
    id: product.id,
    nameLocalized: structuredClone(product.nameLocalized),
    slug: product.slug,
    saleType: product.saleType,
    categoryId: product.categoryId || 0,
    excerptLocalized: structuredClone(product.excerptLocalized),
    descriptionLocalized: structuredClone(product.descriptionLocalized),
    imageUrl: product.imageUrl || '',
    price: product.price,
    vatRate: product.vatRate,
    stock: product.stock,
    rentalAvailableFrom: toDateInputValue(product.rentalAvailableFrom),
    rentalAvailableTo: toDateInputValue(product.rentalAvailableTo),
    rentalMinDays: product.rentalMinDays || 1,
    rentalMaxDays: product.rentalMaxDays ?? null,
    rentalBookingMode: product.rentalBookingMode,
    rentalApprovalMode: product.rentalApprovalMode,
    rentalHourlyPrice: product.rentalHourlyPrice ?? (product.rentalBookingMode === 'SINGLE_DAY' ? product.price : null),
    rentalDailyPrice: product.rentalDailyPrice ?? (product.rentalBookingMode === 'MULTI_DAY' ? product.price : null),
    rentalPricingStrategy: product.rentalPricingStrategy,
    rentalRates: structuredClone(product.rentalRates || []),
    rentalDurations: [...product.rentalDurations],
    rentalSlotStepMinutes: product.rentalSlotStepMinutes,
    rentalDepositAmount: product.rentalDepositAmount,
    rentalDepositAllowOnsitePayment: product.rentalDepositAllowOnsitePayment,
    rentalDepositAllowOnlinePayment: product.rentalDepositAllowOnlinePayment,
    rentalLateFeeEnabled: product.rentalLateFeeEnabled,
    rentalLateFeeMode: product.rentalLateFeeMode,
    rentalLateFeeAmount: product.rentalLateFeeAmount,
    rentalLateFeeMultiplier: product.rentalLateFeeMultiplier,
    rentalLateFeeGraceMinutes: product.rentalLateFeeGraceMinutes,
    rentalLateFeeMinimum: product.rentalLateFeeMinimum,
    rentalLateFeeMaximum: product.rentalLateFeeMaximum,
    rentalLateFeeVatRate: product.rentalLateFeeVatRate ?? product.vatRate,
    unitLabelLocalized: structuredClone(product.unitLabelLocalized),
    allowOfflinePayment: product.allowOfflinePayment,
    allowOnlinePayment: product.allowOnlinePayment,
    allowCustomerCancellation: product.allowCustomerCancellation,
    allowRefundRequestAfterEngagement: product.allowRefundRequestAfterEngagement,
    active: product.active,
    catalogVisible: product.catalogVisible,
    position: product.position,
    detailSections: Array.isArray(product.detailSections)
      ? product.detailSections.map((section) => ({
          id: section.id,
          title: section.title,
          titleLocalized: structuredClone(section.titleLocalized),
          items: section.items.map((item) => ({
            id: item.id,
            label: item.label,
            labelLocalized: structuredClone(item.labelLocalized),
            value: item.value,
            valueLocalized: structuredClone(item.valueLocalized),
            mediaKind: item.mediaKind ?? null,
            mediaUrl: item.mediaUrl ?? null,
            mediaDocumentId: item.mediaDocumentId ?? null,
            mediaDocumentName: item.mediaDocumentName ?? null,
            mediaDocumentKind: item.mediaDocumentKind ?? null,
            mediaDocumentRentalHourlyPrice: item.mediaDocumentRentalHourlyPrice ?? null,
            mediaDocumentRentalDailyPrice: item.mediaDocumentRentalDailyPrice ?? null,
            mediaDocumentRequiredForRental: item.mediaDocumentRequiredForRental ?? false
          }))
        }))
      : [],
    optionGroups: structuredClone(product.optionGroups || []),
    excludedOptionSetIds: [...(product.excludedOptionSetIds || [])],
    optionOverrides: structuredClone(product.optionOverrides || []),
  }
}

function addRentalRate() {
  editing.rentalRates.push({
    pricingMode: editing.rentalBookingMode === 'MULTI_DAY' ? 'DAILY' : 'HOURLY',
    duration: editing.rentalBookingMode === 'MULTI_DAY' ? 1 : 60,
    price: 0,
  })
}

function toggleOptionSet(optionSetId: number, enabled: boolean) {
  editing.excludedOptionSetIds = enabled
    ? editing.excludedOptionSetIds.filter(id => id !== optionSetId)
    : Array.from(new Set([...editing.excludedOptionSetIds, optionSetId]))
}

function optionOverride(optionSetId: number, optionId: string): ProductOptionOverride {
  return editing.optionOverrides.find(entry => entry.optionSetId === optionSetId && entry.optionId === optionId)
    || { optionSetId, optionId, enabled: true, price: null }
}

function updateOptionOverride(optionSetId: number, optionId: string, patch: Partial<ProductOptionOverride>) {
  const current = optionOverride(optionSetId, optionId)
  const next = { ...current, ...patch }
  editing.optionOverrides = [
    ...editing.optionOverrides.filter(entry => entry.optionSetId !== optionSetId || entry.optionId !== optionId),
    next,
  ]
}

function setOptionEnabled(optionSetId: number, optionId: string, enabled: boolean) {
  updateOptionOverride(optionSetId, optionId, { enabled })
}

function setOptionPrice(optionSetId: number, optionId: string, value: string) {
  const normalized = value.trim() === '' ? null : Math.max(0, Number(value) || 0)
  updateOptionOverride(optionSetId, optionId, { price: normalized })
}

function inheritedPriceDescription(option: ProductOption) {
  if (option.kind === 'ACCESSORY' && option.priceSource === 'LINKED_PRODUCT') {
    const product = optionProductsData.value?.find(entry => entry.id === option.linkedProductId)
    return t('admin.productOptions.catalogPriceDescription', { price: product?.price ?? 0 })
  }
  return t('admin.productOptions.setPriceDescription', { price: option.price })
}

function createDetailSection(title: string, locales: string[]): ProductDetailSection {
  const titleLocalized = createFilledLocalizedText(locales, title)
  return {
    id: crypto.randomUUID(),
    title,
    titleLocalized,
    items: [createDetailField(locales)]
  }
}

function createDetailField(locales: string[]): ProductDetailField {
  return {
    id: crypto.randomUUID(),
    label: '',
    labelLocalized: createEmptyCmsLocalizedText(locales),
    value: '',
    valueLocalized: createEmptyCmsLocalizedText(locales),
    mediaKind: null,
    mediaUrl: null,
    mediaDocumentId: null,
    mediaDocumentName: null,
    mediaDocumentKind: null,
    mediaDocumentRentalHourlyPrice: null,
    mediaDocumentRentalDailyPrice: null,
    mediaDocumentRequiredForRental: false
  }
}

function createFilledLocalizedText(locales: string[], value: string) {
  const normalizedValue = String(value || '').trim()
  const entries = locales.length ? locales : ['fr', 'en']
  return Object.fromEntries(
    entries.map((localeCode, index) => [
      localeCode,
      index === 0 || localeCode === 'fr' || localeCode === 'en' ? normalizedValue : ''
    ])
  ) as CmsLocalizedText
}

function normalizeLocalizedTextForSave(value: CmsLocalizedText | null | undefined, locales: string[]) {
  const normalized = createEmptyCmsLocalizedText(locales)
  for (const localeCode of locales) {
    normalized[localeCode] = String(value?.[localeCode] || '').trim()
  }
  for (const [localeCode, localeValue] of Object.entries(value || {})) {
    if (!locales.includes(localeCode)) {
      normalized[localeCode] = String(localeValue || '').trim()
    }
  }
  return normalized
}

function normalizeDetailSectionsForSave(value: ProductDetailSection[], locales: string[]) {
  return value
    .map((section) => ({
      id: section.id || crypto.randomUUID(),
      titleLocalized: normalizeLocalizedTextForSave(section.titleLocalized, locales),
      items: section.items
        .map((item) => {
          const linkedDocument = item.mediaKind === 'billingDocument'
            ? availableBillingDocuments.value.find((entry) => entry.id === Number(item.mediaDocumentId))
            : null
          return {
            id: item.id || crypto.randomUUID(),
            labelLocalized: normalizeLocalizedTextForSave(item.labelLocalized, locales),
            valueLocalized: normalizeLocalizedTextForSave(item.valueLocalized, locales),
            mediaKind: item.mediaKind === 'image' || item.mediaKind === 'pdf' || item.mediaKind === 'billingDocument'
              ? item.mediaKind
              : null,
            mediaUrl: item.mediaKind === 'image' || item.mediaKind === 'pdf'
              ? (item.mediaUrl?.trim() ? item.mediaUrl.trim() : null)
              : null,
            mediaDocumentId: linkedDocument?.id ?? null,
            mediaDocumentName: linkedDocument?.name ?? null,
            mediaDocumentKind: linkedDocument?.kind ?? null
          }
        })
        .filter((item) =>
          Object.values(item.labelLocalized).some((entry) => entry)
          || Object.values(item.valueLocalized).some((entry) => entry)
          || Boolean(item.mediaUrl)
          || Boolean(item.mediaDocumentId)
        )
    }))
    .filter((section) =>
      Object.values(section.titleLocalized).some((entry) => entry)
      || section.items.length
    )
}

function toDateInputValue(value: string | null | undefined) {
  return value ? String(value).slice(0, 10) : ''
}

function normalizeDateValue(value: string | null | undefined) {
  return value?.trim() ? value.trim() : null
}

function normalizeNullableNumber(value: number | null | undefined) {
  if (value === '' as never) return null
  if (value == null || Number.isNaN(Number(value))) return null
  return Number(value)
}
</script>
