<template>
  <div class="space-y-4">
    <div v-if="hasToolbar" class="flex flex-wrap items-center gap-3">
      <div v-if="searchable" class="relative min-w-64 flex-1 sm:max-w-sm">
        <Icon name="mdi:magnify" size="18" class="pointer-events-none absolute z-1 left-3 top-1/2 -translate-y-1/2 opacity-50" />
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

      <slot name="toolbar" :search="debouncedSearch" :rows="sortedFilteredData" />
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

        <tbody v-if="!loading && sortedFilteredData.length">
          <tr
            v-for="(row, rowIndex) in sortedFilteredData"
            :key="rowKey(row, rowIndex)"
            :class="rowClass"
            @click="handleRowClick(row)"
          >
            <td
              v-for="col in renderedColumns"
              :key="col.key"
              :class="cellClass(col)"
            >
              <slot :name="`cell(${col.key})`" :row="row" :value="resolveValue(row, col.key)" :column="col">
                {{ formatValue(resolveValue(row, col.key)) }}
              </slot>
            </td>
          </tr>
        </tbody>

        <tbody v-else-if="loading">
          <tr v-for="rowIndex in skeletonRows" :key="rowIndex">
            <td
              v-for="(col, colIndex) in renderedColumns"
              :key="col.key"
              :class="cellClass(col)"
            >
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
  </div>
</template>

<script setup lang="ts" generic="Row extends Record<string, unknown> = Record<string, unknown>">
interface Column {
  key: string
  label: string
  sortable?: boolean
  hideable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<TableRow extends Record<string, unknown>> {
  columns: Column[]
  data: TableRow[]
  keyField?: string
  searchable?: boolean
  searchFields?: string[]
  columnsConfigurable?: boolean
  sortable?: boolean
  loading?: boolean
  emptyText?: string
  rowClickable?: boolean
}

type SortDirection = 'asc' | 'desc'
type SortState = {
  key: string
  direction: SortDirection
}

type DataTableSlots<TableRow extends Record<string, unknown>> = {
  toolbar?: (props: { search: string; rows: TableRow[] }) => unknown
} & {
  [slotName: `cell(${string})`]: (props: { row: TableRow; value: unknown; column: Column }) => unknown
}

const props = withDefaults(defineProps<DataTableProps<Row>>(), {
  keyField: 'id',
  searchable: true,
  columnsConfigurable: true,
  sortable: true,
  loading: false,
  emptyText: 'Aucune donnée',
  rowClickable: false
})

const emit = defineEmits<{
  'row-click': [row: Row]
  'update:search': [value: string]
}>()

const slots = defineSlots<DataTableSlots<Row>>()

const searchInput = ref('')
const debouncedSearch = ref('')
const hiddenColumnKeys = ref<Set<string>>(new Set())
const sortState = ref<SortState | null>(null)
const skeletonRows = [1, 2, 3, 4, 5]
const skeletonWidths = ['w-20', 'w-24', 'w-28', 'w-32', 'w-40', 'w-48']

let searchDebounce: ReturnType<typeof setTimeout> | undefined

const renderedColumns = computed(() => props.columns)
const hideableColumns = computed(() => props.columns.filter(col => col.hideable !== false))
const showColumnToggle = computed(() => props.columnsConfigurable && hideableColumns.value.length > 0)
const hasToolbar = computed(() => props.searchable || showColumnToggle.value || Boolean(slots.toolbar))
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

const sortedFilteredData = computed(() => {
  if (!sortState.value || !props.sortable) {
    return filteredData.value
  }

  const direction = sortState.value.direction === 'asc' ? 1 : -1
  const sortKey = sortState.value.key

  return [...filteredData.value].sort((left, right) => compareValues(
    resolveValue(left, sortKey),
    resolveValue(right, sortKey)
  ) * direction)
})

const rowClass = computed(() => ({
  'cursor-pointer hover:bg-base-200/70': props.rowClickable
}))

watch(searchInput, (value) => {
  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }

  searchDebounce = setTimeout(() => {
    debouncedSearch.value = value
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

onBeforeUnmount(() => {
  if (searchDebounce) {
    clearTimeout(searchDebounce)
  }
})

const resolveValue = (row: Row, key: string): unknown => row[key]

const isColumnVisible = (col: Column) => !hiddenColumnKeys.value.has(col.key)

const toggleColumn = (col: Column) => {
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

const supportsSorting = (col: Column) => {
  if (col.sortable !== undefined) {
    return col.sortable
  }

  const sample = props.data
    .map(row => resolveValue(row, col.key))
    .find(value => value !== null && value !== undefined)

  return sample === undefined || typeof sample === 'string' || typeof sample === 'number'
}

const isSortableColumn = (col: Column) => props.sortable && supportsSorting(col)

const toggleSort = (col: Column) => {
  if (!isSortableColumn(col)) {
    return
  }

  if (sortState.value?.key !== col.key) {
    sortState.value = { key: col.key, direction: 'asc' }
    return
  }

  if (sortState.value.direction === 'asc') {
    sortState.value = { key: col.key, direction: 'desc' }
    return
  }

  sortState.value = null
}

const compareValues = (left: unknown, right: unknown) => {
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

const clearSearch = () => {
  searchInput.value = ''
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

const alignmentClass = (col: Column) => {
  if (col.align === 'center') {
    return 'text-center'
  }

  if (col.align === 'right') {
    return 'text-right'
  }

  return 'text-left'
}

const hiddenClass = (col: Column) => isColumnVisible(col) ? '' : 'hidden'

const headerClass = (col: Column) => [
  alignmentClass(col),
  hiddenClass(col),
  isSortableColumn(col) ? 'cursor-pointer select-none' : ''
]

const cellClass = (col: Column) => [alignmentClass(col), hiddenClass(col)]

const columnStyle = (col: Column) => col.width ? { width: col.width } : undefined

const ariaSort = (col: Column) => {
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
