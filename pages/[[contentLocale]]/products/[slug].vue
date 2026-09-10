<template>
  <section class="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <NuxtLink :to="localePath(shopPagePath)" class="mb-6 inline-flex items-center gap-1 text-sm opacity-70 hover:opacity-100">
      <Icon name="mdi:arrow-left" size="16" />
      <span>{{ resolvedBackLabel }}</span>
    </NuxtLink>

    <div v-if="!product" class="py-16 text-center">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <article v-else class="space-y-8">
      <header class="space-y-4">
        <div class="flex flex-wrap items-center gap-2">
          <span v-if="product.category?.name" class="badge badge-soft">{{ product.category.name }}</span>
          <span class="badge badge-outline">{{ product.saleType === 'RENTAL' ? rentalLabel : saleLabel }}</span>
          <span v-if="product.allowOfflinePayment" class="badge badge-soft">{{ offlineLabel }}</span>
          <span v-if="product.allowOnlinePayment" class="badge badge-outline">{{ onlineLabel }}</span>
        </div>
        <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <h1 class="text-4xl font-bold">
              {{ getLocalizedProductName(product) }}
            </h1>
            <p v-if="getLocalizedProductExcerpt(product)" class="mt-3 text-lg opacity-75 wrap-break-word">
              {{ getLocalizedProductExcerpt(product) }}
            </p>
          </div>
          <div class="modula-card border border-base-300 bg-base-100 px-6 py-4 text-right shadow-sm">
            <div class="text-sm uppercase tracking-[0.16em] opacity-60">
              {{ priceLabel }}
            </div>
            <div v-for="rate in rentalRateLabels" :key="rate.unit" class="mt-1">
              <span class="text-3xl font-semibold text-primary">{{ $formatPrice(rate.price) }}</span>
              <span class="ml-1 text-sm opacity-65">/ {{ rate.unit }}</span>
            </div>
            <template v-if="product.saleType !== 'RENTAL'">
              <div class="mt-1 text-3xl font-semibold text-primary">
                {{ $formatPrice(product.price) }}
              </div>
              <div v-if="getLocalizedProductUnitLabel(product)" class="mt-1 text-sm opacity-65">
                {{ getLocalizedProductUnitLabel(product) }}
              </div>
            </template>
          </div>
        </div>
      </header>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div class="space-y-6">
          <div v-if="productGallerySlides.length" class="space-y-3">
            <button
              type="button"
              class="modula-card block w-full cursor-zoom-in overflow-hidden border border-base-300 bg-base-100 text-left shadow-sm"
              :aria-label="openGalleryLabel"
              @click="openProductGallery(0)"
            >
              <AppImage
                :src="productGallerySlides[0]!.imageUrl"
                :alt="getLocalizedProductName(product)"
                class="h-full max-h-[34rem] w-full object-cover"
                sizes="(max-width: 1280px) 100vw, 900px"
                loading="eager"
                fetchpriority="high"
              />
            </button>
            <div v-if="productGallerySlides.length > 1" class="flex gap-3 overflow-x-auto pb-1">
              <button
                v-for="(slide, slideIndex) in productGallerySlides"
                :key="slide.id"
                type="button"
                class="h-20 w-24 shrink-0 cursor-zoom-in overflow-hidden rounded-box border border-base-300 bg-base-100 sm:h-24 sm:w-32"
                :aria-label="`${openGalleryLabel} ${slideIndex + 1}`"
                @click="openProductGallery(slideIndex)"
              >
                <AppImage :src="slide.imageUrl" :alt="getLocalizedProductName(product)" class="h-full w-full object-cover" sizes="128px" />
              </button>
            </div>
          </div>

          <section class="modula-card border border-base-300 bg-base-100 p-6 shadow-sm">
            <h2 class="text-2xl font-semibold">{{ descriptionTitle }}</h2>
            <p v-if="getLocalizedProductDescription(product)" class="mt-4 whitespace-pre-line leading-7 opacity-85 wrap-break-word">
              {{ getLocalizedProductDescription(product) }}
            </p>
            <p v-else class="mt-4 opacity-65">{{ noDescriptionLabel }}</p>
          </section>

          <div class="grid gap-6 lg:grid-cols-2">
            <section class="modula-card border border-base-300 bg-base-100 p-6 shadow-sm">
              <h2 class="text-2xl font-semibold">{{ detailsTitle }}</h2>
              <dl class="mt-4 space-y-4 text-sm">
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-medium">{{ categoryLabel }}</dt>
                  <dd class="text-right opacity-75">
                    {{ product.category?.name || noneLabel }}
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-medium">{{ stockLabel }}</dt>
                  <dd class="text-right opacity-75">{{ product.stock }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-medium">{{ vatLabel }}</dt>
                  <dd class="text-right opacity-75">
                    {{ formatVatRate(product.vatRate) }}
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-medium">{{ typeLabel }}</dt>
                  <dd class="text-right opacity-75">
                    {{ product.saleType === 'RENTAL' ? rentalLabel : saleLabel }}
                  </dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-medium">{{ paymentLabel }}</dt>
                  <dd class="text-right opacity-75">
                    {{ paymentModesSummary }}
                  </dd>
                </div>
              </dl>
            </section>

            <section v-if="product.saleType === 'RENTAL'" class="modula-card border border-base-300 bg-base-100 p-6 shadow-sm">
              <h2 class="text-2xl font-semibold">
                {{ rentalConditionsTitle }}
              </h2>
              <dl class="mt-4 space-y-4 text-sm">
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-medium">{{ rentalAvailabilityLabel }}</dt>
                  <dd class="text-right opacity-75">
                    {{ rentalAvailabilitySummary }}
                  </dd>
                </div>
                <div v-if="product.rentalBookingMode !== 'MULTI_DAY'" class="flex items-start justify-between gap-4">
                  <dt class="font-medium">{{ hourlyDurationsLabel }}</dt>
                  <dd class="text-right opacity-75">
                    {{ hourlyDurationsSummary }}
                  </dd>
                </div>
                <div v-if="product.rentalBookingMode !== 'SINGLE_DAY'" class="flex items-start justify-between gap-4">
                  <dt class="font-medium">{{ dailyDurationLabel }}</dt>
                  <dd class="text-right opacity-75">{{ rentalMinSummary }} → {{ rentalMaxSummary }}</dd>
                </div>
                <div
                  v-if="product.rentalPricingStrategy === 'GRID' && hourlyRateGridSummary"
                  class="flex items-start justify-between gap-4 border-t border-base-300 pt-4"
                >
                  <dt class="font-medium">{{ hourlyRateGridLabel }}</dt>
                  <dd class="max-w-sm text-right text-xs leading-6 opacity-75">
                    {{ hourlyRateGridSummary }}
                  </dd>
                </div>
                <div
                  v-if="product.rentalPricingStrategy === 'GRID' && dailyRateGridSummary"
                  class="flex items-start justify-between gap-4 border-t border-base-300 pt-4"
                >
                  <dt class="font-medium">{{ dailyRateGridLabel }}</dt>
                  <dd class="max-w-sm text-right text-xs leading-6 opacity-75">
                    {{ dailyRateGridSummary }}
                  </dd>
                </div>
                <div v-if="rentalDepositAmount > 0" class="flex items-start justify-between gap-4 border-t border-base-300 pt-4">
                  <dt class="font-medium">{{ depositLabel }}</dt>
                  <dd class="text-right">
                    <span class="block font-medium">{{ $formatPrice(rentalDepositAmount) }}</span>
                    <span class="text-xs opacity-65">{{ depositPaymentModesSummary }}</span>
                  </dd>
                </div>
                <div v-if="product.rentalLateFeeEnabled" class="flex items-start justify-between gap-4 border-t border-base-300 pt-4">
                  <dt class="font-medium">{{ lateReturnFeeLabel }}</dt>
                  <dd class="max-w-xs text-right opacity-75">
                    {{ lateReturnFeeSummary }}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <section v-if="product.detailSections.length" class="space-y-4">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-2xl font-semibold">{{ moreDetailsTitle }}</h2>
            </div>
            <div class="grid gap-4 lg:grid-cols-2">
              <article v-for="section in product.detailSections" :key="section.id" class="modula-card border border-base-300 bg-base-100 p-6 shadow-sm">
                <h3 class="text-xl font-semibold">
                  {{ getLocalizedSectionTitle(section) }}
                </h3>
                <dl class="mt-4 divide-y divide-base-300">
                  <div v-for="item in section.items" :key="item.id" class="py-3 first:pt-0 last:pb-0">
                    <div v-if="!item.mediaUrl && !item.mediaDocumentId" class="grid gap-1 text-sm sm:grid-cols-[minmax(8rem,0.8fr)_minmax(0,1.2fr)] sm:gap-4">
                      <dt class="font-medium">
                        {{ getLocalizedDetailLabel(item) }}
                      </dt>
                      <dd class="whitespace-pre-line leading-6 opacity-75 sm:text-right">
                        {{ getLocalizedDetailValue(item) }}
                      </dd>
                    </div>
                    <div v-else>
                      <div class="mb-3">
                        <dt class="font-medium">
                          {{ getLocalizedDetailLabel(item) }}
                        </dt>
                        <dd v-if="getLocalizedDetailValue(item)" class="mt-1 whitespace-pre-line text-sm leading-6 opacity-75">
                          {{ getLocalizedDetailValue(item) }}
                        </dd>
                      </div>
                      <AppImage
                        v-if="item.mediaKind === 'image'"
                        :src="item.mediaUrl || ''"
                        :alt="getLocalizedDetailLabel(item)"
                        class="max-h-64 w-full rounded-box object-cover"
                        sizes="(min-width: 1024px) 38vw, 100vw"
                      />
                      <div
                        v-else
                        class="flex flex-col flex-wrap gap-3 border border-base-300 bg-base-100 p-3 sm:flex-row sm:items-center sm:justify-between rounded-box"
                      >
                        <div class="flex min-w-0 items-center gap-3">
                          <span class="grid size-10 shrink-0 place-items-center rounded-field bg-primary/10 text-primary">
                            <Icon :name="item.mediaKind === 'pdf' ? 'mdi:file-pdf-box' : 'mdi:file-document-outline'" size="22" />
                          </span>
                          <div class="min-w-0">
                            <div class="text-xs uppercase tracking-[0.12em] opacity-55">
                              {{ documentAvailableLabel }}
                            </div>
                            <div class="truncate text-sm font-medium">
                              {{ item.mediaDocumentName || getLocalizedDetailLabel(item) }}
                            </div>
                          </div>
                        </div>
                        <a
                          :href="
                            item.mediaKind === 'billingDocument' && item.mediaDocumentId
                              ? buildBillingDocumentPreviewUrl(item.mediaDocumentId)
                              : item.mediaUrl || '#'
                          "
                          target="_blank"
                          rel="noopener noreferrer"
                          class="btn btn-sm btn-outline shrink-0"
                        >
                          <Icon name="mdi:eye-outline" size="18" />
                          {{ item.mediaKind === 'pdf' ? openPdfLabel : openDocumentLabel }}
                        </a>
                      </div>
                    </div>
                  </div>
                </dl>
              </article>
            </div>
          </section>

          <section v-if="relatedProducts.length" class="modula-card border border-base-300 bg-base-100 p-6 shadow-sm">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-2xl font-semibold">{{ relatedTitle }}</h2>
              <NuxtLink :to="localePath(shopPagePath)" class="btn btn-sm btn-ghost">{{ resolvedBrowseLabel }}</NuxtLink>
            </div>
            <div class="mt-5 grid gap-4 md:grid-cols-3">
              <NuxtLink
                v-for="related in relatedProducts"
                :key="related.id"
                :to="localePath(`/products/${related.slug}`)"
                class="modula-card border border-base-300 bg-base-50 p-4 transition hover:border-primary/40 hover:shadow-sm"
              >
                <AppImage
                  v-if="related.imageUrl"
                  :src="related.imageUrl"
                  :alt="getLocalizedProductName(related)"
                  class="mb-3 h-36 w-full rounded-2xl object-cover"
                  sizes="(min-width: 768px) 20vw, 100vw"
                />
                <div class="text-sm opacity-65">
                  {{ related.category?.name || (related.saleType === 'RENTAL' ? rentalLabel : saleLabel) }}
                </div>
                <div class="mt-1 font-semibold">
                  {{ getLocalizedProductName(related) }}
                </div>
                <div class="mt-2 text-primary">
                  {{ $formatPrice(related.price) }}
                </div>
              </NuxtLink>
            </div>
          </section>
        </div>

        <aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section class="modula-card border border-base-300 bg-base-100 p-6 shadow-sm">
            <div class="text-sm uppercase tracking-[0.16em] opacity-60">
              {{ actionTitle }}
            </div>
            <div class="mt-2 text-3xl font-semibold text-primary">
              {{ $formatPrice(product.saleType === 'RENTAL' && selectedRentalStartDate ? selectedRentalPayablePrice : product.price) }}
            </div>
            <div v-if="product.saleType === 'RENTAL'" class="text-sm opacity-65">
              {{ rentalActionPriceUnit }}
            </div>
            <p class="mt-2 text-sm opacity-75">{{ actionIntro }}</p>

            <div class="mt-5 space-y-4">
              <div class="form-control flex flex-col gap-3">
                <label class="label"
                  ><span class="label-text">{{ quantityLabel }}</span></label
                >
                <div class="flex items-center gap-3">
                  <button class="btn btn-sm btn-ghost" :disabled="quantity <= 1" @click="quantity = Math.max(1, quantity - 1)">
                    <Icon name="mdi:minus" size="16" />
                  </button>
                  <span class="w-10 text-center font-medium">{{ quantity }}</span>
                  <button class="btn btn-sm btn-ghost" :disabled="quantity >= maxQuantity" @click="quantity = Math.min(maxQuantity, quantity + 1)">
                    <Icon name="mdi:plus" size="16" />
                  </button>
                </div>
              </div>

              <template v-if="product.saleType === 'RENTAL'">
                <button
                  class="btn w-full"
                  :class="selectedRentalStartDate && selectedRentalEndDate ? 'btn-outline' : 'btn-primary'"
                  :disabled="product.stock <= 0"
                  @click="rentalModalOpen = true"
                >
                  <Icon name="mdi:calendar-range" size="18" />
                  {{ selectedRentalStartDate && selectedRentalEndDate ? changeRentalPeriodLabel : chooseRentalPeriodLabel }}
                </button>
                <ShopRentalPeriodSummary
                  v-if="selectedRentalStartDate && selectedRentalEndDate"
                  compact
                  :start="selectedRentalStartDate"
                  :end="selectedRentalEndDate"
                  :locale="contentLocale"
                  :title="selectedPeriodTitle"
                  :duration="rentalDurationSummary"
                />
                <template v-if="selectedRentalStartDate && selectedRentalEndDate">
                <div v-if="rentalInsuranceOptions.length" class="space-y-3 rounded-box border border-base-300 p-4">
                  <div>
                    <div class="font-medium">{{ insuranceTitleLabel }}</div>
                    <div class="text-xs opacity-65">
                      {{ insuranceHelpLabel }}
                    </div>
                  </div>
                  <label v-for="insurance in rentalInsuranceOptions" :key="insurance.documentId" class="flex items-start gap-3">
                    <input
                      v-model="selectedInsuranceDocumentIds"
                      type="checkbox"
                      class="checkbox checkbox-sm mt-0.5"
                      :value="insurance.documentId"
                      :disabled="insurance.required"
                    />
                    <span class="min-w-0 flex-1 text-sm">
                      <span class="font-medium">{{ insurance.name }}</span>
                      <span class="ml-2 badge badge-sm" :class="insurance.required ? 'badge-primary' : 'badge-ghost'">
                        {{ insurance.required ? requiredLabel : optionalLabel }}
                      </span>
                      <span v-if="selectedRentalStartDate" class="block opacity-70">{{ $formatPrice(insurance.unitPrice) }}</span>
                      <span v-else class="block text-xs opacity-60">{{ selectPeriodForPriceLabel }}</span>
                    </span>
                    <a :href="insurance.previewUrl" target="_blank" rel="noopener noreferrer" class="link text-xs" @click.stop>
                      {{ viewDocumentLabel }}
                    </a>
                  </label>
                </div>
                <div v-for="group in publicOptionGroups" :key="group.id" class="space-y-3 rounded-box border border-base-300 p-4">
                  <div>
                    <div class="font-medium">
                      {{ localizedOptionGroupTitle(group) }}
                    </div>
                    <div v-if="localizedOptionGroupDescription(group)" class="text-xs opacity-65">
                      {{ localizedOptionGroupDescription(group) }}
                    </div>
                    <div v-if="group.required" class="mt-1 text-xs text-primary">
                      {{ requiredLabel }}
                    </div>
                  </div>
                  <label
                    v-if="group.selectionMode === 'SINGLE' && !group.required && group.minSelections === 0"
                    class="flex cursor-pointer items-center gap-3 border-t border-base-300 pt-3"
                  >
                    <input
                      type="radio"
                      :name="`option-group-${group.id}`"
                      class="radio radio-sm"
                      :checked="isProductOptionGroupEmpty(group)"
                      @change="clearProductOptionGroup(group)"
                    />
                    <span class="text-sm opacity-70">{{ noOptionLabel }}</span>
                  </label>
                  <div v-for="option in group.options" :key="option.id" class="border-t border-base-300 pt-3 first:border-0 first:pt-0">
                    <label class="flex cursor-pointer items-start gap-3">
                      <input
                        :type="group.selectionMode === 'SINGLE' ? 'radio' : 'checkbox'"
                        :name="`option-group-${group.id}`"
                        class="mt-0.5"
                        :class="group.selectionMode === 'SINGLE' ? 'radio radio-sm' : 'checkbox checkbox-sm'"
                        :checked="isProductOptionSelected(option.id)"
                        :disabled="!isProductOptionAvailable(option)"
                        @change="toggleProductOption(group, option)"
                      />
                      <span class="min-w-0 flex-1 text-sm">
                        <span class="font-medium">{{ localizedOptionLabel(option) }}</span>
                        <span v-if="localizedOptionDescription(option)" class="block opacity-65">{{ localizedOptionDescription(option) }}</span>
                        <span class="block text-primary">{{ productOptionPriceLabel(option) }}</span>
                      </span>
                      <a
                        v-if="option.billingDocumentId"
                        :href="buildBillingDocumentPreviewUrl(option.billingDocumentId)"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="link text-xs"
                        @click.stop
                        >{{ viewDocumentLabel }}</a
                      >
                    </label>
                    <div v-if="isProductOptionSelected(option.id) && option.quantityEditable" class="mt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        class="btn btn-square btn-xs"
                        :disabled="selectedProductOptionQuantity(option) <= option.minQuantity"
                        @click="changeProductOptionQuantity(option, -1)"
                      >
                        <Icon name="mdi:minus" size="14" />
                      </button>
                      <span class="min-w-8 text-center text-sm">{{ selectedProductOptionQuantity(option) }}</span>
                      <button
                        type="button"
                        class="btn btn-square btn-xs"
                        :disabled="option.maxQuantity != null && selectedProductOptionQuantity(option) >= option.maxQuantity"
                        @click="changeProductOptionQuantity(option, 1)"
                      >
                        <Icon name="mdi:plus" size="14" />
                      </button>
                    </div>
                    <div v-if="isProductOptionSelected(option.id) && usesFixedAccessoryDuration(option)" class="mt-3 rounded-box bg-base-200 p-3">
                      <label class="form-control flex flex-col gap-2">
                        <span class="label-text">{{ accessoryDurationLabel }}</span>
                        <select
                          v-model.number="selectedProductOptionDurations[option.id]"
                          class="select select-bordered select-sm w-full"
                          @change="onAccessoryDurationChange(option)"
                        >
                          <option :value="0" disabled>
                            {{ accessoryDurationPlaceholder }}
                          </option>
                          <option v-for="duration in option.rentalDurationMinutes" :key="duration" :value="duration">
                            {{ formatAccessoryDuration(duration) }}
                          </option>
                        </select>
                      </label>
                      <label class="form-control mt-3 flex flex-col gap-2">
                        <span class="label-text">{{ accessoryStartLabel }}</span>
                        <select
                          v-model="selectedProductOptionStarts[option.id]"
                          class="select select-bordered select-sm w-full"
                          :disabled="!selectedRentalStartDate || accessorySlotsPending[option.id]"
                        >
                          <option value="" disabled>
                            {{ accessorySlotsPending[option.id] ? accessorySlotsLoadingLabel : accessoryStartPlaceholder }}
                          </option>
                          <option v-for="slot in accessorySlots[option.id] || []" :key="slot.start" :value="slot.start">
                            {{ formatAccessorySlot(slot) }}
                          </option>
                        </select>
                      </label>
                      <ShopRentalPeriodSummary
                        v-if="selectedAccessorySlot(option.id)"
                        class="mt-3"
                        compact
                        :start="selectedAccessorySlot(option.id)?.start"
                        :end="selectedAccessorySlot(option.id)?.end"
                        :locale="contentLocale"
                        :title="accessorySlotLabel"
                        :duration="formatAccessoryDuration(selectedProductOptionDurations[option.id] || 0)"
                      />
                      <p v-else-if="!selectedRentalStartDate" class="mt-2 text-xs opacity-70">{{ selectPeriodForAccessoryLabel }}</p>
                    </div>
                  </div>
                  <p v-if="!isProductOptionGroupValid(group)" class="text-xs text-error">
                    {{ optionRequiredLabel }}
                  </p>
                </div>
                <dl v-if="selectedRentalStartDate" class="space-y-2 border-t border-base-300 pt-4 text-sm">
                  <div class="flex justify-between gap-4">
                    <dt>{{ rentalBasePriceLabel }}</dt>
                    <dd>{{ $formatPrice(selectedRentalPrice * quantity) }}</dd>
                  </div>
                  <div v-for="insurance in selectedRentalInsurances" :key="insurance.documentId" class="flex justify-between gap-4">
                    <dt>{{ insurance.name }}</dt>
                    <dd>{{ $formatPrice(insurance.unitPrice * quantity) }}</dd>
                  </div>
                  <div v-for="option in selectedProductOptions" :key="option.optionId" class="flex justify-between gap-4">
                    <dt>{{ option.label }} × {{ option.quantity }}</dt>
                    <dd>{{ $formatPrice(option.totalPrice) }}</dd>
                  </div>
                  <div class="flex justify-between gap-4 border-t border-base-300 pt-2">
                    <dt>{{ totalExclTaxLabel }}</dt>
                    <dd>{{ $formatPrice(selectedRentalTotalExclTax) }}</dd>
                  </div>
                  <div v-if="selectedRentalVatAmount > 0" class="flex justify-between gap-4 opacity-75">
                    <dt>{{ vatAmountLabel }} ({{ formatVatRate(product.vatRate) }})</dt>
                    <dd>{{ $formatPrice(selectedRentalVatAmount) }}</dd>
                  </div>
                  <div v-else class="flex justify-between gap-4 opacity-70">
                    <dt>{{ vatNotApplicableLabel }}</dt>
                    <dd>{{ $formatPrice(0) }}</dd>
                  </div>
                  <div class="flex justify-between gap-4 border-t border-base-300 pt-2 font-semibold">
                    <dt>{{ totalInclTaxLabel }}</dt>
                    <dd>{{ $formatPrice(selectedRentalTotalInclTax) }}</dd>
                  </div>
                </dl>
                <div v-if="rentalDepositAmount > 0" class="rounded-box border border-info/30 bg-info/5 p-4 text-sm">
                  <div class="flex justify-between gap-4 font-medium">
                    <span>{{ depositLabel }}</span
                    ><span>{{ $formatPrice(rentalDepositAmount * quantity) }}</span>
                  </div>
                  <div class="mt-1 text-xs opacity-70">{{ depositPaymentLabel }} : {{ depositPaymentModesSummary }}</div>
                </div>
                <button class="btn btn-primary w-full" :disabled="!canAddRentalToCart" @click="addRentalToCart">
                  {{ isEditingCartItem ? updateCartLabel : addRentalLabel }}
                </button>
                </template>
              </template>

              <template v-else>
                <div v-for="group in publicOptionGroups" :key="group.id" class="space-y-3 rounded-box border border-base-300 p-4">
                  <div class="font-medium">
                    {{ localizedOptionGroupTitle(group) }}
                  </div>
                  <label
                    v-if="group.selectionMode === 'SINGLE' && !group.required && group.minSelections === 0"
                    class="flex cursor-pointer items-center gap-3 border-t border-base-300 pt-3"
                  >
                    <input
                      type="radio"
                      :name="`option-group-${group.id}`"
                      class="radio radio-sm"
                      :checked="isProductOptionGroupEmpty(group)"
                      @change="clearProductOptionGroup(group)"
                    />
                    <span class="text-sm opacity-70">{{ noOptionLabel }}</span>
                  </label>
                  <div v-for="option in group.options" :key="option.id" class="border-t border-base-300 pt-3 first:border-0 first:pt-0">
                    <label class="flex cursor-pointer items-start gap-3">
                      <input
                        :type="group.selectionMode === 'SINGLE' ? 'radio' : 'checkbox'"
                        :name="`option-group-${group.id}`"
                        class="mt-0.5"
                        :class="group.selectionMode === 'SINGLE' ? 'radio radio-sm' : 'checkbox checkbox-sm'"
                        :checked="isProductOptionSelected(option.id)"
                        :disabled="!isProductOptionAvailable(option)"
                        @change="toggleProductOption(group, option)"
                      />
                      <span class="min-w-0 flex-1 text-sm">
                        <span class="font-medium">{{ localizedOptionLabel(option) }}</span>
                        <span class="block text-primary">{{ productOptionPriceLabel(option) }}</span>
                      </span>
                    </label>
                    <div v-if="isProductOptionSelected(option.id) && option.quantityEditable" class="mt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        class="btn btn-square btn-xs"
                        :disabled="selectedProductOptionQuantity(option) <= option.minQuantity"
                        @click="changeProductOptionQuantity(option, -1)"
                      >
                        <Icon name="mdi:minus" size="14" />
                      </button>
                      <span class="min-w-8 text-center text-sm">{{ selectedProductOptionQuantity(option) }}</span>
                      <button
                        type="button"
                        class="btn btn-square btn-xs"
                        :disabled="option.maxQuantity != null && selectedProductOptionQuantity(option) >= option.maxQuantity"
                        @click="changeProductOptionQuantity(option, 1)"
                      >
                        <Icon name="mdi:plus" size="14" />
                      </button>
                    </div>
                  </div>
                  <p v-if="!isProductOptionGroupValid(group)" class="text-xs text-error">
                    {{ optionRequiredLabel }}
                  </p>
                </div>
                <button
                  class="btn btn-primary w-full"
                  :disabled="product.stock <= 0 || !publicOptionGroups.every(isProductOptionGroupValid)"
                  @click="addSaleToCart"
                >
                  {{ product.stock > 0 ? (isEditingCartItem ? updateCartLabel : addToCartLabel) : soldOutLabel }}
                </button>
              </template>

              <button class="btn btn-ghost w-full" @click="navigateTo(localePath('/panier'))">
                {{ cartLabel }}
              </button>
            </div>
          </section>
        </aside>
      </section>
    </article>

    <RentalAvailabilityModal
      v-if="product?.saleType === 'RENTAL'"
      :open="rentalModalOpen"
      source-kind="product"
      :source-id="product?.id ?? null"
      :source-name="product ? getLocalizedProductName(product) : ''"
      :initial-start-date="selectedRentalStartDate"
      :initial-end-date="selectedRentalEndDate"
      :initial-pricing-mode="selectedPricingMode"
      @close="rentalModalOpen = false"
      @confirm="onRentalDatesSelected"
    />
    <PageMediaLightbox
      :open="productGalleryOpen"
      :slides="productGallerySlides"
      :locale="contentLocale"
      :current-index="productGalleryIndex"
      @close="productGalleryOpen = false"
      @update:current-index="productGalleryIndex = $event"
    />
  </section>
</template>

<script setup lang="ts">
import { pickCmsLocalizedText } from '#modula/shared/cms'
import type { ProductDetailField, ProductDetailSection, ProductPayload } from '#modula/server/utils/shop'
import { resolveRentalRatePrice } from '#modula/shared/rentalRates'
import type { ProductOption, ProductOptionGroup } from '#modula/shared/productOptions'
import { getProductOptionCalculatedUnitPrice, getProductOptionChargedQuantity } from '#modula/shared/productOptions'
import { useShopCart, type ShopCartItem } from '#modula/composables/useShopCart'
import RentalAvailabilityModal from '#modula/components/shop/RentalAvailabilityModal.vue'
import PageMediaLightbox from '#modula/components/page-builder/PageMediaLightbox.vue'

definePageMeta({
  layout: 'default',
  i18n: false,
})

const route = useRoute()
const localePath = usePublicLocalePath()
const { contentLocale } = useContentLocale()
const { publicText } = usePublicDictionary()
const initialSiteConfig = await ensureSiteConfigState({
  path: route.path,
  locale: contentLocale.value,
})
const siteConfig = useSiteConfigState()
const locale = computed(() => contentLocale.value)
const { $toast, $formatPrice, $formatDate } = useNuxtApp() as any
const { items: cartItems, hydrate: hydrateCart, add, replace } = useShopCart()
const slug = computed(() => String(route.params.slug || ''))
const editingCartItemKey = computed(() => (typeof route.query.editCartItem === 'string' ? route.query.editCartItem : ''))
const editingCartItem = computed(() => cartItems.value.find((item) => item.key === editingCartItemKey.value) || null)
const isEditingCartItem = computed(() => Boolean(editingCartItem.value && editingCartItem.value.productId === product.value?.id))
const productGalleryOpen = ref(false)
const productGalleryIndex = ref(0)

const { data } = await useFetch<{
  product: ProductPayload
  relatedProducts: ProductPayload[]
}>(() => `/api/shop/products/${slug.value}`, {
  onResponseError: () => {
    throw createError({
      statusCode: 404,
      statusMessage: publicText('shop.product.notFound', 'Produit introuvable'),
    })
  },
})

const productGallerySlides = computed(() => {
  if (!data.value?.product) return []
  const urls = Array.from(new Set([data.value.product.imageUrl, ...(data.value.product.gallery || [])].filter((url): url is string => Boolean(url?.trim()))))
  return urls.map((imageUrl, index) => ({
    id: `product-${data.value!.product.id}-image-${index}`,
    imageUrl,
    alt: { [contentLocale.value]: getLocalizedProductName(data.value!.product) },
    fit: 'contain' as const,
    verticalAlign: 'center' as const,
  }))
})

const product = computed(() => data.value?.product || null)
const shopPagePath = computed(() => siteConfig.value?.shopPagePath || initialSiteConfig?.shopPagePath || '/boutique')
const relatedProducts = computed(() => data.value?.relatedProducts || [])
const quantity = ref(1)
const rentalModalOpen = ref(false)
const selectedRentalStartDate = ref('')
const selectedRentalEndDate = ref('')
const selectedRentalAvailableQuantity = ref(0)
const selectedPricingMode = ref<'HOURLY' | 'DAILY'>('DAILY')
const selectedInsuranceDocumentIds = ref<number[]>([])
const selectedProductOptionQuantities = reactive<Record<string, number>>({})
const selectedProductOptionDurations = reactive<Record<string, number>>({})
const selectedProductOptionStarts = reactive<Record<string, string>>({})
const accessorySlots = reactive<Record<string, Array<{ start: string; end: string; remaining: number }>>>({})
const accessorySlotsPending = reactive<Record<string, boolean>>({})
const customReturnToListingLabel = computed(() =>
  pickCmsLocalizedText(
    contentLocale.value,
    siteConfig.value?.cms?.settings?.basketsPage?.returnToListingLabel || initialSiteConfig?.cms?.settings?.basketsPage?.returnToListingLabel,
  ),
)

const backLabel = computed(() => publicText('shop.product.backToShop', 'Retour à la boutique'))
const saleLabel = computed(() => publicText('shop.product.sale', 'Vente'))
const rentalLabel = computed(() => publicText('shop.product.rental', 'Location'))
const offlineLabel = computed(() => publicText('shop.product.onsitePayment', 'Paiement sur place'))
const onlineLabel = computed(() => publicText('shop.product.onlinePayment', 'Paiement en ligne'))
const priceLabel = computed(() => publicText('shop.product.price', 'Prix'))
const fromPriceLabel = computed(() => publicText('shop.product.fromPrice', 'À partir de'))
const descriptionTitle = computed(() => publicText('shop.product.descriptionTitle', 'Description'))
const noDescriptionLabel = computed(() => publicText('shop.product.noDescription', 'Aucune description détaillée n’est encore renseignée.'))
const detailsTitle = computed(() => publicText('shop.product.detailsTitle', 'Détails du produit'))
const categoryLabel = computed(() => publicText('shop.product.category', 'Catégorie'))
const stockLabel = computed(() => publicText('shop.product.availableStock', 'Stock disponible'))
const vatLabel = computed(() => publicText('shop.product.vat', 'TVA'))
const vatNotApplicableLabel = computed(() => publicText('shop.product.vatNotApplicable', 'TVA non applicable'))
const typeLabel = computed(() => publicText('shop.product.offerType', 'Type d’offre'))
const paymentLabel = computed(() => publicText('shop.product.payment', 'Paiement'))
const depositLabel = computed(() => publicText('shop.product.securityDeposit', 'Dépôt de garantie'))
const depositPaymentLabel = computed(() => publicText('shop.product.securityDepositPayment', 'Versement du dépôt de garantie'))
const lateReturnFeeLabel = computed(() => publicText('shop.product.lateReturnFee', 'Frais de retour tardif'))
const noneLabel = computed(() => publicText('shop.product.none', 'Aucun'))
const moreDetailsTitle = computed(() => publicText('shop.product.moreDetails', 'Informations détaillées'))
const openPdfLabel = computed(() => publicText('shop.product.openPdf', 'Ouvrir le PDF'))
const openDocumentLabel = computed(() => publicText('shop.product.openDocument', 'Ouvrir le document'))
const documentAvailableLabel = computed(() => publicText('shop.product.documentAvailable', 'Document disponible'))
const rentalConditionsTitle = computed(() => publicText('shop.product.rentalConditions', 'Conditions de location'))
const rentalAvailabilityLabel = computed(() => publicText('shop.product.availability', 'Disponibilité'))
const rentalMinLabel = computed(() => publicText('shop.product.minimumDuration', 'Durée minimale'))
const rentalMaxLabel = computed(() => publicText('shop.product.maximumDuration', 'Durée maximale'))
const hourlyDurationsLabel = computed(() => publicText('shop.product.hourlyDurations', 'Durées à l’heure'))
const dailyDurationLabel = computed(() => publicText('shop.product.dailyDurationRange', 'Durée à la journée'))
const hourlyRateGridLabel = computed(() => publicText('shop.product.hourlyRateGrid', 'Tarifs à l’heure'))
const dailyRateGridLabel = computed(() => publicText('shop.product.dailyRateGrid', 'Tarifs à la journée'))
const hourlyRateGridSummary = computed(() =>
  (product.value?.rentalRates || [])
    .filter((rate) => rate.pricingMode === 'HOURLY')
    .map((rate) => `${rate.duration / 60} h : ${$formatPrice(rate.price)}`)
    .join(' · '),
)
const dailyRateGridSummary = computed(() =>
  (product.value?.rentalRates || [])
    .filter((rate) => rate.pricingMode === 'DAILY')
    .map((rate) => `${rate.duration} j : ${$formatPrice(rate.price)}`)
    .join(' · '),
)
const relatedTitle = computed(() => publicText('shop.product.relatedTitle', 'Autres produits liés'))
const browseLabel = computed(() => publicText('shop.product.browseShop', 'Voir la boutique'))
const resolvedBackLabel = computed(() => customReturnToListingLabel.value || backLabel.value)
const resolvedBrowseLabel = computed(() => customReturnToListingLabel.value || browseLabel.value)
const actionTitle = computed(() => publicText('shop.product.orderTitle', 'Commander'))
const actionIntro = computed(() => {
  if (!product.value) return ''
  return product.value.saleType === 'RENTAL'
    ? publicText('shop.product.actionIntroRental', 'Choisissez une période de location puis ajoutez ce produit au panier.')
    : publicText('shop.product.actionIntroSale', 'Ajustez la quantité puis ajoutez ce produit au panier.')
})
const quantityLabel = computed(() =>
  product.value?.saleType === 'RENTAL' ? publicText('shop.product.rentalQuantity', 'Nombre d’unités à louer') : publicText('shop.product.quantity', 'Quantité'),
)
const selectedPeriodTitle = computed(() => publicText('shop.product.selectedRentalPeriod', 'Période de location choisie'))
const chooseRentalPeriodLabel = computed(() => publicText('shop.product.chooseRentalPeriod', 'Choisir la période'))
const changeRentalPeriodLabel = computed(() => publicText('shop.product.changeRentalPeriod', 'Modifier la période'))
const addRentalLabel = computed(() => publicText('shop.product.addRental', 'Ajouter la location au panier'))
const addToCartLabel = computed(() => publicText('shop.product.addToCart', 'Ajouter au panier'))
const updateCartLabel = computed(() => publicText('shop.product.updateCart', 'Mettre à jour le panier'))
const updateCartSuccessLabel = computed(() => publicText('shop.product.updateCartSuccess', 'Panier mis à jour'))
const soldOutLabel = computed(() => publicText('shop.product.soldOut', 'Épuisé'))
const cartLabel = computed(() => publicText('shop.product.viewCart', 'Voir le panier'))
const openGalleryLabel = computed(() => publicText('shop.product.openGallery', 'Ouvrir la galerie'))
const hourUnitLabel = computed(() => publicText('shop.rentalModal.hourUnit', 'heure'))
const dayUnitLabel = computed(() => publicText('shop.rentalModal.dayUnit', 'jour'))
const insuranceTitleLabel = computed(() => publicText('shop.product.insuranceTitle', 'Assurances'))
const insuranceHelpLabel = computed(() =>
  publicText('shop.product.insuranceHelp', 'Les assurances obligatoires sont incluses. Vous pouvez ajouter les assurances facultatives.'),
)
const requiredLabel = computed(() => publicText('shop.product.required', 'Obligatoire'))
const optionalLabel = computed(() => publicText('shop.product.optional', 'Facultative'))
const viewDocumentLabel = computed(() => publicText('shop.product.viewDocument', 'Voir'))
const rentalBasePriceLabel = computed(() => publicText('shop.product.rentalBasePrice', 'Location'))
const totalExclTaxLabel = computed(() => publicText('shop.product.totalExclTax', 'Total HT'))
const vatAmountLabel = computed(() => publicText('shop.product.vatAmount', 'Montant de la TVA'))
const totalInclTaxLabel = computed(() => publicText('shop.product.totalInclTax', 'Total TTC'))
const optionRequiredLabel = computed(() => publicText('shop.product.optionRequired', 'Sélectionnez une option pour continuer.'))
const selectPeriodForPriceLabel = computed(() => publicText('shop.product.selectPeriodForPrice', 'Choisissez une période pour calculer le prix.'))
const noOptionLabel = computed(() => publicText('shop.product.noOption', 'Aucun choix'))
const accessoryDurationLabel = computed(() => publicText('shop.product.accessoryDuration', 'Durée de location de l’accessoire'))
const accessoryDurationPlaceholder = computed(() => publicText('shop.product.accessoryDurationPlaceholder', 'Choisir une durée'))
const accessoryStartLabel = computed(() => publicText('shop.product.accessoryStart', 'Heure de retrait de l’accessoire'))
const accessoryStartPlaceholder = computed(() => publicText('shop.product.accessoryStartPlaceholder', 'Choisir un créneau'))
const accessorySlotsLoadingLabel = computed(() => publicText('shop.product.accessorySlotsLoading', 'Chargement des créneaux…'))
const selectPeriodForAccessoryLabel = computed(() => publicText('shop.product.selectPeriodForAccessory', 'Choisissez d’abord la période du produit principal.'))
const accessorySlotLabel = computed(() => publicText('shop.product.accessorySlot', 'Créneau de l’accessoire'))
const rentalPickupShortLabel = computed(() => publicText('shop.rentalPeriod.pickup', 'Retrait'))
const rentalReturnShortLabel = computed(() => publicText('shop.rentalPeriod.return', 'Retour'))
const rentalRateLabels = computed(() => {
  if (!product.value || product.value.saleType !== 'RENTAL') return []
  const rates: Array<{ price: number; unit: string }> = []
  if (product.value.rentalPricingStrategy === 'GRID') {
    const hourly = product.value.rentalRates.find((rate) => rate.pricingMode === 'HOURLY')
    const daily = product.value.rentalRates.find((rate) => rate.pricingMode === 'DAILY')
    if (hourly)
      rates.push({
        price: hourly.price,
        unit: `${hourly.duration / 60} ${hourUnitLabel.value}`,
      })
    if (daily)
      rates.push({
        price: daily.price,
        unit: `${daily.duration} ${dayUnitLabel.value}(s)`,
      })
    return rates
  }
  if (product.value.rentalBookingMode !== 'MULTI_DAY')
    rates.push({
      price: Number(product.value.rentalHourlyPrice ?? product.value.price),
      unit: hourUnitLabel.value,
    })
  if (product.value.rentalBookingMode !== 'SINGLE_DAY')
    rates.push({
      price: Number(product.value.rentalDailyPrice ?? product.value.price),
      unit: dayUnitLabel.value,
    })
  return rates
})
const selectedRentalPrice = computed(() => {
  if (!product.value || !selectedRentalStartDate.value || !selectedRentalEndDate.value) return product.value?.price || 0
  const milliseconds = new Date(selectedRentalEndDate.value).getTime() - new Date(selectedRentalStartDate.value).getTime()
  if (selectedPricingMode.value === 'HOURLY') {
    const exactRate =
      product.value.rentalPricingStrategy === 'GRID' ? resolveRentalRatePrice(product.value.rentalRates, 'HOURLY', Math.max(0, milliseconds / 3600000)) : null
    if (exactRate != null) return exactRate
    return Number(product.value.rentalHourlyPrice ?? product.value.price) * Math.max(0, milliseconds / 3600000)
  }
  const days = Math.floor(milliseconds / 86400000) + 1
  const exactRate = product.value.rentalPricingStrategy === 'GRID' ? resolveRentalRatePrice(product.value.rentalRates, 'DAILY', Math.max(1, days)) : null
  if (exactRate != null) return exactRate
  return Number(product.value.rentalDailyPrice ?? product.value.price) * Math.max(1, days)
})
const rentalActionPriceUnit = computed(() =>
  selectedRentalStartDate.value ? (selectedPricingMode.value === 'HOURLY' ? hourUnitLabel.value : dayUnitLabel.value) : fromPriceLabel.value,
)
const rentalDurationUnits = computed(() => {
  if (!selectedRentalStartDate.value || !selectedRentalEndDate.value) return 0
  const milliseconds = new Date(selectedRentalEndDate.value).getTime() - new Date(selectedRentalStartDate.value).getTime()
  return selectedPricingMode.value === 'HOURLY' ? Math.max(0, milliseconds / 3600000) : Math.max(1, Math.floor(milliseconds / 86400000) + 1)
})
const rentalDurationSummary = computed(() =>
  publicText(
    selectedPricingMode.value === 'HOURLY' ? 'shop.product.rentalHourCount' : 'shop.product.rentalDayCount',
    selectedPricingMode.value === 'HOURLY' ? '{count} heure(s)' : '{count} jour(s)',
    { count: rentalDurationUnits.value },
  ),
)
const rentalInsuranceOptions = computed(() => {
  if (!product.value || product.value.saleType !== 'RENTAL') return []
  const unique = new Map<
    number,
    {
      documentId: number
      name: string
      required: boolean
      unitPrice: number
      previewUrl: string
    }
  >()
  for (const item of product.value.detailSections.flatMap((section) => section.items)) {
    const documentId = Number(item.mediaDocumentId || 0)
    if (item.mediaKind !== 'billingDocument' || item.mediaDocumentKind !== 'ASSURANCE' || !documentId || unique.has(documentId)) continue
    const rate = selectedPricingMode.value === 'HOURLY' ? item.mediaDocumentRentalHourlyPrice : item.mediaDocumentRentalDailyPrice
    unique.set(documentId, {
      documentId,
      name: item.mediaDocumentName || getLocalizedDetailLabel(item) || insuranceTitleLabel.value,
      required: item.mediaDocumentRequiredForRental,
      unitPrice: Math.round(Number(rate || 0) * rentalDurationUnits.value * 100) / 100,
      previewUrl: buildBillingDocumentPreviewUrl(documentId),
    })
  }
  return Array.from(unique.values())
})
const selectedRentalInsurances = computed(() =>
  rentalInsuranceOptions.value.filter((insurance) => insurance.required || selectedInsuranceDocumentIds.value.includes(insurance.documentId)),
)
const publicOptionGroups = computed(() =>
  (product.value?.optionGroups || [])
    .map((group) => ({
      ...group,
      options: group.options.filter((option) => option.active),
    }))
    .filter((group) => group.options.length > 0),
)
const selectedProductOptions = computed(() =>
  publicOptionGroups.value
    .flatMap((group) => group.options)
    .filter((option) => isProductOptionSelected(option.id))
    .map((option) => {
      const selectedQuantity = selectedProductOptionQuantity(option)
      const chargedQuantity = getProductOptionChargedQuantity(option.quantityMode, quantity.value, selectedQuantity)
      const unitPrice = getProductOptionCalculatedUnitPrice(
        option,
        rentalDurationUnits.value,
        selectedRentalStartDate.value ? selectedPricingMode.value : null,
        selectedProductOptionDurations[option.id] || null,
      )
      return {
        optionId: option.id,
        label: localizedOptionLabel(option),
        kind: option.kind,
        quantityMode: option.quantityMode,
        selectedQuantity,
        quantity: chargedQuantity,
        unitPrice: roundCurrency(unitPrice),
        totalPrice: roundCurrency(unitPrice * chargedQuantity),
        billingDocumentId: option.billingDocumentId,
        linkedProductId: option.linkedProductId,
        rentalDurationMinutes: selectedProductOptionDurations[option.id] || null,
        rentalStartDate: selectedProductOptionStarts[option.id] || null,
        rentalEndDate: selectedAccessorySlot(option.id)?.end || null,
      }
    }),
)
const selectedProductOptionsTotal = computed(() => roundCurrency(selectedProductOptions.value.reduce((sum, option) => sum + option.totalPrice, 0)))
const selectedRentalPayablePrice = computed(
  () => selectedRentalPrice.value + selectedRentalInsurances.value.reduce((sum, insurance) => sum + insurance.unitPrice, 0),
)
const selectedRentalTotalInclTax = computed(() => roundCurrency(selectedRentalPayablePrice.value * quantity.value + selectedProductOptionsTotal.value))
const selectedRentalTotalExclTax = computed(() => {
  const rate = Math.max(0, Number(product.value?.vatRate || 0))
  return rate > 0 ? roundCurrency(selectedRentalTotalInclTax.value / (1 + rate / 100)) : selectedRentalTotalInclTax.value
})
const selectedRentalVatAmount = computed(() => roundCurrency(selectedRentalTotalInclTax.value - selectedRentalTotalExclTax.value))
const associatedDocuments = computed(() => {
  if (!product.value) return []
  const unique = new Map<
    string,
    {
      key: string
      name: string
      kind: 'pdf' | 'billingDocument'
      url: string
      documentId?: number | null
    }
  >()
  for (const item of product.value.detailSections.flatMap((section) => section.items)) {
    if (item.mediaKind === 'pdf' && item.mediaUrl) {
      const key = `pdf:${item.mediaUrl}`
      unique.set(key, {
        key,
        name: getLocalizedDetailLabel(item) || openPdfLabel.value,
        kind: 'pdf',
        url: item.mediaUrl,
      })
    } else if (item.mediaKind === 'billingDocument' && item.mediaDocumentId) {
      const key = `document:${item.mediaDocumentId}`
      unique.set(key, {
        key,
        name: item.mediaDocumentName || getLocalizedDetailLabel(item) || openDocumentLabel.value,
        kind: 'billingDocument',
        url: buildBillingDocumentPreviewUrl(item.mediaDocumentId),
        documentId: item.mediaDocumentId,
      })
    }
  }
  return Array.from(unique.values())
})

function getLocalizedProductName(entry: ProductPayload | null | undefined) {
  if (!entry) return ''
  return pickCmsLocalizedText(contentLocale.value, entry.nameLocalized) || entry.name || ''
}

function getLocalizedProductExcerpt(entry: ProductPayload | null | undefined) {
  if (!entry) return ''
  return pickCmsLocalizedText(contentLocale.value, entry.excerptLocalized) || entry.excerpt || ''
}

function getLocalizedProductDescription(entry: ProductPayload | null | undefined) {
  if (!entry) return ''
  return pickCmsLocalizedText(contentLocale.value, entry.descriptionLocalized) || entry.description || ''
}

function getLocalizedProductUnitLabel(entry: ProductPayload | null | undefined) {
  if (!entry) return ''
  return pickCmsLocalizedText(contentLocale.value, entry.unitLabelLocalized) || entry.unitLabel || ''
}

function getLocalizedSectionTitle(section: ProductDetailSection | null | undefined) {
  if (!section) return ''
  return pickCmsLocalizedText(contentLocale.value, section.titleLocalized) || section.title || ''
}

function getLocalizedDetailLabel(item: ProductDetailField | null | undefined) {
  if (!item) return ''
  return pickCmsLocalizedText(contentLocale.value, item.labelLocalized) || item.label || ''
}

function getLocalizedDetailValue(item: ProductDetailField | null | undefined) {
  if (!item) return ''
  return pickCmsLocalizedText(contentLocale.value, item.valueLocalized) || item.value || ''
}

function buildBillingDocumentPreviewUrl(documentId: number) {
  const localeQuery = encodeURIComponent(contentLocale.value || 'fr')
  const productId = encodeURIComponent(String(product.value?.id || ''))
  return `/api/shop/billing-documents/${documentId}/preview?productId=${productId}&locale=${localeQuery}`
}

const maxQuantity = computed(() => {
  if (!product.value) return 1
  if (product.value.saleType === 'RENTAL' && selectedRentalStartDate.value) {
    return Math.max(1, selectedRentalAvailableQuantity.value)
  }
  return Math.max(1, Number(product.value.stock || 1))
})

const paymentModesSummary = computed(() => {
  if (!product.value) return ''
  if (product.value.allowOfflinePayment && product.value.allowOnlinePayment) {
    return publicText('shop.product.paymentOfflineOrOnline', 'Sur place ou en ligne')
  }
  if (product.value.allowOnlinePayment) return onlineLabel.value
  if (product.value.allowOfflinePayment) return offlineLabel.value
  return noneLabel.value
})
const rentalDepositAmount = computed(() => Math.max(0, Number(product.value?.rentalDepositAmount || 0)))
const depositPaymentModesSummary = computed(() => {
  if (!product.value) return ''
  if (product.value.rentalDepositAllowOnsitePayment && product.value.rentalDepositAllowOnlinePayment) {
    return publicText('shop.product.depositOnsiteOrOnline', 'Sur place ou en ligne')
  }
  if (product.value.rentalDepositAllowOnlinePayment) return publicText('shop.product.depositOnline', 'En ligne')
  return publicText('shop.product.depositOnsite', 'Sur place')
})
const lateReturnFeeSummary = computed(() => {
  if (!product.value?.rentalLateFeeEnabled) return ''
  const mode = product.value.rentalLateFeeMode
  const amount = Number(product.value.rentalLateFeeAmount || 0)
  const multiplier = Number(product.value.rentalLateFeeMultiplier || 0)
  const grace = Number(product.value.rentalLateFeeGraceMinutes || 0)
  const rule =
    mode === 'FIXED'
      ? publicText('shop.product.lateReturnFeeFixed', '{amount} par retard', {
          amount: $formatPrice(amount),
        })
      : mode === 'PER_HOUR_STARTED'
        ? publicText('shop.product.lateReturnFeePerHour', '{amount} par heure commencée', { amount: $formatPrice(amount) })
        : mode === 'PER_DAY_STARTED'
          ? publicText('shop.product.lateReturnFeePerDay', '{amount} par jour commencé', { amount: $formatPrice(amount) })
          : mode === 'HOURLY_MULTIPLIER'
            ? publicText('shop.product.lateReturnFeeHourlyMultiplier', '{multiplier} × le tarif horaire par heure commencée', { multiplier })
            : publicText('shop.product.lateReturnFeeDailyMultiplier', '{multiplier} × le tarif journalier par jour commencé', { multiplier })
  return grace > 0 ? publicText('shop.product.lateReturnFeeWithGrace', '{rule}, après {minutes} min de tolérance', { rule, minutes: grace }) : rule
})

const rentalAvailabilitySummary = computed(() => {
  if (!product.value) return ''
  const parts: string[] = []
  if (product.value.rentalAvailableFrom) parts.push($formatDate(product.value.rentalAvailableFrom))
  if (product.value.rentalAvailableTo) parts.push($formatDate(product.value.rentalAvailableTo))
  if (!parts.length) {
    return publicText('shop.product.noDateRestriction', 'Pas de restriction de dates')
  }
  return parts.join(' → ')
})

const rentalMinSummary = computed(() => {
  const value = Number(product.value?.rentalMinDays || 1)
  return publicText('shop.product.dayCount', '{count} jour(s)', {
    count: value,
  })
})

const rentalMaxSummary = computed(() => {
  const value = product.value?.rentalMaxDays
  if (value == null) return publicText('shop.product.noMaximum', 'Aucun maximum')
  return publicText('shop.product.dayCount', '{count} jour(s)', {
    count: value,
  })
})

const canAddRentalToCart = computed(() => {
  const currentProduct = product.value
  return (
    Boolean(currentProduct) &&
    (currentProduct?.stock ?? 0) > 0 &&
    selectedRentalStartDate.value.trim().length > 0 &&
    selectedRentalEndDate.value.trim().length > 0 &&
    publicOptionGroups.value.every(isProductOptionGroupValid)
  )
})

const hourlyDurationsSummary = computed(() => {
  const values = product.value?.rentalDurations || []
  return values
    .map((minutes) => {
      const hours = minutes / 60
      return publicText('shop.product.rentalHourCount', '{count} heure(s)', {
        count: hours,
      })
    })
    .join(', ')
})

watch(
  product,
  (value) => {
    quantity.value = 1
    selectedRentalStartDate.value = ''
    selectedRentalEndDate.value = ''
    selectedRentalAvailableQuantity.value = 0
    selectedPricingMode.value = value?.rentalBookingMode === 'SINGLE_DAY' ? 'HOURLY' : 'DAILY'
    selectedInsuranceDocumentIds.value = value
      ? value.detailSections
          .flatMap((section) => section.items)
          .filter((item) => item.mediaDocumentKind === 'ASSURANCE' && item.mediaDocumentRequiredForRental && item.mediaDocumentId)
          .map((item) => Number(item.mediaDocumentId))
      : []
    for (const key of Object.keys(selectedProductOptionQuantities)) delete selectedProductOptionQuantities[key]
  },
  { immediate: true },
)

onMounted(() => {
  hydrateCart()
  restoreCartItemSelection()
})

watch(editingCartItemKey, () => {
  if (import.meta.client) restoreCartItemSelection()
})

usePageSeo({
  title: computed(() => getLocalizedProductName(product.value) || publicText('shop.product.seoFallbackTitle', 'Produit')),
  description: computed(() => getLocalizedProductExcerpt(product.value) || getLocalizedProductDescription(product.value) || ''),
})

function formatVatRate(value: number) {
  const normalized = Number(value || 0)
  if (normalized <= 0) return vatNotApplicableLabel.value
  return `${normalized.toFixed(2)}%`
}

function roundCurrency(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function localizedOptionGroupTitle(group: ProductOptionGroup) {
  return pickCmsLocalizedText(contentLocale.value, group.titleLocalized) || group.title
}

function localizedOptionGroupDescription(group: ProductOptionGroup) {
  return pickCmsLocalizedText(contentLocale.value, group.descriptionLocalized) || group.description
}

function localizedOptionLabel(option: ProductOption) {
  return pickCmsLocalizedText(contentLocale.value, option.labelLocalized) || option.label
}

function localizedOptionDescription(option: ProductOption) {
  return pickCmsLocalizedText(contentLocale.value, option.descriptionLocalized) || option.description
}

function isProductOptionSelected(optionId: string) {
  return Number(selectedProductOptionQuantities[optionId] || 0) > 0
}

function selectedProductOptionQuantity(option: ProductOption) {
  return Math.max(0, Number(selectedProductOptionQuantities[option.id] || 0))
}

function isProductOptionAvailable(option: ProductOption) {
  return !option.linkedProduct || (option.linkedProduct.active && option.linkedProduct.stock > 0)
}

function toggleProductOption(group: ProductOptionGroup, option: ProductOption) {
  if (!isProductOptionAvailable(option)) return
  if (group.selectionMode === 'SINGLE') {
    if (isProductOptionSelected(option.id) && !group.required && group.minSelections === 0) {
      selectedProductOptionQuantities[option.id] = 0
      selectedProductOptionDurations[option.id] = 0
      selectedProductOptionStarts[option.id] = ''
      return
    }
    for (const entry of group.options) {
      selectedProductOptionQuantities[entry.id] = 0
      selectedProductOptionDurations[entry.id] = 0
      selectedProductOptionStarts[entry.id] = ''
    }
    selectedProductOptionQuantities[option.id] = Math.max(1, option.minQuantity, option.defaultQuantity)
    initializeProductOptionDuration(option)
    void loadAccessorySlots(option)
    return
  }
  selectedProductOptionQuantities[option.id] = isProductOptionSelected(option.id) ? 0 : Math.max(1, option.minQuantity, option.defaultQuantity)
  if (isProductOptionSelected(option.id)) {
    initializeProductOptionDuration(option)
    void loadAccessorySlots(option)
  } else {
    selectedProductOptionDurations[option.id] = 0
    selectedProductOptionStarts[option.id] = ''
  }
}

function changeProductOptionQuantity(option: ProductOption, delta: number) {
  const maximum = Math.min(option.maxQuantity ?? Number.MAX_SAFE_INTEGER, option.linkedProduct?.stock ?? Number.MAX_SAFE_INTEGER)
  selectedProductOptionQuantities[option.id] = Math.max(option.minQuantity, Math.min(maximum, selectedProductOptionQuantity(option) + delta))
  void loadAccessorySlots(option)
}

function isProductOptionGroupValid(group: ProductOptionGroup) {
  const selectedCount = group.options.filter((option) => isProductOptionSelected(option.id)).length
  const minimum = group.required ? Math.max(1, group.minSelections) : group.minSelections
  return (
    selectedCount >= minimum &&
    (group.maxSelections == null || selectedCount <= group.maxSelections) &&
    group.options
      .filter((option) => isProductOptionSelected(option.id))
      .every((option) => !usesFixedAccessoryDuration(option) || (
        option.rentalDurationMinutes.includes(selectedProductOptionDurations[option.id] || 0)
        && Boolean(selectedProductOptionStarts[option.id])
      ))
  )
}

function isProductOptionGroupEmpty(group: ProductOptionGroup) {
  return group.options.every((option) => !isProductOptionSelected(option.id))
}

function clearProductOptionGroup(group: ProductOptionGroup) {
  for (const option of group.options) {
    selectedProductOptionQuantities[option.id] = 0
    selectedProductOptionDurations[option.id] = 0
    selectedProductOptionStarts[option.id] = ''
  }
}

function usesFixedAccessoryDuration(option: ProductOption) {
  return option.kind === 'ACCESSORY' && option.linkedProduct?.saleType === 'RENTAL' && option.rentalPeriodMode === 'FIXED_DURATION'
}

function initializeProductOptionDuration(option: ProductOption) {
  if (usesFixedAccessoryDuration(option) && !selectedProductOptionDurations[option.id]) {
    selectedProductOptionDurations[option.id] = option.rentalDurationMinutes[0] || 0
  }
}

function formatAccessoryDuration(minutes: number) {
  const hours = minutes / 60
  return Number.isInteger(hours) ? `${hours} h` : `${minutes} min`
}

function openProductGallery(index: number) {
  productGalleryIndex.value = Math.max(0, Math.min(index, productGallerySlides.value.length - 1))
  productGalleryOpen.value = true
}

function selectedAccessorySlot(optionId: string) {
  return accessorySlots[optionId]?.find(entry => entry.start === selectedProductOptionStarts[optionId]) || null
}

function formatAccessorySlot(slot: { start: string; end: string }) {
  const date = new Intl.DateTimeFormat(contentLocale.value, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(slot.start))
  const time = new Intl.DateTimeFormat(contentLocale.value, { hour: '2-digit', minute: '2-digit' })
  return `${rentalPickupShortLabel.value} : ${date}, ${time.format(new Date(slot.start))} · ${rentalReturnShortLabel.value} : ${time.format(new Date(slot.end))}`
}

function onAccessoryDurationChange(option: ProductOption) {
  selectedProductOptionStarts[option.id] = ''
  void loadAccessorySlots(option)
}

async function loadAccessorySlots(option: ProductOption) {
  if (!usesFixedAccessoryDuration(option) || !option.linkedProductId || !selectedRentalStartDate.value || !selectedRentalEndDate.value) {
    accessorySlots[option.id] = []
    selectedProductOptionStarts[option.id] = ''
    return
  }
  const durationMinutes = Number(selectedProductOptionDurations[option.id] || 0)
  if (!durationMinutes) return
  accessorySlotsPending[option.id] = true
  try {
    const response = await $fetch<{ slots: Array<{ start: string; end: string; remaining: number }> }>('/api/shop/accessory-rental-slots', {
      query: {
        productId: option.linkedProductId,
        durationMinutes,
        parentStart: selectedRentalStartDate.value,
        parentEnd: selectedRentalEndDate.value,
        quantity: getProductOptionChargedQuantity(option.quantityMode, quantity.value, selectedProductOptionQuantity(option)),
      },
    })
    accessorySlots[option.id] = response.slots
    if (!response.slots.some(slot => slot.start === selectedProductOptionStarts[option.id])) {
      selectedProductOptionStarts[option.id] = ''
    }
  } catch {
    accessorySlots[option.id] = []
    selectedProductOptionStarts[option.id] = ''
  } finally {
    accessorySlotsPending[option.id] = false
  }
}

function productOptionPriceLabel(option: ProductOption) {
  if (option.pricingMode === 'RENTAL_DURATION' && !selectedRentalStartDate.value) {
    const hourly = option.priceSource === 'LINKED_PRODUCT' ? option.linkedProduct?.rentalHourlyPrice : option.hourlyPrice
    const daily = option.priceSource === 'LINKED_PRODUCT' ? option.linkedProduct?.rentalDailyPrice : option.dailyPrice
    return [hourly == null ? '' : `${$formatPrice(hourly)} / ${hourUnitLabel.value}`, daily == null ? '' : `${$formatPrice(daily)} / ${dayUnitLabel.value}`]
      .filter(Boolean)
      .join(' · ')
  }
  const unitPrice = getProductOptionCalculatedUnitPrice(
    option,
    rentalDurationUnits.value,
    selectedRentalStartDate.value ? selectedPricingMode.value : null,
    selectedProductOptionDurations[option.id] || null,
  )
  return $formatPrice(unitPrice)
}

function onRentalDatesSelected(payload: { rentalStartDate: string; rentalEndDate: string; pricingMode: 'HOURLY' | 'DAILY'; availableQuantity: number }) {
  selectedRentalStartDate.value = payload.rentalStartDate
  selectedRentalEndDate.value = payload.rentalEndDate
  selectedPricingMode.value = payload.pricingMode
  selectedRentalAvailableQuantity.value = Math.max(0, Number(payload.availableQuantity || 0))
  quantity.value = Math.min(quantity.value, Math.max(1, selectedRentalAvailableQuantity.value))
  rentalModalOpen.value = false
  for (const option of publicOptionGroups.value.flatMap(group => group.options).filter(option => isProductOptionSelected(option.id))) {
    selectedProductOptionStarts[option.id] = ''
    void loadAccessorySlots(option)
  }
}

watch(quantity, () => {
  for (const option of publicOptionGroups.value.flatMap(group => group.options).filter(option => isProductOptionSelected(option.id) && usesFixedAccessoryDuration(option))) {
    void loadAccessorySlots(option)
  }
})

async function addSaleToCart() {
  if (!product.value) return
  if (!publicOptionGroups.value.every(isProductOptionGroupValid)) return
  await commitCartItem({
    key: `product-${product.value.id}`,
    kind: 'product',
    productId: product.value.id,
    slug: product.value.slug,
    title: getLocalizedProductName(product.value),
    imageUrl: product.value.imageUrl,
    description: getLocalizedProductExcerpt(product.value) || getLocalizedProductDescription(product.value),
    quantity: quantity.value,
    saleType: product.value.saleType,
    availableQuantity: product.value.stock,
    vatRate: product.value.vatRate,
    paymentTaxCode: product.value.paymentTaxCode,
    paymentTaxBehavior: product.value.paymentTaxBehavior,
    allowOfflinePayment: product.value.allowOfflinePayment,
    allowOnlinePayment: product.value.allowOnlinePayment,
    rentalDepositAmount: product.value.rentalDepositAmount,
    rentalDepositAllowOnsitePayment: product.value.rentalDepositAllowOnsitePayment,
    rentalDepositAllowOnlinePayment: product.value.rentalDepositAllowOnlinePayment,
    unitPrice: product.value.price,
    optionSelections: selectedProductOptions.value,
    totalPrice: product.value.price * quantity.value + selectedProductOptionsTotal.value,
  })
}

async function addRentalToCart() {
  if (!product.value || !canAddRentalToCart.value) return
  await commitCartItem({
    key: `product-${product.value.id}-${selectedRentalStartDate.value}-${selectedRentalEndDate.value}-${selectedRentalInsurances.value
      .map((entry) => entry.documentId)
      .sort()
      .join('-')}-${selectedProductOptions.value
      .map((entry) => `${entry.optionId}:${entry.quantity}:${entry.rentalStartDate || ''}`)
      .sort()
      .join('-')}`,
    kind: 'product',
    productId: product.value.id,
    slug: product.value.slug,
    title: getLocalizedProductName(product.value),
    imageUrl: product.value.imageUrl,
    description: getLocalizedProductExcerpt(product.value) || getLocalizedProductDescription(product.value),
    quantity: quantity.value,
    saleType: product.value.saleType,
    rentalStartDate: selectedRentalStartDate.value,
    rentalEndDate: selectedRentalEndDate.value,
    rentalPricingMode: selectedPricingMode.value,
    rentalBaseUnitPrice: selectedRentalPrice.value,
    insuranceSelections: selectedRentalInsurances.value.map((entry) => ({
      ...entry,
    })),
    optionSelections: selectedProductOptions.value,
    associatedDocuments: associatedDocuments.value,
    availableQuantity: selectedRentalAvailableQuantity.value,
    vatRate: product.value.vatRate,
    paymentTaxCode: product.value.paymentTaxCode,
    paymentTaxBehavior: product.value.paymentTaxBehavior,
    allowOfflinePayment: product.value.allowOfflinePayment,
    allowOnlinePayment: product.value.allowOnlinePayment,
    rentalDepositAmount: product.value.rentalDepositAmount,
    rentalDepositAllowOnsitePayment: product.value.rentalDepositAllowOnsitePayment,
    rentalDepositAllowOnlinePayment: product.value.rentalDepositAllowOnlinePayment,
    unitPrice: selectedRentalPayablePrice.value,
    totalPrice: selectedRentalPayablePrice.value * quantity.value + selectedProductOptionsTotal.value,
  })
}

async function commitCartItem(item: ShopCartItem) {
  if (isEditingCartItem.value) {
    replace(editingCartItemKey.value, item)
    $toast.success(updateCartSuccessLabel.value)
    await nextTick()
    await navigateTo(localePath('/panier'))
    return
  }
  add(item)
  $toast.success(
    item.saleType === 'RENTAL'
      ? publicText('shop.product.addRentalSuccess', 'Location ajoutée au panier')
      : publicText('shop.product.addSaleSuccess', 'Ajouté au panier'),
  )
}

function restoreCartItemSelection() {
  const item = editingCartItem.value
  if (!item || !product.value || item.productId !== product.value.id) return
  quantity.value = Math.max(1, Math.min(item.quantity, item.availableQuantity ?? product.value.stock))
  selectedRentalStartDate.value = item.rentalStartDate || ''
  selectedRentalEndDate.value = item.rentalEndDate || ''
  selectedPricingMode.value = item.rentalPricingMode === 'HOURLY' ? 'HOURLY' : 'DAILY'
  selectedRentalAvailableQuantity.value = item.availableQuantity ?? product.value.stock
  const requiredInsuranceIds = rentalInsuranceOptions.value.filter((insurance) => insurance.required).map((insurance) => insurance.documentId)
  selectedInsuranceDocumentIds.value = Array.from(
    new Set([...requiredInsuranceIds, ...(item.insuranceSelections || []).map((insurance) => insurance.documentId)]),
  )
  for (const key of Object.keys(selectedProductOptionQuantities)) delete selectedProductOptionQuantities[key]
  for (const key of Object.keys(selectedProductOptionDurations)) delete selectedProductOptionDurations[key]
  for (const key of Object.keys(selectedProductOptionStarts)) delete selectedProductOptionStarts[key]
  for (const option of item.optionSelections || []) {
    selectedProductOptionQuantities[option.optionId] = Math.max(1, option.selectedQuantity)
    selectedProductOptionDurations[option.optionId] = Number(option.rentalDurationMinutes || 0)
    selectedProductOptionStarts[option.optionId] = option.rentalStartDate || ''
  }
  for (const option of publicOptionGroups.value.flatMap(group => group.options).filter(option => isProductOptionSelected(option.id))) {
    void loadAccessorySlots(option)
  }
}
</script>
