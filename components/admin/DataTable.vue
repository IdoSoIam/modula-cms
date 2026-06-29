<template>
  <div class="space-y-4">
    <div v-if="hasToolbar" class="flex flex-wrap items-center gap-3">
      <div v-if="searchable" class="relative min-w-64 flex-1 sm:max-w-sm">
        <Icon name="mdi:magnify" size="18" class="pointer-events-none absolute left-3 top-1/2 z-1 -translate-y-1/2 opacity-50" />
        <input
          v-model="searchInput"
          type="search"
          class="input input-bordered input-sm w-full pl-9 pr-10"
          placeholder="Rechercher"
          aria-label="Rechercher dans le tableau"
        />
        <button
          v-if="searchInput"
          type="button"
          class="btn btn-ghost btn-circle btn-xs absolute right-2 top-1/2 -translate-y-1/2"
          aria-label="Effacer la recherche"
          @click="clearSearch"
        >
          <Icon name="mdi:close" size="16" />
        </button>
      </div>

      <div v-if="showPageSizeSelector" class="form-control flex gap-2">
        <label class="text-xs opacity-70">Par page</label>
        <select v-model.number="pageSizeModel" class="select select-bordered select-sm min-w-24">
          <option v-for="size in normalizedPageSizeOptions" :key="size" :value="size">
            {{ size }}
          </option>
        </select>
      </div>

      <div v-if="showColumnToggle" class="dropdown dropdown-end">
        <button tabindex="0" type="button" class="btn btn-sm btn-ghost">
          <Icon name="mdi:view-column-outline" size="18" />
          Colonnes
        </button>
        <ul tabindex="0" class="menu dropdown-content z-20 mt-2 w-60 rounded-box border border-base-300 bg-base-100 p-2 shadow-xl">
          <li v-for="col in hideableColumns" :key="col.key">
            <label class="label cursor-pointer justify-start gap-3 rounded-lg px-2 py-2">
              <input
                type="checkbox"
                class="checkbox checkbox-primary checkbox-sm"
                :checked="isColumnVisible(col)"
                @change="toggleColumn(col)"
              />
              <span class="label-text">{{ col.label }}</span>
            </label>
          </li>
        </ul>
      </div>

      <slot
        name="toolbar"
        :search="debouncedSearch"
        :rows="sortedFilteredData"
        :visible-rows="displayedRows"
        :page="currentPage"
        :page-size="pageSizeModel"
        :total-pages="totalPages"
      />
    </div>

    <div class="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th
              v-for="col in renderedColumns"
              :key="col.key"
              :style="columnStyle(col)"
              :class="headerClass(col)"
              :aria-sort="ariaSort(col)"
              @click="toggleSort(col)"
            >
              <span class="inline-flex items-center gap-1">
                <span>{{ col.label }}</span>
                <Icon v-if="sortState?.key === col.key && sortState.direction === 'asc'" name="mdi:arrow-up" size="16" />
                <Icon v-else-if="sortState?.key === col.key && sortState.direction === 'desc'" name="mdi:arrow-down" size="16" />
              </span>
            </th>
          </tr>
        </thead>

        <tbody v-if="!loading && displayedRows.length">
          <tr
            v-for="(row, rowIndex) in displayedRows"
            :key="rowKey(row, rowIndex)"
            :class="rowClass"
            @click="handleRowClick(row)"
          >
            <td v-for="col in renderedColumns" :key="col.key" :class="cellClass(col)">
              <slot :name="`cell(${col.key})`" :row="row" :value="resolveValue(row, col.key)" :column="col">
                {{ formatValue(resolveValue(row, col.key)) }}
              </slot>
            </td>
          </tr>
        </tbody>

        <tbody v-else-if="loading">
          <tr v-for="rowIndex in skeletonRows" :key="rowIndex">
            <td v-for="(col, colIndex) in renderedColumns" :key="col.key" :class="cellClass(col)">
              <div class="skeleton h-4" :class="skeletonWidthClass(rowIndex + colIndex)" />
            </td>
          </tr>
        </tbody>

        <tbody v-else>
          <tr>
            <td :colspan="emptyColspan" class="py-8 text-center opacity-50">
              {{ emptyText }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showPagination" class="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span>
        {{ paginationSummary }}
      </span>

      <div class="flex flex-wrap items-center gap-2">
        <div class="join">
          <button type="button" class="btn btn-sm join-item" :disabled="currentPage <= 1" @click="currentPage--">
            Précédent
          </button>
          <button type="button" class="btn btn-sm join-item no-animation pointer-events-none">
            {{ currentPage }} / {{ totalPages }}
          </button>
          <button type="button" class="btn btn-sm join-item" :disabled="currentPage >= totalPages" @click="currentPage++">
            Suivant
          </button>
        </div>

        <label class="form-control flex flex-row items-center gap-2">
          <span class="text-xs opacity-70">Aller à</span>
          <input
            v-model="pageInput"
            type="number"
            min="1"
            :max="String(totalPages)"
            class="input input-bordered input-sm w-20"
            @keydown.enter.prevent="applyPageInput"
            @blur="applyPageInput"
          />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" generic="Row extends Record<string, unknown> = Record<string, unknown>">
interface Column<TableRow extends Record<string, unknown> = Record<string, unknown>> {
  key: string
  label: string
  sortable?: boolean
  hideable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  sortValue?: (row: TableRow) => unknown
}

interface InitialSort {
  key: string
  direction: 'asc' | 'desc'
}

interface DataTableProps<TableRow extends Record<string, unknown>> {
  columns: Column<TableRow>[]
  data: TableRow[]
  keyField?: string
  searchable?: boolean
  searchFields?: string[]
  columnsConfigurable?: boolean
  sortable?: boolean
  loading?: boolean
  emptyText?: string
  rowClickable?: boolean
  paginated?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  initialSort?: InitialSort | null
}

type SortDirection = 'asc' | 'desc'
type SortState = {
  key: string
  direction: SortDirection
}

type DataTableSlots<TableRow extends Record<string, unknown>> = {
  toolbar?: (props: {
    search: string
    rows: TableRow[]
    visibleRows: TableRow[]
    page: number
    pageSize: number
    totalPages: number
  }) => unknown
} & {
  [slotName: `cell(${string})`]: (props: { row: TableRow; value: unknown; column: Column<TableRow> }) => unknown
}

const props = withDefaults(defineProps<DataTableProps<Row>>(), {
  keyField: 'id',
  searchable: true,
  columnsConfigurable: true,
  sortable: true,
  loading: false,
  emptyText: 'Aucune donnée',
  rowClickable: false,
  paginated: true,
  pageSize: 10,
  pageSizeOptions: () => [10, 20, 50, 100],
  initialSort: null,
})

const emit = defineEmits<{
  'row-click': [row: Row]
  'update:search': [value: string]
}>()

const slots = defineSlots<DataTableSlots<Row>>()

const searchInput = ref('')
const debouncedSearch = ref('')
const hiddenColumnKeys = ref<Set<string>>(new Set())
const sortState = ref<SortState | null>(props.initialSort ? { ...props.initialSort } : null)
const currentPage = ref(1)
const pageInput = ref('1')
const pageSizeModel = ref(props.pageSize)
const skeletonRows = [1, 2, 3, 4, 5]
const skeletonWidths = ['w-20', 'w-24', 'w-28', 'w-32', 'w-40', 'w-48']

let searchDebounce: ReturnType<typeof setTimeout> | undefined

const renderedColumns = computed(() => props.columns)
const hideableColumns = computed(() => props.columns.filter(col => col.hideable !== false))
const normalizedPageSizeOptions = computed(() => {
  const values = Array.from(new Set([...(props.pageSizeOptions || []), pageSizeModel.value]))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((left, right) => left - right)
  return values.length ? values : [10, 20, 50, 100]
})
const showPageSizeSelector = computed(() => props.paginated && normalizedPageSizeOptions.value.length > 1)
const showColumnToggle = computed(() => props.columnsConfigurable && hideableColumns.value.length > 0)
const hasToolbar = computed(() => props.searchable || showColumnToggle.value || showPageSizeSelector.value || Boolean(slots.toolbar))
const emptyColspan = computed(() => Math.max(renderedColumns.value.length, 1))

const searchFieldKeys = computed(() => {
  if (props.searchFields?.length) {
    return props.searchFields
  }

  return props.columns
    .filter(col => props.data.some(row => typeof resolveValue(row, col.key) === 'string'))
    .map(col => col.key)
})

const filteredData = computed(() => {
  const query = debouncedSearch.value.trim().toLowerCase()

  if (!query || !props.searchable) {
    return props.data
  }

  return props.data.filter(row => searchFieldKeys.value.some((key) => {
    const value = resolveValue(row, key)
    return typeof value === 'string' && value.toLowerCase().includes(query)
  }))
})

function compareValues(left: unknown, right: unknown) {
  if (left === right) {
    return 0
  }

  if (left === null || left === undefined) {
    return 1
  }

  if (right === null || right === undefined) {
    return -1
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: 'base'
  })
}

const sortedFilteredData = computed(() => {
  if (!sortState.value || !props.sortable) {
    return filteredData.value
  }

  const direction = sortState.value.direction === 'asc' ? 1 : -1
  const sortKey = sortState.value.key
  const column = props.columns.find(item => item.key === sortKey)

  return [...filteredData.value].sort((left, right) => {
    const leftValue = column?.sortValue ? column.sortValue(left) : resolveValue(left, sortKey)
    const rightValue = column?.sortValue ? column.sortValue(right) : resolveValue(right, sortKey)
    return compareValues(leftValue, rightValue) * direction
  })
})

const totalPages = computed(() => {
  if (!props.paginated) return 1
  return Math.max(1, Math.ceil(sortedFilteredData.value.length / pageSizeModel.value))
})

const displayedRows = computed(() => {
  if (!props.paginated) return sortedFilteredData.value
  const start = (currentPage.value - 1) * pageSizeModel.value
  return sortedFilteredData.value.slice(start, start + pageSizeModel.value)
})

const paginationSummary = computed(() => {
  if (!sortedFilteredData.value.length) {
    return '0-0 sur 0'
  }
  const from = ((currentPage.value - 1) * pageSizeModel.value) + 1
  const to = Math.min(currentPage.value * pageSizeModel.value, sortedFilteredData.value.length)
  return `${from}-${to} sur ${sortedFilteredData.value.length}`
})

const showPagination = computed(() => props.paginated && totalPages.value > 1)

const rowClass = computed(() => ({
  'cursor-pointer hover:bg-base-200/70': props.rowClickable
}))

watch(searchInput, (value) => {
  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }

  searchDebounce = setTimeout(() => {
    debouncedSearch.value = value
    currentPage.value = 1
    pageInput.value = '1'
    emit('update:search', value)
  }, 200)
})

watch(() => props.columns, (columns) => {
  const columnKeys = new Set(columns.map(col => col.key))
  hiddenColumnKeys.value = new Set([...hiddenColumnKeys.value].filter(key => columnKeys.has(key)))
}, { deep: true })

watch(() => props.sortable, (sortable) => {
  if (!sortable) {
    sortState.value = null
  }
})

watch(() => props.initialSort, (value) => {
  sortState.value = value ? { ...value } : null
}, { deep: true })

watch(() => props.pageSize, (value) => {
  if (Number.isFinite(value) && value > 0) {
    pageSizeModel.value = value
  }
})

watch([sortedFilteredData, pageSizeModel], () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
  pageInput.value = String(currentPage.value)
}, { immediate: true })

watch(currentPage, (value) => {
  pageInput.value = String(value)
})

onBeforeUnmount(() => {
  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }
})

const resolveValue = (row: Row, key: string): unknown => row[key]

const isColumnVisible = (col: Column<Row>) => !hiddenColumnKeys.value.has(col.key)

const toggleColumn = (col: Column<Row>) => {
  if (col.hideable === false) {
    return
  }

  const nextHiddenColumnKeys = new Set(hiddenColumnKeys.value)

  if (nextHiddenColumnKeys.has(col.key)) {
    nextHiddenColumnKeys.delete(col.key)
  } else {
    nextHiddenColumnKeys.add(col.key)
  }

  hiddenColumnKeys.value = nextHiddenColumnKeys
}

const supportsSorting = (col: Column<Row>) => {
  if (col.sortable !== undefined) {
    return col.sortable
  }

  if (col.sortValue) return true

  const sample = props.data
    .map(row => resolveValue(row, col.key))
    .find(value => value !== null && value !== undefined)

  return sample === undefined || typeof sample === 'string' || typeof sample === 'number'
}

const isSortableColumn = (col: Column<Row>) => props.sortable && supportsSorting(col)

const toggleSort = (col: Column<Row>) => {
  if (!isSortableColumn(col)) {
    return
  }

  if (sortState.value?.key !== col.key) {
    sortState.value = { key: col.key, direction: 'asc' }
    currentPage.value = 1
    return
  }

  if (sortState.value.direction === 'asc') {
    sortState.value = { key: col.key, direction: 'desc' }
    currentPage.value = 1
    return
  }

  sortState.value = null
}

const clearSearch = () => {
  searchInput.value = ''
}

const applyPageInput = () => {
  const nextValue = Number(pageInput.value)
  if (!Number.isFinite(nextValue)) {
    pageInput.value = String(currentPage.value)
    return
  }

  currentPage.value = Math.min(Math.max(1, Math.round(nextValue)), totalPages.value)
}

const formatValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Date) {
    return value.toLocaleDateString('fr-FR')
  }

  return String(value)
}

const alignmentClass = (col: Column<Row>) => {
  if (col.align === 'center') {
    return 'text-center'
  }

  if (col.align === 'right') {
    return 'text-right'
  }

  return 'text-left'
}

const hiddenClass = (col: Column<Row>) => isColumnVisible(col) ? '' : 'hidden'

const headerClass = (col: Column<Row>) => [
  alignmentClass(col),
  hiddenClass(col),
  isSortableColumn(col) ? 'cursor-pointer select-none' : ''
]

const cellClass = (col: Column<Row>) => [alignmentClass(col), hiddenClass(col)]

const columnStyle = (col: Column<Row>) => col.width ? { width: col.width } : undefined

const ariaSort = (col: Column<Row>) => {
  if (sortState.value?.key !== col.key) {
    return 'none'
  }

  return sortState.value.direction === 'asc' ? 'ascending' : 'descending'
}

const rowKey = (row: Row, index: number) => {
  const value = resolveValue(row, props.keyField)

  if (typeof value === 'string' || typeof value === 'number') {
    return value
  }

  return index
}

const handleRowClick = (row: Row) => {
  if (props.rowClickable) {
    emit('row-click', row)
  }
}

const skeletonWidthClass = (index: number) => skeletonWidths[index % skeletonWidths.length]
</script>
