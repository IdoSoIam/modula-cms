<template>
  <div class="card bg-base-100 p-6">
    <div class="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.vegetablesPage.title') }}</h1>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.vegetablesPage.description') }}</p>
      </div>
      <button class="btn btn-primary" @click="openNew">
        <Icon name="mdi:plus" size="20" /> {{ t('admin.vegetablesPage.new') }}
      </button>
    </div>

    <div v-if="pending" class="loading loading-spinner" />

    <div v-else class="overflow-x-auto rounded-box">
      <table class="table">
        <thead>
          <tr>
            <th class="w-16"></th>
            <th>{{ t('admin.vegetablesPage.headers.name') }}</th>
            <th>{{ t('admin.vegetablesPage.headers.slug') }}</th>
            <th>{{ t('admin.vegetablesPage.headers.category') }}</th>
            <th class="text-right">{{ t('admin.vegetablesPage.headers.price') }}</th>
            <th class="text-right">{{ t('admin.vegetablesPage.headers.vatRate') }}</th>
            <th class="text-right">{{ t('admin.vegetablesPage.fieldAvailable') }}</th>
            <th>{{ t('admin.vegetablesPage.headers.saleType') }}</th>
            <th>{{ t('admin.vegetablesPage.headers.unit') }}</th>
            <th>{{ t('admin.vegetablesPage.headers.status') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>
              <AppImage v-if="product.imageUrl" :src="product.imageUrl" :alt="getLocalizedProductName(product)" class="h-12 w-12 rounded object-cover" sizes="48px" />
              <div v-else class="flex h-12 w-12 items-center justify-center rounded bg-base-300">
                <Icon name="mdi:image-off-outline" size="18" class="opacity-40" />
              </div>
            </td>
            <td class="font-medium">{{ getLocalizedProductName(product) }}</td>
            <td><code>{{ product.slug }}</code></td>
            <td>{{ product.category?.name || '-' }}</td>
            <td class="text-right">{{ $formatPrice(product.price) }}</td>
            <td class="text-right">{{ formatVatRate(product.vatRate) }}</td>
            <td class="text-right">{{ product.stock }}</td>
            <td>{{ product.saleType === 'RENTAL' ? t('admin.vegetablesPage.saleTypeRental') : t('admin.vegetablesPage.saleTypeSale') }}</td>
            <td>{{ getLocalizedUnitLabel(product) || '-' }}</td>
            <td>
              <span class="badge" :class="product.active ? 'badge-success' : 'badge-ghost'">
                {{ product.active ? t('admin.vegetablesPage.active') : t('admin.vegetablesPage.inactive') }}
              </span>
            </td>
            <td class="text-right">
              <button class="btn btn-ghost btn-sm" @click="openEdit(product)">
                <Icon name="mdi:pencil" size="16" />
              </button>
              <button class="btn btn-ghost btn-sm text-error" @click="remove(product)">
                <Icon name="mdi:delete" size="16" />
              </button>
            </td>
          </tr>
          <tr v-if="!products?.length">
            <td colspan="11" class="py-8 text-center opacity-60">
              {{ t('admin.vegetablesPage.empty') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { pickCmsLocalizedText } from '#modula/shared/cms'
import type { ProductPayload } from '#modula/server/utils/shop'
import { getAdminRoutePath, normalizeAdminRouteLocale } from '#modula/shared/adminRoutes'

const { data: products, pending, refresh } = await useFetch<ProductPayload[]>('/api/admin/products')

const { locale, t } = useI18n()
const localePath = useLocalePath()
const { $toast } = useNuxtApp() as any
const productsBasePath = computed(() => getAdminRoutePath('shopProducts', normalizeAdminRouteLocale(locale.value)))

const formatVatRate = (value: number) => `${Number(value || 0).toFixed(2)}%`
const getLocalizedProductName = (product: ProductPayload) => pickCmsLocalizedText(locale.value, product.nameLocalized) || product.name
const getLocalizedUnitLabel = (product: ProductPayload) => pickCmsLocalizedText(locale.value, product.unitLabelLocalized) || product.unitLabel || ''

const openNew = () => navigateTo(localePath(`${productsBasePath.value}/new`))
const openEdit = (product: ProductPayload) => navigateTo(localePath(`${productsBasePath.value}/${product.id}`))

const remove = async (product: ProductPayload) => {
  if (!confirm(t('admin.vegetablesPage.deleteConfirm', { name: getLocalizedProductName(product) }))) return
  try {
    await $fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' })
    await refresh()
  } catch (error: any) {
    $toast.error(error?.statusMessage || t('common.error'))
  }
}
</script>
