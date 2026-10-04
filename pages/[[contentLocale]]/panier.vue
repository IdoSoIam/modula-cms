<template>
  <section class="py-12">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div class="text-sm uppercase tracking-[0.22em] opacity-60">
            {{ eyebrowLabel }}
          </div>
          <h1 class="mt-3 text-4xl font-semibold">{{ titleLabel }}</h1>
          <p class="mt-3 max-w-3xl text-base opacity-80">{{ introLabel }}</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <NuxtLink class="btn btn-ghost" :to="localePath(shopPagePath)">{{ productsLinkLabel }}</NuxtLink>
        </div>
      </div>

      <ShopCheckoutProgress :current="checkoutStep" :ariaLabelText="progressLabel" :steps="checkoutSteps" />

      <div
        v-if="items.length"
        class="grid w-full gap-8"
        :class="checkoutStep === 'information' ? 'mx-auto' : 'lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.9fr)]'"
      >
        <div v-if="checkoutStep !== 'information'" class="space-y-4">
          <article v-for="item in items" :key="item.key" class="modula-card border border-base-300 bg-base-100 p-5 shadow-sm">
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div class="flex gap-4">
                <AppImage v-if="item.imageUrl" :src="item.imageUrl" :alt="item.title" class="h-24 w-24 rounded-2xl object-cover" sizes="96px" />
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-xl font-semibold">{{ item.title }}</h2>
                    <span class="badge badge-outline">{{ productBadgeLabel }}</span>
                  </div>
                  <p v-if="item.description" class="text-sm opacity-75 break-all">
                    {{ item.description }}
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <span class="badge badge-soft">{{ stockLabel }}: {{ item.availableQuantity ?? '-' }}</span>
                    <span v-if="item.allowOfflinePayment" class="badge badge-soft">{{ offlineLabel }}</span>
                    <span v-if="item.allowOnlinePayment && stripeEnabled" class="badge badge-outline">{{ onlineLabel }}</span>
                    <span class="badge badge-ghost">{{ formatVatBadge(item.vatRate) }}</span>
                    <span v-if="stripeTaxEnabled && resolveCartTaxCode(item)" class="badge badge-outline">
                      {{ taxCodeLabel }}: {{ resolveCartTaxCode(item) }}
                    </span>
                  </div>
                  <ShopRentalPeriodSummary
                    v-if="item.saleType === 'RENTAL'"
                    compact
                    :start="item.rentalStartDate"
                    :end="item.rentalEndDate"
                    :locale="contentLocale"
                    :title="rentalPeriodLabel"
                    :duration="formatRentalDuration(item)"
                  />
                  <p v-if="item.saleType === 'RENTAL' && item.rentalPartySize" class="text-sm font-medium">
                    {{ rentalPartySizeLabel }} : {{ item.rentalPartySize }}
                  </p>
                  <dl v-if="item.saleType === 'RENTAL'" class="space-y-1 text-sm">
                    <div class="flex justify-between gap-4">
                      <dt>{{ rentalBasePriceLabel }}</dt>
                      <dd>
                        {{ $formatPrice((item.rentalBaseUnitPrice ?? item.unitPrice) * item.quantity) }}
                      </dd>
                    </div>
                    <div v-for="insurance in item.insuranceSelections || []" :key="insurance.documentId" class="flex justify-between gap-4">
                      <dt>{{ insurance.name }}</dt>
                      <dd>
                        {{ $formatPrice(insurance.unitPrice * item.quantity) }}
                      </dd>
                    </div>
                    <div v-for="option in item.optionSelections || []" :key="option.optionId" class="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2">
                      <dt>
                        {{ option.label }} × {{ option.quantity }}
                      </dt>
                      <dd>{{ $formatPrice(option.totalPrice) }}</dd>
                      <ShopRentalPeriodSummary
                        v-if="option.rentalStartDate && option.rentalDurationMinutes"
                        class="col-span-2 mb-2"
                        compact
                        :start="option.rentalStartDate"
                        :end="resolveAccessoryEndDate(option.rentalStartDate, option.rentalEndDate, option.rentalDurationMinutes)"
                        :locale="contentLocale"
                        :title="accessorySlotLabel"
                        :duration="formatAccessoryDuration(option.rentalDurationMinutes)"
                      />
                    </div>
                    <div v-if="Number(item.rentalDepositAmount || 0) > 0" class="mt-2 flex justify-between gap-4 border-t border-base-300 pt-2">
                      <dt>{{ depositLabel }}</dt>
                      <dd>
                        {{ $formatPrice(Number(item.rentalDepositAmount) * item.quantity) }}
                      </dd>
                    </div>
                  </dl>
                  <div v-if="item.associatedDocuments?.some((document) => document.billingDocumentKind !== 'CONTRACT')" class="flex flex-wrap gap-2">
                    <a
                      v-for="document in item.associatedDocuments"
                      :key="document.key"
                      v-show="document.billingDocumentKind !== 'CONTRACT'"
                      :href="document.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="btn btn-xs btn-outline"
                    >
                      <Icon name="mdi:file-document-outline" size="14" />
                      {{ document.name }}
                    </a>
                  </div>
                </div>
              </div>
              <div class="flex flex-col items-end gap-3">
                <div class="text-right">
                  <div class="text-sm opacity-60">
                    {{ displayedUnitPriceLabel }}
                  </div>
                  <div class="font-medium">
                    {{ $formatPrice(item.unitPrice) }}
                  </div>
                </div>
                <div v-if="checkoutStep === 'cart'" class="flex items-center gap-3">
                  <button class="btn btn-sm btn-ghost" @click="updateItemQuantity(item.key, item.quantity - 1)">
                    <Icon name="mdi:minus" size="16" />
                  </button>
                  <span class="w-8 text-center">{{ item.quantity }}</span>
                  <button class="btn btn-sm btn-ghost" @click="updateItemQuantity(item.key, item.quantity + 1)">
                    <Icon name="mdi:plus" size="16" />
                  </button>
                </div>
                <div class="text-right">
                  <div class="text-sm opacity-60">
                    {{ displayedLineTotalLabel }}
                  </div>
                  <div class="text-lg font-semibold text-primary">
                    {{ $formatPrice(item.totalPrice) }}
                  </div>
                </div>
                <NuxtLink v-if="checkoutStep === 'cart'" class="btn btn-sm btn-outline" :to="editItemTarget(item)">
                  <Icon name="mdi:pencil-outline" size="18" />
                  {{ editItemLabel }}
                </NuxtLink>
                <button v-if="checkoutStep === 'cart'" class="btn btn-sm btn-ghost text-error" @click="removeItem(item.key)">
                  <Icon name="mdi:delete-outline" size="18" />
                  {{ removeLabel }}
                </button>
              </div>
            </div>
          </article>
        </div>

        <aside class="modula-card border border-base-300 bg-base-100 p-6 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-2xl font-semibold">{{ checkoutTitleLabel }}</h2>
              <p class="mt-2 text-sm opacity-75">{{ checkoutIntroLabel }}</p>
            </div>
            <span class="badge badge-primary text-nowrap">{{ countLabel }}</span>
          </div>

          <div v-if="checkoutStep === 'information'" class="mt-6 grid gap-4 md:grid-cols-2">
            <div class="form-control flex flex-col gap-3">
              <label class="label"
                ><span class="label-text">{{ requiredLabel(fullNameLabel) }}</span></label
              >
              <input v-model="checkoutForm.customerName" class="input input-bordered" />
            </div>
            <div class="form-control flex flex-col gap-3">
              <label class="label"
                ><span class="label-text">{{ requiredLabel(emailLabel) }}</span></label
              >
              <input v-model="checkoutForm.email" type="email" class="input input-bordered" />
            </div>
            <div class="form-control flex flex-col gap-3">
              <label class="label"
                ><span class="label-text">{{ phoneLabel }}</span></label
              >
              <input v-model="checkoutForm.phone" class="input input-bordered" />
            </div>

            <div class="md:col-span-2 border-t border-base-300 pt-4">
              <h3 class="font-semibold">{{ billingAddressTitle }}</h3>
              <p class="mt-1 text-sm opacity-65">{{ billingAddressHelp }}</p>
            </div>
            <div class="form-control flex flex-col gap-3 md:col-span-2">
              <label class="label"><span class="label-text">{{ requiredLabel(addressLine1Label) }}</span></label>
              <input v-model="checkoutForm.billingAddress" class="input input-bordered" autocomplete="billing street-address" />
            </div>
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ requiredLabel(postalCodeLabel) }}</span></label>
              <input v-model="checkoutForm.billingPostalCode" class="input input-bordered" autocomplete="billing postal-code" />
            </div>
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ requiredLabel(cityLabel) }}</span></label>
              <input v-model="checkoutForm.billingCity" class="input input-bordered" autocomplete="billing address-level2" />
            </div>
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ requiredLabel(countryLabel) }}</span></label>
              <input v-model="checkoutForm.billingCountry" class="input input-bordered" autocomplete="billing country-name" />
            </div>
            <label v-if="authStore.user" class="flex cursor-pointer items-center gap-3 self-end pb-3">
              <input v-model="checkoutForm.saveBillingAddress" type="checkbox" class="checkbox checkbox-sm" />
              <span class="text-sm">{{ saveBillingAddressLabel }}</span>
            </label>

            <div class="rounded-box bg-base-200 p-4 text-sm opacity-80 md:col-span-2">
              {{ accountProvisioningNotice }}
            </div>

            <div v-if="hasRentalItems" class="rounded-box bg-base-200 p-4 text-sm opacity-80 md:col-span-2">
              {{ rentalHelpLabel }}
            </div>

            <div v-if="deliveryChoices.length > 1" class="form-control flex flex-col gap-3">
              <label class="label"
                ><span class="label-text">{{ deliveryLabel }}</span></label
              >
              <select v-model="checkoutForm.deliveryType" class="select select-bordered" :disabled="deliveryOptionsPending">
                <option v-if="!deliveryChoices.length" value="">
                  {{ deliveryPlaceholderLabel }}
                </option>
                <option v-if="deliveryChoices.includes('ONSITE')" value="ONSITE">
                  {{ onSiteDeliveryLabel }}
                </option>
                <option v-if="deliveryChoices.includes('PICKUP')" value="PICKUP">
                  {{ pickupDeliveryLabel }}
                </option>
                <option v-if="deliveryChoices.includes('TOUR')" value="TOUR">
                  {{ tourDeliveryLabel }}
                </option>
              </select>
            </div>

            <div v-if="checkoutForm.deliveryType === 'ONSITE'" class="rounded-box bg-base-200 p-4 text-sm md:col-span-2">
              <div class="font-medium">{{ onSiteDeliveryLabel }}</div>
              <template v-if="hasRentalItems">
                <div class="mt-1 opacity-75">
                  {{ deliveryOptions?.onSitePickup?.address || noAddressLabel }}
                </div>
                <div v-for="rental in rentalPickupSummaries" :key="rental.key" class="mt-3">
                  <ShopRentalPeriodSummary
                    compact
                    :start="rental.start"
                    :end="rental.end"
                    :locale="contentLocale"
                    :title="rental.title"
                    :duration="rental.duration"
                  />
                </div>
                <div v-if="hasMixedSaleTypes" class="mt-2 opacity-75">
                  {{ mixedCartPickupLabel }}
                </div>
              </template>
              <div v-else class="mt-1 opacity-75">
                {{ onSitePickupSummary }}
              </div>
            </div>

            <div v-if="checkoutForm.deliveryType === 'PICKUP'" class="space-y-3 md:col-span-2">
              <div class="form-control flex flex-col gap-3">
                <label class="label"
                  ><span class="label-text">{{ pickupPointLabel }}</span></label
                >
                <select v-model.number="checkoutForm.pickupPointId" class="select select-bordered">
                  <option :value="0">{{ pickupPlaceholderLabel }}</option>
                  <option v-for="point in pickupPoints" :key="point.id" :value="point.id">
                    {{ point.name }}
                  </option>
                </select>
              </div>
              <div v-if="selectedPickupPoint" class="rounded-box bg-base-200 p-4 text-sm">
                <div class="font-medium">{{ selectedPickupPoint.name }}</div>
                <div class="mt-1 opacity-75">
                  {{ selectedPickupPoint.address || noAddressLabel }}
                </div>
              </div>
            </div>

            <div v-if="checkoutForm.deliveryType === 'TOUR'" class="grid gap-3 md:col-span-2 md:grid-cols-2">
              <div class="rounded-box bg-base-200 p-4 text-sm md:col-span-2">
                <div class="font-medium">{{ tourCityHelperTitle }}</div>
                <div class="mt-1 opacity-75">{{ tourCityHelperLabel }}</div>
              </div>
              <label class="flex cursor-pointer items-center gap-3 md:col-span-2">
                <input v-model="checkoutForm.deliverySameAsBilling" type="checkbox" class="checkbox checkbox-sm" />
                <span class="text-sm">{{ deliverySameAsBillingLabel }}</span>
              </label>
              <div class="form-control flex flex-col gap-3">
                <label class="label"
                  ><span class="label-text">{{ requiredLabel(cityLabel) }}</span></label
                >
                <input v-model="checkoutForm.deliveryCity" class="input input-bordered" :list="deliveryCitiesListId" autocomplete="address-level2" />
                <datalist :id="deliveryCitiesListId">
                  <option v-for="city in availableDeliveryCities" :key="city" :value="city" />
                </datalist>
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"
                  ><span class="label-text">{{ requiredLabel(addressLabel) }}</span></label
                >
                <input v-model="checkoutForm.deliveryAddress" class="input input-bordered" />
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"
                  ><span class="label-text">{{ requiredLabel(postalCodeLabel) }}</span></label
                >
                <input v-model="checkoutForm.deliveryPostalCode" class="input input-bordered" :list="deliveryPostalCodesListId" autocomplete="postal-code" />
                <datalist :id="deliveryPostalCodesListId">
                  <option v-for="code in availableDeliveryPostalCodes" :key="code" :value="code" />
                </datalist>
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"
                  ><span class="label-text">{{ requiredLabel(deliveryTourLabel) }}</span></label
                >
                <select v-model.number="checkoutForm.deliveryTourId" class="select select-bordered" :disabled="!filteredTours.length">
                  <option :value="0">{{ tourPlaceholderLabel }}</option>
                  <option v-for="tour in filteredTours" :key="tour.id" :value="tour.id">
                    {{ tour.name }}
                  </option>
                </select>
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ requiredLabel(countryLabel) }}</span></label>
                <input v-model="checkoutForm.deliveryCountry" class="input input-bordered" autocomplete="shipping country-name" />
              </div>
              <label v-if="authStore.user" class="flex cursor-pointer items-center gap-3 self-end pb-3">
                <input v-model="checkoutForm.saveShippingAddress" type="checkbox" class="checkbox checkbox-sm" />
                <span class="text-sm">{{ saveShippingAddressLabel }}</span>
              </label>
              <p v-if="checkoutForm.deliveryCity.trim() && !deliveryCityValid" class="text-sm text-warning">
                {{ unavailableCityLabel }}
              </p>
              <p v-if="deliveryCityValid && checkoutForm.deliveryPostalCode.trim() && !deliveryPostalCodeValid" class="text-sm text-warning">
                {{ postalCodeMismatchLabel }}
              </p>
              <div v-if="selectedDeliveryTour" class="rounded-box bg-base-200 p-4 text-sm md:col-span-2">
                <div class="font-medium">{{ selectedDeliveryTour.name }}</div>
                <div class="mt-1 opacity-75">
                  {{ deliveryTourSummary(selectedDeliveryTour) }}
                </div>
              </div>
            </div>

            <div class="form-control flex flex-col gap-3">
              <label class="label"
                ><span class="label-text">{{ paymentLabel }}</span></label
              >
              <select v-if="paymentCapabilities.requiresChoice" v-model="checkoutForm.paymentMode" class="select select-bordered">
                <option v-if="paymentCapabilities.allowOffline" value="offline">
                  {{ offlineLabel }}
                </option>
                <option v-if="paymentCapabilities.allowOnline" value="stripe">
                  {{ onlineLabel }}
                </option>
              </select>
              <input v-else class="input input-bordered" :value="resolvedPaymentLabel" disabled />
              <p v-if="paymentConstraintNotice" class="text-sm opacity-70">
                {{ paymentConstraintNotice }}
              </p>
            </div>

            <div v-if="depositTotal > 0" class="form-control flex flex-col gap-3 rounded-box border border-base-300 bg-base-200/35 p-4">
              <div class="flex items-center justify-between gap-4">
                <span class="font-medium">{{ depositLabel }}</span>
                <span class="font-semibold">{{ $formatPrice(depositTotal) }}</span>
              </div>
              <label class="label p-0"
                ><span class="label-text">{{ depositPaymentLabel }}</span></label
              >
              <select v-if="depositPaymentCapabilities.requiresChoice" v-model="checkoutForm.depositPaymentMode" class="select select-bordered">
                <option value="onsite">{{ depositOnsiteLabel }}</option>
                <option value="online">{{ depositOnlineLabel }}</option>
              </select>
              <input v-else class="input input-bordered" :value="resolvedDepositPaymentLabel" disabled />
              <p class="text-xs opacity-65">{{ depositSeparateNotice }}</p>
              <dl class="space-y-2 border-t border-base-300 pt-3 text-sm">
                <div v-if="amountDueOnsite > 0" class="flex items-center justify-between gap-4">
                  <dt class="font-medium">{{ amountDueOnsiteLabel }}</dt>
                  <dd class="font-semibold">
                    {{ $formatPrice(amountDueOnsite) }}
                  </dd>
                </div>
                <div v-if="amountDueOnline > 0" class="flex items-center justify-between gap-4">
                  <dt class="font-medium">{{ amountDueOnlineLabel }}</dt>
                  <dd class="font-semibold">
                    {{ $formatPrice(amountDueOnline) }}
                  </dd>
                </div>
              </dl>
            </div>

            <div class="form-control flex flex-col gap-3 md:col-span-2 w-full">
              <label class="label"
                ><span class="label-text">{{ messageLabel }}</span></label
              >
              <textarea v-model="checkoutForm.message" class="textarea textarea-bordered min-h-28 w-full" />
            </div>
          </div>

          <div v-else-if="checkoutStep === 'review'" class="mt-6 space-y-4 text-sm">
            <div class="rounded-box border border-base-300 p-4">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="font-semibold">{{ contactReviewTitle }}</div>
                  <div class="mt-2">{{ checkoutForm.customerName }}</div>
                  <div class="opacity-75">{{ checkoutForm.email }}</div>
                  <div v-if="checkoutForm.phone" class="opacity-75">{{ checkoutForm.phone }}</div>
                  <div class="mt-3 font-medium">{{ billingAddressTitle }}</div>
                  <div class="opacity-75">{{ billingReviewSummary }}</div>
                </div>
                <NuxtLink class="btn btn-xs btn-ghost" :to="informationPath">{{ editItemLabel }}</NuxtLink>
              </div>
            </div>
            <div class="rounded-box border border-base-300 p-4">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <div class="font-semibold">{{ deliveryReviewTitle }}</div>
                  <div class="mt-2">{{ deliveryReviewSummary }}</div>
                  <div class="mt-1 opacity-75">{{ paymentReviewSummary }}</div>
                  <div v-if="depositTotal > 0" class="mt-1 opacity-75">{{ depositLabel }} : {{ resolvedDepositPaymentLabel }}</div>
                </div>
                <NuxtLink class="btn btn-xs btn-ghost" :to="informationPath">{{ editItemLabel }}</NuxtLink>
              </div>
            </div>
            <div v-if="checkoutForm.message" class="rounded-box border border-base-300 p-4">
              <div class="font-semibold">{{ messageLabel }}</div>
              <p class="mt-2 whitespace-pre-line opacity-75">{{ checkoutForm.message }}</p>
            </div>
            <div class="rounded-box border border-base-300 p-4">
              <div class="font-semibold">{{ documentsReviewTitle }}</div>
              <div v-if="checkoutDocuments.length" class="mt-3 flex flex-wrap gap-2">
                <template v-for="document in checkoutDocuments" :key="document.key">
                <button
                  v-if="document.billingDocumentKind === 'CONTRACT'"
                  type="button"
                  class="btn btn-xs btn-outline"
                  :disabled="contractPreviewPending"
                  @click="previewCheckoutContract(document.documentId)"
                >
                  <Icon name="mdi:file-document-outline" size="14" />
                  {{ document.name }}
                </button>
                <a
                  v-else
                  :href="document.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-xs btn-outline"
                >
                  <Icon name="mdi:file-document-outline" size="14" />
                  {{ document.name }}
                </a>
                </template>
              </div>
              <label class="mt-4 flex cursor-pointer items-start gap-3 border-t border-base-300 pt-4">
                <input v-model="checkoutForm.acceptedTerms" type="checkbox" class="checkbox checkbox-sm mt-0.5" />
                <span>
                  {{ termsAcceptancePrefix }}
                  <NuxtLink :to="localePath('/terms')" target="_blank" class="link">{{ termsLinkLabel }}</NuxtLink>.
                </span>
              </label>
            </div>
          </div>

          <div class="mt-6 rounded-box bg-base-200 p-4">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div class="min-w-0 flex-1">
                <dl v-if="!automaticTaxCheckout" class="space-y-2 text-sm">
                  <div class="flex justify-between gap-4">
                    <dt>{{ totalExclTaxLabel }}</dt>
                    <dd>{{ $formatPrice(cartTotalExclTax) }}</dd>
                  </div>
                  <div v-if="cartVatAmount > 0" class="flex justify-between gap-4">
                    <dt>{{ vatAmountLabel }}</dt>
                    <dd>{{ $formatPrice(cartVatAmount) }}</dd>
                  </div>
                  <div v-else class="flex justify-between gap-4 opacity-70">
                    <dt>{{ vatNotApplicableLabel }}</dt>
                    <dd>{{ $formatPrice(0) }}</dd>
                  </div>
                  <div class="flex items-end justify-between gap-4 border-t border-base-300 pt-3">
                    <dt class="font-semibold">{{ totalInclTaxLabel }}</dt>
                    <dd class="text-3xl font-semibold">
                      {{ $formatPrice(total) }}
                    </dd>
                  </div>
                </dl>
                <div v-else>
                  <div class="text-sm opacity-60">
                    {{ subtotalBeforeStripeTaxLabel }}
                  </div>
                  <div class="text-3xl font-semibold">
                    {{ $formatPrice(total) }}
                  </div>
                </div>
              </div>
            </div>
            <p v-if="!paymentCapabilities.allowOffline && !paymentCapabilities.allowOnline" class="mt-3 text-sm text-error">
              {{ unavailablePaymentLabel }}
            </p>
            <p v-else class="mt-3 text-sm opacity-70">
              {{ checkoutTaxNotice }}
            </p>
          </div>

          <button
            v-if="checkoutStep === 'cart'"
            class="btn btn-primary shrink-0 w-full mt-4"
            :disabled="stepNavigationPending"
            @click="goToCheckoutInformation"
          >
            <span v-if="stepNavigationPending" class="loading loading-spinner loading-sm" />
            {{ continueToInformationLabel }}
            <Icon name="mdi:arrow-right" size="18" />
          </button>
          <button
            v-else-if="checkoutStep === 'information'"
            class="btn btn-primary shrink-0 w-full mt-4"
            :disabled="stepNavigationPending"
            @click="goToCheckoutReview"
          >
            <span v-if="stepNavigationPending" class="loading loading-spinner loading-sm" />
            {{ continueToReviewLabel }}
            <Icon name="mdi:arrow-right" size="18" />
          </button>
          <button v-else class="btn btn-primary mt-4 w-full shrink-0" :disabled="savingOrder || !canSubmit" @click="submitOrder">
            <span v-if="savingOrder" class="loading loading-spinner loading-sm" />
            {{ submitLabel }}
          </button>
        </aside>
      </div>

      <div v-else class="modula-card border border-dashed border-base-300 px-6 py-16 text-center">
        <div class="mx-auto max-w-xl">
          <h2 class="text-2xl font-semibold">{{ emptyLabel }}</h2>
          <p class="mt-3 opacity-75">{{ emptyHelpLabel }}</p>
          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <NuxtLink class="btn btn-primary" :to="localePath(shopPagePath)">{{ productsLinkLabel }}</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getShopCartPaymentCapabilities, useShopCart, type ShopCartItem } from '#modula/composables/useShopCart'
import { getRentalDepositPaymentCapabilities } from '#modula/shared/rentalDeposit'
import { useAuthStore } from '#modula/stores/auth'

interface DeliveryOptionPickupPoint {
  id: number
  name: string
  address: string | null
}

interface DeliveryOptionTour {
  id: number
  name: string
  dayOfWeek: number
  nextDate: string
  startTime: string
  endTime: string
  cities: Array<{
    id: number
    city: string
    postalCodes: string | null
  }>
}

interface DeliveryOptionsPayload {
  deliveryEnabled?: boolean
  onSitePickup?: {
    label: string
    address: string
    dayOfWeek: number
    startTime: string
    endTime: string
    nextDate: string
    slotLabel: string
  } | null
  pickupPoints: DeliveryOptionPickupPoint[]
  tours: DeliveryOptionTour[]
  servedCities: string[]
}

type DeliveryType = '' | 'ONSITE' | 'PICKUP' | 'TOUR'

const { contentLocale } = useContentLocale()
const { publicText } = usePublicDictionary()
const locale = computed(() => contentLocale.value)
const localePath = usePublicLocalePath()
const route = useRoute()
const initialSiteConfig = await ensureSiteConfigState({ path: route.path, locale: contentLocale.value })
const siteConfig = useSiteConfigState()
const authStore = useAuthStore()
const { $toast, $formatPrice, $formatDate, $formatDateTime, $formatTime } = useNuxtApp() as any
const { items, count, total, updateQuantity, remove, clear } = useShopCart()
const checkoutStep = computed<'cart' | 'information' | 'review'>(() => {
  if (route.path.endsWith('/commande/validation')) return 'review'
  if (route.path.endsWith('/commande/informations')) return 'information'
  return 'cart'
})
const cartPath = computed(() => localePath('/panier'))
const informationPath = computed(() => localePath('/commande/informations'))
const reviewPath = computed(() => localePath('/commande/validation'))
const shopPagePath = computed(() => siteConfig.value?.shopPagePath || initialSiteConfig?.shopPagePath || '/boutique')

await authStore.ensureInitialized()

const { data: paymentConfig } = await useFetch<{
  enabled: boolean
  provider: 'none' | 'stripe_connect'
  publishableKey: string
  config?: {
    automaticTaxEnabled?: boolean
    defaultTaxBehavior?: 'inclusive' | 'exclusive'
    defaultTaxCode?: string
  } | null
}>('/api/payments/config')
const { data: deliveryOptions, pending: deliveryOptionsPending } = await useFetch<DeliveryOptionsPayload>('/api/delivery-options')

const stripeEnabled = computed(() => Boolean(paymentConfig.value?.enabled))
const stripeTaxEnabled = computed(() => Boolean(paymentConfig.value?.config?.automaticTaxEnabled))
const registryDefaultTaxCode = computed(() => paymentConfig.value?.config?.defaultTaxCode?.trim() || '')
const paymentCapabilities = computed(() => getShopCartPaymentCapabilities(items.value, stripeEnabled.value))
const hasRentalItems = computed(() => items.value.some((item) => item.saleType === 'RENTAL'))
const hasSaleItems = computed(() => items.value.some((item) => item.saleType === 'SALE'))
const hasMixedSaleTypes = computed(() => hasRentalItems.value && hasSaleItems.value)
const rentalLinesValid = computed(() =>
  items.value.every((item) => item.saleType !== 'RENTAL' || (item.rentalStartDate?.trim().length && item.rentalEndDate?.trim().length)),
)
const pickupPoints = computed(() => deliveryOptions.value?.pickupPoints || [])
const deliveryTours = computed(() => deliveryOptions.value?.tours || [])
const deliveryChoices = computed<DeliveryType[]>(() => {
  if (hasRentalItems.value) return ['ONSITE']
  const values: DeliveryType[] = []
  if (deliveryOptions.value?.onSitePickup) values.push('ONSITE')
  if (pickupPoints.value.length) values.push('PICKUP')
  if (deliveryTours.value.length) values.push('TOUR')
  return values
})

const checkoutForm = useState('modula-shop-checkout-form', () => ({
  customerName: '',
  email: '',
  phone: '',
  message: '',
  paymentMode: 'offline' as 'offline' | 'stripe',
  depositPaymentMode: 'onsite' as 'onsite' | 'online',
  deliveryType: '' as DeliveryType,
  pickupPointId: 0,
  deliveryTourId: 0,
  deliveryAddress: '',
  deliveryCity: '',
  deliveryPostalCode: '',
  deliveryCountry: 'France',
  deliverySameAsBilling: false,
  billingAddress: '',
  billingCity: '',
  billingPostalCode: '',
  billingCountry: 'France',
  saveBillingAddress: true,
  saveShippingAddress: true,
  acceptedTerms: false,
}))
const checkoutFormHydrated = ref(false)
const checkoutFormStorageKey = 'modula-shop-checkout-form-v1'

const savingOrder = ref(false)
const contractPreviewPending = ref(false)
const stepNavigationPending = ref(false)
const retryOrderId = ref<number | null>(null)

const eyebrowLabel = computed(() => publicText('checkout.cart.eyebrow', 'Commande'))
const titleLabel = computed(() => {
  if (checkoutStep.value === 'information') return publicText('checkout.steps.informationTitle', 'Coordonnées')
  if (checkoutStep.value === 'review') return publicText('checkout.steps.reviewTitle', 'Vérification de la commande')
  return publicText('checkout.cart.title', 'Panier d’achat')
})
const introLabel = computed(() => {
  if (checkoutStep.value === 'information') {
    return publicText('checkout.steps.informationIntro', 'Renseignez vos coordonnées, le retrait ou la livraison et le mode de règlement.')
  }
  if (checkoutStep.value === 'review') {
    return publicText('checkout.steps.reviewIntro', 'Vérifiez une dernière fois les articles, les montants et les informations de commande.')
  }
  return publicText('checkout.steps.cartIntro', 'Vérifiez les produits sélectionnés, puis continuez vers les informations de commande.')
})
const productsLinkLabel = computed(() => publicText('checkout.cart.productsLink', 'Voir les produits'))
const productBadgeLabel = computed(() => publicText('checkout.cart.productBadge', 'Produit'))
const stockLabel = computed(() => publicText('checkout.cart.stockLabel', 'Disponible'))
const offlineLabel = computed(() => publicText('checkout.cart.offlineLabel', 'Paiement sur place'))
const onlineLabel = computed(() => publicText('checkout.cart.onlineLabel', 'Paiement en ligne'))
const unitPriceLabel = computed(() => publicText('checkout.cart.unitPrice', 'Prix unitaire'))
const totalLabel = computed(() => publicText('checkout.cart.total', 'Total'))
const unitPriceInclTaxLabel = computed(() => publicText('checkout.cart.unitPriceInclTax', 'Prix unitaire TTC'))
const totalExclTaxLabel = computed(() => publicText('checkout.cart.totalExclTax', 'Total HT'))
const vatAmountLabel = computed(() => publicText('checkout.cart.vatAmount', 'TVA'))
const totalInclTaxLabel = computed(() => publicText('checkout.cart.totalInclTax', 'Total TTC'))
const subtotalBeforeStripeTaxLabel = computed(() => publicText('checkout.cart.subtotalBeforeStripeTax', 'Sous-total avant calcul de la TVA'))
const removeLabel = computed(() => publicText('checkout.cart.remove', 'Supprimer'))
const checkoutTitleLabel = computed(() => {
  if (checkoutStep.value === 'information') return publicText('checkout.steps.informationPanelTitle', 'Coordonnées')
  if (checkoutStep.value === 'review') return publicText('checkout.steps.reviewPanelTitle', 'Récapitulatif final')
  return publicText('checkout.steps.cartPanelTitle', 'Résumé du panier')
})
const checkoutIntroLabel = computed(() => {
  if (checkoutStep.value === 'information') {
    return publicText('checkout.cart.detailsIntro', 'Les options de livraison et de règlement s’adaptent aux offres sélectionnées.')
  }
  if (checkoutStep.value === 'review') return publicText('checkout.steps.reviewPanelIntro', 'Aucun nouveau choix ne sera ajouté après cette étape.')
  return publicText('checkout.steps.cartPanelIntro', 'Contrôlez les périodes, les options et les quantités avant de continuer.')
})
const countLabel = computed(() =>
  publicText('checkout.cart.count', '{count} article(s)', {
    count: count.value,
  }),
)
const fullNameLabel = computed(() => publicText('checkout.cart.fullName', 'Nom complet'))
const emailLabel = computed(() => publicText('checkout.cart.email', 'Email'))
const phoneLabel = computed(() => publicText('checkout.cart.phone', 'Téléphone'))
const accountProvisioningNotice = computed(() =>
  authStore.user
    ? publicText('checkout.cart.accountLinkedNotice', 'Cette commande sera rattachée à votre compte utilisateur.')
    : publicText(
        'checkout.cart.accountProvisioningNotice',
        'Si aucun compte n’existe avec cet email, un compte utilisateur sera créé automatiquement et un email d’activation vous sera envoyé.',
      ),
)
const rentalHelpLabel = computed(() =>
  publicText(
    'checkout.cart.rentalHelp',
    'Les dates de location sont choisies avant l’ajout de chaque location au panier. La disponibilité est revérifiée lors de la création de la commande.',
  ),
)
const mixedCartPickupLabel = computed(() =>
  publicText('checkout.cart.mixedRentalPickup', 'Les produits achetés seront retirés sur place avec le matériel loué.'),
)
const rentalPeriodLabel = computed(() => publicText('checkout.cart.rentalPeriod', 'Période de location'))
const rentalBasePriceLabel = computed(() => publicText('checkout.cart.rentalBasePrice', 'Location'))
const accessorySlotLabel = computed(() => publicText('shop.product.accessoryStart', 'Heure de retrait de l’accessoire'))
const deliveryLabel = computed(() => publicText('checkout.cart.deliveryMethod', 'Mode de livraison'))
const deliveryPlaceholderLabel = computed(() => publicText('checkout.cart.deliveryPlaceholder', 'Choisir un mode de livraison'))
const onSiteDeliveryLabel = computed(() => publicText('checkout.cart.onSiteDelivery', 'Retrait sur place'))
const pickupDeliveryLabel = computed(() => publicText('checkout.cart.pickupDelivery', 'Point relais'))
const tourDeliveryLabel = computed(() => publicText('checkout.cart.homeDelivery', 'Livraison à domicile'))
const pickupPointLabel = computed(() => publicText('checkout.cart.pickupDelivery', 'Point relais'))
const pickupPlaceholderLabel = computed(() => publicText('checkout.cart.pickupPlaceholder', 'Choisir un point relais'))
const deliveryTourLabel = computed(() => publicText('checkout.cart.deliverySlot', 'Créneau de livraison'))
const tourPlaceholderLabel = computed(() => publicText('checkout.cart.deliverySlotPlaceholder', 'Choisir un créneau'))
const addressLabel = computed(() => publicText('checkout.cart.address', 'Adresse'))
const cityLabel = computed(() => publicText('checkout.cart.city', 'Ville'))
const postalCodeLabel = computed(() => publicText('checkout.cart.postalCode', 'Code postal'))
const addressLine1Label = computed(() => publicText('checkout.cart.addressLine1', 'Adresse'))
const countryLabel = computed(() => publicText('checkout.cart.country', 'Pays'))
const billingAddressTitle = computed(() => publicText('checkout.cart.billingAddressTitle', 'Adresse de facturation'))
const billingAddressHelp = computed(() => publicText('checkout.cart.billingAddressHelp', 'Cette adresse apparaîtra sur les documents de facturation.'))
const saveBillingAddressLabel = computed(() => publicText('checkout.cart.saveBillingAddress', 'Enregistrer cette adresse dans mon profil'))
const saveShippingAddressLabel = computed(() => publicText('checkout.cart.saveShippingAddress', 'Enregistrer cette adresse de livraison dans mon profil'))
const deliverySameAsBillingLabel = computed(() => publicText('checkout.cart.deliverySameAsBilling', 'Utiliser l’adresse de facturation pour la livraison'))
const tourCityHelperTitle = computed(() => publicText('checkout.cart.deliveryEligibilityTitle', 'Éligibilité livraison'))
const tourCityHelperLabel = computed(() =>
  publicText(
    'checkout.cart.deliveryEligibilityHelp',
    'Pour vérifier l’éligibilité de la livraison à domicile, rentrez votre ville. Les suggestions ne proposent que les villes desservies par les créneaux configurés.',
  ),
)
const paymentLabel = computed(() => publicText('checkout.cart.paymentMethod', 'Mode de règlement'))
const editItemLabel = computed(() => publicText('checkout.cart.editItem', 'Modifier'))
const depositLabel = computed(() => publicText('shop.product.securityDeposit', 'Dépôt de garantie'))
const depositPaymentLabel = computed(() => publicText('shop.product.securityDepositPayment', 'Versement du dépôt de garantie'))
const depositOnsiteLabel = computed(() => publicText('shop.product.depositOnsite', 'Sur place'))
const depositOnlineLabel = computed(() => publicText('shop.product.depositOnline', 'En ligne'))
const depositSeparateNotice = computed(() =>
  publicText('checkout.cart.securityDepositSeparateNotice', 'Le dépôt de garantie est remboursable et reste distinct du total facturé de la location.'),
)
const amountDueOnsiteLabel = computed(() => publicText('checkout.cart.amountDueOnsite', 'Montant total à régler sur place'))
const amountDueOnlineLabel = computed(() => publicText('checkout.cart.amountDueOnline', 'Montant total à payer en ligne'))
const messageLabel = computed(() => publicText('checkout.cart.message', 'Message'))
const submitLabel = computed(() =>
  (checkoutForm.value.paymentMode === 'stripe' && paymentCapabilities.value.allowOnline) ||
  (depositTotal.value > 0 && checkoutForm.value.depositPaymentMode === 'online' && depositPaymentCapabilities.value.allowOnline)
    ? publicText('checkout.steps.payAmount', 'Payer {amount}', { amount: $formatPrice(amountDueOnline.value) })
    : hasRentalItems.value
      ? publicText('checkout.steps.confirmReservation', 'Confirmer la réservation')
      : publicText('checkout.cart.confirmOrder', 'Confirmer la commande'),
)
const unavailablePaymentLabel = computed(() =>
  publicText('checkout.cart.unavailablePayment', 'Aucun mode de règlement valide n’est actuellement disponible pour ce panier.'),
)
const emptyLabel = computed(() => publicText('checkout.cart.emptyTitle', 'Votre panier est vide.'))
const emptyHelpLabel = computed(() => publicText('checkout.cart.emptyHelp', 'Ajoutez un produit pour continuer.'))
const noAddressLabel = computed(() => publicText('checkout.cart.noAddress', 'Adresse à confirmer'))
const unavailableCityLabel = computed(() =>
  publicText('checkout.cart.cityUnavailable', 'La livraison à domicile n’est pas actuellement disponible dans cette ville.'),
)
const postalCodeMismatchLabel = computed(() => publicText('checkout.cart.postalCodeMismatch', 'Le code postal ne correspond pas à la ville sélectionnée.'))
const vatNotApplicableLabel = computed(() => publicText('checkout.cart.vatNotApplicable', 'TVA non applicable'))
const taxCodeLabel = computed(() => publicText('checkout.cart.taxCode', 'Code taxe'))
const progressLabel = computed(() => publicText('checkout.steps.progressLabel', 'Progression de la commande'))
const cartStepLabel = computed(() => publicText('checkout.steps.cart', 'Panier'))
const informationStepLabel = computed(() => publicText('checkout.steps.information', 'Coordonnées'))
const reviewStepLabel = computed(() => publicText('checkout.steps.review', 'Vérification'))
const continueToInformationLabel = computed(() => publicText('checkout.steps.continueInformation', 'Continuer vers les informations'))
const continueToReviewLabel = computed(() => publicText('checkout.steps.continueReview', 'Vérifier la commande'))
const contactReviewTitle = computed(() => publicText('checkout.steps.contactReviewTitle', 'Coordonnées'))
const deliveryReviewTitle = computed(() => publicText('checkout.steps.deliveryReviewTitle', 'Retrait, livraison et règlement'))
const documentsReviewTitle = computed(() => publicText('checkout.steps.documentsReviewTitle', 'Documents et conditions'))
const termsAcceptancePrefix = computed(() => publicText('checkout.steps.termsAcceptancePrefix', 'Je reconnais avoir consulté les documents associés et j’accepte les'))
const termsLinkLabel = computed(() => publicText('checkout.steps.termsLink', 'conditions applicables'))

const resolvedPaymentLabel = computed(() =>
  checkoutForm.value.paymentMode === 'stripe' && paymentCapabilities.value.allowOnline ? onlineLabel.value : offlineLabel.value,
)
const depositItems = computed(() => items.value.filter((item) => item.saleType === 'RENTAL' && Number(item.rentalDepositAmount || 0) > 0))
const depositTotal = computed(() => roundCurrency(depositItems.value.reduce((sum, item) => sum + Number(item.rentalDepositAmount || 0) * item.quantity, 0)))
const depositPaymentCapabilities = computed(() => getRentalDepositPaymentCapabilities(depositItems.value, stripeEnabled.value))
const resolvedDepositPaymentLabel = computed(() =>
  depositPaymentCapabilities.value.allowOnline && !depositPaymentCapabilities.value.allowOnsite ? depositOnlineLabel.value : depositOnsiteLabel.value,
)
const amountDueOnsite = computed(() =>
  roundCurrency(
    (checkoutForm.value.paymentMode === 'offline' ? total.value : 0) + (checkoutForm.value.depositPaymentMode === 'onsite' ? depositTotal.value : 0),
  ),
)
const amountDueOnline = computed(() =>
  roundCurrency(
    (checkoutForm.value.paymentMode === 'stripe' ? total.value : 0) + (checkoutForm.value.depositPaymentMode === 'online' ? depositTotal.value : 0),
  ),
)

function editItemTarget(item: ShopCartItem) {
  return localePath({
    path: `/products/${item.slug || item.productId}`,
    query: { editCartItem: item.key },
  })
}

const selectedPickupPoint = computed(() => pickupPoints.value.find((point) => point.id === Number(checkoutForm.value.pickupPointId)) || null)

const deliveryCitiesListId = 'delivery-city-suggestions'
const deliveryPostalCodesListId = 'delivery-postalcode-suggestions'

const availableDeliveryCities = computed(() => {
  const seen = new Map<string, string>()
  for (const city of deliveryOptions.value?.servedCities || []) {
    const normalized = String(city || '').trim()
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, normalized)
    }
  }
  return Array.from(seen.values()).sort((left, right) => left.localeCompare(right, 'fr'))
})

const cityPostalCodesMap = computed(() => {
  const map = new Map<string, string[]>()
  for (const tour of deliveryTours.value) {
    for (const entry of tour.cities) {
      const cityKey = entry.city.trim().toLowerCase()
      if (!cityKey) continue
      if (!entry.postalCodes) {
        map.set(cityKey, [])
        continue
      }
      const codes = entry.postalCodes
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
      if (!codes.length) {
        map.set(cityKey, [])
        continue
      }
      const existing = map.get(cityKey)
      if (existing) {
        for (const code of codes) {
          if (!existing.includes(code)) existing.push(code)
        }
      } else {
        map.set(cityKey, [...codes])
      }
    }
  }
  return map
})

const availableDeliveryPostalCodes = computed(() => {
  const city = checkoutForm.value.deliveryCity.trim().toLowerCase()
  if (!city) return []
  const codes = cityPostalCodesMap.value.get(city)
  return codes || []
})

const deliveryCityValid = computed(() => {
  const city = checkoutForm.value.deliveryCity.trim()
  if (!city) return false
  return availableDeliveryCities.value.some((c) => c.toLowerCase() === city.toLowerCase())
})

const deliveryPostalCodeValid = computed(() => {
  const postalCode = checkoutForm.value.deliveryPostalCode.trim()
  if (!postalCode) return false
  const city = checkoutForm.value.deliveryCity.trim().toLowerCase()
  if (!city) return false
  const matchingEntries = deliveryTours.value.flatMap((tour) => tour.cities.filter((entry) => entry.city.trim().toLowerCase() === city))
  if (!matchingEntries.length) return false
  if (matchingEntries.some((entry) => !entry.postalCodes)) return true
  return matchingEntries.some((entry) => {
    const allowedCodes = entry.postalCodes!.split(',').map((c) => c.trim())
    return allowedCodes.includes(postalCode)
  })
})

const filteredTours = computed(() => {
  const city = checkoutForm.value.deliveryCity.trim().toLowerCase()
  if (!city || !deliveryCityValid.value || !deliveryPostalCodeValid.value) return []
  return deliveryTours.value.filter((tour) => tour.cities.some((entry) => entry.city.trim().toLowerCase() === city))
})

const selectedDeliveryTour = computed(
  () =>
    filteredTours.value.find((tour) => tour.id === Number(checkoutForm.value.deliveryTourId)) ||
    deliveryTours.value.find((tour) => tour.id === Number(checkoutForm.value.deliveryTourId)) ||
    null,
)

const automaticTaxCheckout = computed(() => stripeTaxEnabled.value && checkoutForm.value.paymentMode === 'stripe')
const displayedUnitPriceLabel = computed(() => (automaticTaxCheckout.value ? unitPriceLabel.value : unitPriceInclTaxLabel.value))
const displayedLineTotalLabel = computed(() => (automaticTaxCheckout.value ? totalLabel.value : totalInclTaxLabel.value))
const cartTaxTotals = computed(() =>
  items.value.reduce(
    (summary, item) => {
      const totalTtc = Number(item.totalPrice || 0)
      const rate = Math.max(0, Number(item.vatRate || 0))
      const totalHt = rate > 0 ? totalTtc / (1 + rate / 100) : totalTtc
      summary.totalExclTax += totalHt
      summary.vat += totalTtc - totalHt
      return summary
    },
    { totalExclTax: 0, vat: 0 },
  ),
)
const cartTotalExclTax = computed(() => roundCurrency(cartTaxTotals.value.totalExclTax))
const cartVatAmount = computed(() => roundCurrency(cartTaxTotals.value.vat))

const onSitePickupSummary = computed(() => {
  const onSitePickup = deliveryOptions.value?.onSitePickup
  if (!onSitePickup) return ''
  const timeRange = [$formatTime(onSitePickup.startTime), $formatTime(onSitePickup.endTime)].filter(Boolean).join(' - ')
  return [onSitePickup.address, `${$formatDate(onSitePickup.nextDate)} - ${timeRange}`].filter(Boolean).join(' - ')
})
const rentalPickupSummaries = computed(() =>
  items.value
    .filter((item) => item.saleType === 'RENTAL')
    .map((item) => ({
      key: item.key,
      title: item.title,
      start: item.rentalStartDate,
      end: item.rentalEndDate,
      duration: formatRentalDuration(item),
    })),
)

const paymentConstraintNotice = computed(() => {
  if (paymentCapabilities.value.allowOnline && !paymentCapabilities.value.allowOffline) {
    return publicText(
      'checkout.cart.onlineRequiredNotice',
      'Au moins une ligne du panier est uniquement payable en ligne. Le panier entier doit donc être payé en ligne.',
    )
  }
  if (paymentCapabilities.value.allowOffline && !paymentCapabilities.value.allowOnline) {
    return publicText(
      'checkout.cart.offlineRequiredNotice',
      'Au moins une ligne du panier ne prend pas en charge le paiement en ligne. Le panier entier doit donc être réglé sur place.',
    )
  }
  return ''
})

const checkoutTaxNotice = computed(() => {
  if (automaticTaxCheckout.value)
    return publicText(
      'checkout.cart.taxNoticeAutomatic',
      'Stripe Tax calculera la TVA applicable lors du paiement en fonction des informations de facturation.',
    )
  if (cartVatAmount.value <= 0) return vatNotApplicableLabel.value
  return publicText('checkout.cart.taxNoticeIncludedAmount', 'Les prix sont TTC. Le total comprend {amount} de TVA.', {
    amount: $formatPrice(cartVatAmount.value),
  })
})

function roundCurrency(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

const deliveryValid = computed(() => {
  if (checkoutForm.value.deliveryType === 'ONSITE') return true
  if (checkoutForm.value.deliveryType === 'PICKUP') {
    return Number(checkoutForm.value.pickupPointId) > 0
  }
  if (checkoutForm.value.deliveryType === 'TOUR') {
    return (
      Number(checkoutForm.value.deliveryTourId) > 0 &&
      checkoutForm.value.deliveryAddress.trim().length > 0 &&
      checkoutForm.value.deliveryCity.trim().length > 0 &&
      checkoutForm.value.deliveryCountry.trim().length > 0 &&
      deliveryCityValid.value &&
      deliveryPostalCodeValid.value
    )
  }
  return false
})

const cartCanContinue = computed(
  () =>
    items.value.length > 0 &&
    rentalLinesValid.value &&
    (paymentCapabilities.value.allowOffline || paymentCapabilities.value.allowOnline) &&
    (depositTotal.value <= 0 || depositPaymentCapabilities.value.allowOnsite || depositPaymentCapabilities.value.allowOnline),
)
const checkoutInformationValid = computed(
  () =>
    cartCanContinue.value &&
    checkoutForm.value.customerName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutForm.value.email.trim()) &&
    checkoutForm.value.billingAddress.trim().length > 0 &&
    checkoutForm.value.billingCity.trim().length > 0 &&
    checkoutForm.value.billingPostalCode.trim().length > 0 &&
    checkoutForm.value.billingCountry.trim().length > 0 &&
    deliveryValid.value,
)
const canSubmit = computed(
  () => checkoutInformationValid.value && checkoutForm.value.acceptedTerms,
)
const checkoutSteps = computed(() => [
  { id: 'cart' as const, number: 1, label: cartStepLabel.value, to: cartPath.value, enabled: true },
  { id: 'information' as const, number: 2, label: informationStepLabel.value, to: informationPath.value, enabled: cartCanContinue.value },
  { id: 'review' as const, number: 3, label: reviewStepLabel.value, to: reviewPath.value, enabled: checkoutInformationValid.value },
])
const deliveryReviewSummary = computed(() => {
  if (checkoutForm.value.deliveryType === 'ONSITE') {
    return [onSiteDeliveryLabel.value, deliveryOptions.value?.onSitePickup?.address || noAddressLabel.value].filter(Boolean).join(' · ')
  }
  if (checkoutForm.value.deliveryType === 'PICKUP') {
    return [pickupDeliveryLabel.value, selectedPickupPoint.value?.name, selectedPickupPoint.value?.address].filter(Boolean).join(' · ')
  }
  if (checkoutForm.value.deliveryType === 'TOUR') {
    return [tourDeliveryLabel.value, checkoutForm.value.deliveryAddress, `${checkoutForm.value.deliveryPostalCode} ${checkoutForm.value.deliveryCity}`.trim(), selectedDeliveryTour.value?.name]
      .filter(Boolean)
      .join(' · ')
  }
  return deliveryPlaceholderLabel.value
})
const billingReviewSummary = computed(() => [
  checkoutForm.value.billingAddress,
  `${checkoutForm.value.billingPostalCode} ${checkoutForm.value.billingCity}`.trim(),
  checkoutForm.value.billingCountry,
].filter(Boolean).join(' · '))
const paymentReviewSummary = computed(() => `${paymentLabel.value} : ${resolvedPaymentLabel.value}`)
const checkoutDocuments = computed(() => {
  const documents = items.value.flatMap((item) => [
    ...(item.associatedDocuments || []),
    ...(item.optionSelections || [])
      .filter((option) => option.kind === 'INSURANCE' && Number(option.billingDocumentId || 0) > 0)
      .map((option) => ({
        key: `document:${option.billingDocumentId}`,
        name: option.label,
        kind: 'billingDocument' as const,
        url: `/api/shop/billing-documents/${option.billingDocumentId}/preview?productId=${encodeURIComponent(String(item.productId || ''))}&locale=${encodeURIComponent(contentLocale.value || 'fr')}`,
        documentId: option.billingDocumentId,
        billingDocumentKind: 'ASSURANCE' as const,
      })),
  ])
  return Array.from(new Map(documents.map((document) => [document.key, document])).values())
})
const rentalPartySizeLabel = computed(() => publicText('checkout.cart.rentalPartySize', 'Nombre de personnes'))

async function previewCheckoutContract(documentId: number | null | undefined) {
  if (!documentId || contractPreviewPending.value || checkoutStep.value !== 'review') return
  const previewWindow = window.open('', '_blank')
  if (!previewWindow) {
    $toast.error(publicText('checkout.steps.contractPopupBlocked', 'Autorisez les fenêtres de ce site pour consulter l’aperçu du contrat.'))
    return
  }
  contractPreviewPending.value = true
  try {
    const pdf = await $fetch<Blob>(`/api/shop/billing-documents/${documentId}/checkout-preview`, {
      method: 'POST',
      responseType: 'blob',
      body: {
        customerName: checkoutForm.value.customerName,
        email: checkoutForm.value.email,
        phone: checkoutForm.value.phone,
        billingAddress: checkoutForm.value.billingAddress,
        billingPostalCode: checkoutForm.value.billingPostalCode,
        billingCity: checkoutForm.value.billingCity,
        billingCountry: checkoutForm.value.billingCountry,
        locale: contentLocale.value,
        items: items.value,
      },
    })
    const url = URL.createObjectURL(pdf)
    previewWindow.location.href = url
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (error: any) {
    previewWindow.close()
    $toast.error(error?.data?.message || publicText('checkout.steps.contractPreviewError', 'Impossible de générer l’aperçu du contrat.'))
  } finally {
    contractPreviewPending.value = false
  }
}

watch(
  paymentCapabilities,
  (value) => {
    const currentAllowed = checkoutForm.value.paymentMode === 'stripe' ? value.allowOnline : value.allowOffline
    if (!currentAllowed) checkoutForm.value.paymentMode = value.resolvedDefaultMode
  },
  { immediate: true, deep: true },
)
watch(
  depositPaymentCapabilities,
  (value) => {
    const currentAllowed = checkoutForm.value.depositPaymentMode === 'online' ? value.allowOnline : value.allowOnsite
    if (!currentAllowed) checkoutForm.value.depositPaymentMode = value.allowOnline && !value.allowOnsite ? 'online' : 'onsite'
  },
  { immediate: true, deep: true },
)

watch(
  deliveryChoices,
  (choices) => {
    if (!choices.length) {
      checkoutForm.value.deliveryType = ''
      return
    }
    if (!choices.includes(checkoutForm.value.deliveryType)) {
      checkoutForm.value.deliveryType = choices[0] as DeliveryType
    }
  },
  { immediate: true },
)

watch(
  () => checkoutForm.value.deliveryType,
  (value) => {
    if (value !== 'PICKUP') {
      checkoutForm.value.pickupPointId = 0
    }
    if (value !== 'TOUR') {
      checkoutForm.value.deliveryTourId = 0
    }
  },
)

watch(filteredTours, (tours) => {
  if (!tours.some((tour) => tour.id === Number(checkoutForm.value.deliveryTourId))) {
    checkoutForm.value.deliveryTourId = 0
  }
})

watch(
  () => checkoutForm.value.deliveryCity,
  (newCity, oldCity) => {
    if (newCity.trim().toLowerCase() === oldCity?.trim().toLowerCase()) return
    const codes = availableDeliveryPostalCodes.value
    if (codes.length === 1 && codes[0]) {
      checkoutForm.value.deliveryPostalCode = codes[0]
    } else if (codes.length > 0 && !codes.includes(checkoutForm.value.deliveryPostalCode.trim())) {
      checkoutForm.value.deliveryPostalCode = ''
    } else if (codes.length === 0 && newCity.trim()) {
      checkoutForm.value.deliveryPostalCode = ''
    }
  },
)

watch(
  () => authStore.user,
  (user) => {
    if (!user) return
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
    if (!checkoutForm.value.customerName.trim() && fullName) {
      checkoutForm.value.customerName = fullName
    }
    if (!checkoutForm.value.email.trim() && user.email) {
      checkoutForm.value.email = user.email
    }
    if (user.billingAddress) {
      if (!checkoutForm.value.billingAddress.trim()) checkoutForm.value.billingAddress = user.billingAddress.street || ''
      if (!checkoutForm.value.billingCity.trim()) checkoutForm.value.billingCity = user.billingAddress.city || ''
      if (!checkoutForm.value.billingPostalCode.trim()) checkoutForm.value.billingPostalCode = user.billingAddress.postalCode || ''
      if (!checkoutForm.value.billingCountry.trim()) checkoutForm.value.billingCountry = user.billingAddress.country || ''
    }
    if (user.shippingAddress) {
      if (!checkoutForm.value.deliveryAddress.trim()) {
        checkoutForm.value.deliveryAddress = user.shippingAddress.street || ''
      }
      if (!checkoutForm.value.deliveryCity.trim()) {
        checkoutForm.value.deliveryCity = user.shippingAddress.city || ''
      }
      if (!checkoutForm.value.deliveryPostalCode.trim()) {
        checkoutForm.value.deliveryPostalCode = user.shippingAddress.postalCode || ''
      }
    }
  },
  { immediate: true },
)

watch(
  () => [
    checkoutForm.value.deliverySameAsBilling,
    checkoutForm.value.billingAddress,
    checkoutForm.value.billingCity,
    checkoutForm.value.billingPostalCode,
    checkoutForm.value.billingCountry,
  ] as const,
  ([sameAsBilling, address, city, postalCode, country]) => {
    if (!sameAsBilling) return
    checkoutForm.value.deliveryAddress = address
    checkoutForm.value.deliveryCity = city
    checkoutForm.value.deliveryPostalCode = postalCode
    checkoutForm.value.deliveryCountry = country
  },
  { immediate: true },
)

watch(
  checkoutForm,
  (value) => {
    if (!import.meta.client || !checkoutFormHydrated.value) return
    sessionStorage.setItem(checkoutFormStorageKey, JSON.stringify(value))
  },
  { deep: true },
)

watch(
  () => route.path,
  async () => {
    if (!import.meta.client) return
    await nextTick()
    await guardCheckoutStep()
  },
)

onMounted(async () => {
  hydrateCheckoutForm()
  if (checkoutStep.value === 'cart') checkoutForm.value.acceptedTerms = false
  await nextTick()
  if (!(await guardCheckoutStep())) return
  if (route.query.checkout === 'cancel') {
    const orderId = typeof route.query.order === 'string' ? route.query.order : ''
    if (orderId) {
      retryOrderId.value = Number(orderId) > 0 ? Number(orderId) : null
      $fetch(`/api/shop/orders/${orderId}/cancel`, { method: 'POST' }).catch(() => {})
    }
    $toast.warning(publicText('checkout.cart.paymentCancelledToast', 'Le paiement Stripe a été annulé. Vous pouvez revoir votre panier et réessayer.'))
  }
})

const updateItemQuantity = (key: string, quantity: number) => updateQuantity(key, quantity)
const removeItem = (key: string) => remove(key)

function deliveryTourSummary(tour: DeliveryOptionTour) {
  return `${$formatDate(tour.nextDate)} - ${$formatTime(tour.startTime)} - ${$formatTime(tour.endTime)}`
}

function formatVatRate(value: number) {
  const normalized = Number(value || 0)
  return `${normalized.toFixed(2)}%`
}

function formatVatBadge(value: number) {
  const normalized = Number(value || 0)
  if (normalized <= 0) return vatNotApplicableLabel.value
  return `TVA ${formatVatRate(normalized)}`
}

function formatAccessoryDuration(durationMinutes: number) {
  const hours = Number(durationMinutes || 0) / 60
  return Number.isInteger(hours) ? `${hours} h` : `${durationMinutes} min`
}

function resolveAccessoryEndDate(startDate: string, endDate: string | null | undefined, durationMinutes: number) {
  if (endDate) return endDate
  const start = new Date(startDate)
  const end = new Date(start.getTime() + Number(durationMinutes || 0) * 60000)
  return end.toISOString()
}

function requiredLabel(label: string) {
  return `${label} *`
}

async function goToCheckoutInformation() {
  if (!cartCanContinue.value) {
    $toast.error(publicText('checkout.steps.invalidCart', 'Vérifiez les périodes, les quantités et les modes de règlement du panier avant de continuer.'))
    return
  }
  await navigateCheckoutStep(informationPath.value)
}

async function goToCheckoutReview() {
  if (!checkoutInformationValid.value) {
    $toast.error(publicText('checkout.steps.incompleteInformation', 'Complétez les informations requises avant de continuer.'))
    return
  }
  if (!(await saveCheckoutAddressesToProfile())) return
  await navigateCheckoutStep(reviewPath.value)
}

async function saveCheckoutAddressesToProfile() {
  if (!authStore.user) return true
  try {
    if (checkoutForm.value.saveBillingAddress) {
      const response = await $fetch<{ user: any }>('/api/profile/billing', {
        method: 'PATCH',
        body: {
          addressLine1: checkoutForm.value.billingAddress,
          city: checkoutForm.value.billingCity,
          postalCode: checkoutForm.value.billingPostalCode,
          country: checkoutForm.value.billingCountry,
        },
      })
      if (response.user) authStore.user = response.user
    }
    if (checkoutForm.value.deliveryType === 'TOUR' && checkoutForm.value.saveShippingAddress) {
      const response = await $fetch<{ user: any }>('/api/profile/shipping', {
        method: 'PATCH',
        body: {
          addressLine1: checkoutForm.value.deliveryAddress,
          city: checkoutForm.value.deliveryCity,
          postalCode: checkoutForm.value.deliveryPostalCode,
          country: checkoutForm.value.deliveryCountry,
        },
      })
      if (response.user) authStore.user = response.user
    }
    return true
  } catch (error: any) {
    $toast.error(error?.data?.message || error?.message || publicText('checkout.cart.addressSaveError', 'Impossible d’enregistrer les adresses dans votre profil.'))
    return false
  }
}

async function navigateCheckoutStep(path: string) {
  if (stepNavigationPending.value || route.path === path) return
  stepNavigationPending.value = true
  try {
    await navigateTo(path)
  } catch {
    $toast.error(publicText('checkout.steps.navigationError', 'Impossible de changer d’étape. Veuillez réessayer.'))
  } finally {
    stepNavigationPending.value = false
  }
}

async function guardCheckoutStep() {
  if (checkoutStep.value !== 'cart' && !items.value.length) {
    await navigateTo(cartPath.value, { replace: true })
    return false
  }
  if (checkoutStep.value === 'review' && !checkoutInformationValid.value) {
    await navigateTo(informationPath.value, { replace: true })
    return false
  }
  if (checkoutStep.value === 'cart') checkoutForm.value.acceptedTerms = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
  return true
}

function hydrateCheckoutForm() {
  if (!import.meta.client || checkoutFormHydrated.value) return
  try {
    const raw = sessionStorage.getItem(checkoutFormStorageKey)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed && typeof parsed === 'object') {
      for (const key of ['customerName', 'email', 'phone', 'message', 'deliveryAddress', 'deliveryCity', 'deliveryPostalCode', 'deliveryCountry', 'billingAddress', 'billingCity', 'billingPostalCode', 'billingCountry'] as const) {
        if (typeof parsed[key] === 'string') checkoutForm.value[key] = parsed[key]
      }
      if (['ONSITE', 'PICKUP', 'TOUR'].includes(parsed.deliveryType)) checkoutForm.value.deliveryType = parsed.deliveryType
      if (parsed.paymentMode === 'offline' || parsed.paymentMode === 'stripe') checkoutForm.value.paymentMode = parsed.paymentMode
      if (parsed.depositPaymentMode === 'onsite' || parsed.depositPaymentMode === 'online') checkoutForm.value.depositPaymentMode = parsed.depositPaymentMode
      checkoutForm.value.pickupPointId = Math.max(0, Number(parsed.pickupPointId || 0))
      checkoutForm.value.deliveryTourId = Math.max(0, Number(parsed.deliveryTourId || 0))
      checkoutForm.value.acceptedTerms = parsed.acceptedTerms === true
      checkoutForm.value.deliverySameAsBilling = parsed.deliverySameAsBilling === true
      checkoutForm.value.saveBillingAddress = parsed.saveBillingAddress !== false
      checkoutForm.value.saveShippingAddress = parsed.saveShippingAddress !== false
    }
    if (checkoutForm.value.paymentMode === 'stripe' && !paymentCapabilities.value.allowOnline) checkoutForm.value.paymentMode = paymentCapabilities.value.resolvedDefaultMode
    if (checkoutForm.value.paymentMode === 'offline' && !paymentCapabilities.value.allowOffline) checkoutForm.value.paymentMode = paymentCapabilities.value.resolvedDefaultMode
    if (checkoutForm.value.depositPaymentMode === 'online' && !depositPaymentCapabilities.value.allowOnline) checkoutForm.value.depositPaymentMode = 'onsite'
    if (checkoutForm.value.depositPaymentMode === 'onsite' && !depositPaymentCapabilities.value.allowOnsite) checkoutForm.value.depositPaymentMode = 'online'
    if (!deliveryChoices.value.includes(checkoutForm.value.deliveryType)) checkoutForm.value.deliveryType = deliveryChoices.value[0] || ''
  } catch {
    sessionStorage.removeItem(checkoutFormStorageKey)
  } finally {
    checkoutFormHydrated.value = true
  }
}

function resolveCartTaxCode(item: { paymentTaxCode?: string | null }) {
  return item.paymentTaxCode?.trim() || registryDefaultTaxCode.value || ''
}

function resetCheckoutForm() {
  checkoutFormHydrated.value = false
  checkoutForm.value.message = ''
  checkoutForm.value.paymentMode = paymentCapabilities.value.resolvedDefaultMode
  checkoutForm.value.depositPaymentMode = depositPaymentCapabilities.value.allowOnline && !depositPaymentCapabilities.value.allowOnsite ? 'online' : 'onsite'
  checkoutForm.value.pickupPointId = 0
  checkoutForm.value.deliveryTourId = 0
  checkoutForm.value.acceptedTerms = false
  const firstChoice = deliveryChoices.value[0] || ''
  checkoutForm.value.deliveryType = firstChoice
  if (import.meta.client) sessionStorage.removeItem(checkoutFormStorageKey)
}

async function submitOrder() {
  if (!checkoutForm.value.customerName.trim() || !checkoutForm.value.email.trim()) {
    $toast.error(publicText('checkout.cart.requiredNameEmail', 'Le nom et l’email sont requis.'))
    return
  }

  if (!deliveryValid.value) {
    $toast.error(publicText('checkout.cart.requiredDelivery', 'Veuillez compléter les informations de livraison.'))
    return
  }

  if (!rentalLinesValid.value) {
    $toast.error(publicText('checkout.cart.requiredRentalDates', 'Veuillez renseigner les dates pour chaque ligne de location.'))
    return
  }

  if (!canSubmit.value) {
    $toast.error(unavailablePaymentLabel.value)
    return
  }

  savingOrder.value = true
  try {
    const response = await $fetch<{
      redirectUrl?: string | null
      order?: { id?: number; orderNumber?: string }
      accountProvisioning?: {
        invitationSent?: boolean
      }
    }>('/api/shop/orders', {
      method: 'POST',
      body: {
        customerName: checkoutForm.value.customerName,
        email: checkoutForm.value.email,
        language: contentLocale.value,
        retryOrderId: retryOrderId.value || undefined,
        phone: checkoutForm.value.phone,
        message: checkoutForm.value.message,
        paymentMode: checkoutForm.value.paymentMode,
        depositPaymentMode: depositTotal.value > 0 ? checkoutForm.value.depositPaymentMode : undefined,
        deliveryType: checkoutForm.value.deliveryType,
        pickupPointId: checkoutForm.value.deliveryType === 'PICKUP' ? checkoutForm.value.pickupPointId : undefined,
        deliveryTourId: checkoutForm.value.deliveryType === 'TOUR' ? checkoutForm.value.deliveryTourId : undefined,
        deliveryAddress: checkoutForm.value.deliveryType === 'TOUR' ? checkoutForm.value.deliveryAddress : undefined,
        deliveryCity: checkoutForm.value.deliveryType === 'TOUR' ? checkoutForm.value.deliveryCity : undefined,
        deliveryPostalCode: checkoutForm.value.deliveryType === 'TOUR' ? checkoutForm.value.deliveryPostalCode : undefined,
        deliveryCountry: checkoutForm.value.deliveryType === 'TOUR' ? checkoutForm.value.deliveryCountry : undefined,
        billingAddress: checkoutForm.value.billingAddress,
        billingCity: checkoutForm.value.billingCity,
        billingPostalCode: checkoutForm.value.billingPostalCode,
        billingCountry: checkoutForm.value.billingCountry,
        saveBillingAddress: checkoutForm.value.saveBillingAddress,
        saveShippingAddress: checkoutForm.value.saveShippingAddress,
        lines: items.value.map((item) => ({
          kind: item.kind,
          productId: item.productId || undefined,
          quantity: item.quantity,
          saleType: item.saleType,
          rentalStartDate: item.saleType === 'RENTAL' ? item.rentalStartDate : undefined,
          rentalEndDate: item.saleType === 'RENTAL' ? item.rentalEndDate : undefined,
          rentalPricingMode: item.saleType === 'RENTAL' ? item.rentalPricingMode : undefined,
          rentalPartySize: item.saleType === 'RENTAL' ? item.rentalPartySize : undefined,
          insuranceDocumentIds: item.saleType === 'RENTAL' ? (item.insuranceSelections || []).map((insurance) => insurance.documentId) : undefined,
          optionSelections: (item.optionSelections || []).map((option) => ({
            optionId: option.optionId,
            quantity: option.selectedQuantity,
            rentalDurationMinutes: option.rentalDurationMinutes,
            rentalStartDate: option.rentalStartDate,
          })),
        })),
      },
    })

    if (response.redirectUrl && import.meta.client) {
      window.location.href = response.redirectUrl
      return
    }

    clear()
    resetCheckoutForm()
    retryOrderId.value = null
    if (response.accountProvisioning?.invitationSent) {
      $toast.info(
        publicText('checkout.cart.accountProvisioningInfo', 'Un email vous a été envoyé pour activer votre compte et retrouver cette commande plus tard.'),
      )
    }
    $toast.success(publicText('checkout.cart.orderSuccess', 'Commande envoyée avec succès.'))
    await navigateTo(localePath({
      path: '/commande/confirmation',
      query: {
        order: String(response.order?.id || ''),
        number: response.order?.orderNumber || '',
      },
    }))
  } catch (error: any) {
    $toast.error(resolveOrderErrorMessage(error))
  } finally {
    savingOrder.value = false
  }
}

function resolveOrderErrorMessage(error: any) {
  const fallback = publicText('checkout.cart.orderError', 'Impossible de créer la commande.')
  const statusCode = Number(error?.statusCode || error?.status || error?.data?.statusCode || 0)
  if (statusCode >= 500) return fallback
  const candidates = [error?.data?.message, error?.data?.statusMessage, error?.statusMessage]
  return candidates.find((value) => typeof value === 'string' && value.trim().length > 0 && !/^(?:internal )?server error$/i.test(value.trim())) || fallback
}

function formatRentalDuration(item: (typeof items.value)[number]) {
  if (!item.rentalStartDate || !item.rentalEndDate) return ''
  const milliseconds = new Date(item.rentalEndDate).getTime() - new Date(item.rentalStartDate).getTime()
  const count = item.rentalPricingMode === 'HOURLY' ? Math.max(0, milliseconds / 3600000) : Math.max(1, Math.floor(milliseconds / 86400000) + 1)
  return publicText(
    item.rentalPricingMode === 'HOURLY' ? 'checkout.cart.rentalHourCount' : 'checkout.cart.rentalDayCount',
    item.rentalPricingMode === 'HOURLY' ? '{count} heure(s)' : '{count} jour(s)',
    { count },
  )
}
</script>
