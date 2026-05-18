<template>
  <div class="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
    <aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <div class="card border border-base-300 bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title text-lg">Structure</h2>

          <div class="mt-3 grid gap-2">
            <button
              v-for="count in SECTION_COLUMN_COUNTS"
              :key="count"
              type="button"
              class="btn btn-sm btn-outline justify-start"
              @click="addSection(count)"
            >
              <Icon name="mdi:plus" size="16" />
              {{ SECTION_COLUMN_COUNT_LABELS[count] }}
            </button>
          </div>

          <div class="menu mt-4 rounded-box bg-base-100 p-2">
            <div class="space-y-2">
              <div
                v-for="(section, index) in content.sections"
                :key="section.id"
                class="rounded-xl border border-base-300 bg-base-100 p-3"
                :class="selectedSectionId === section.id ? 'ring-2 ring-primary' : ''"
              >
                <button type="button" class="w-full cursor-pointer text-left" @click="selectSection(section.id)">
                  <div class="flex items-center justify-between gap-2">
                    <div class="font-medium">Section {{ index + 1 }}</div>
                    <span class="badge badge-sm" :class="section.enabled ? 'badge-success' : 'badge-ghost'">
                      {{ section.enabled ? 'Active' : 'Masquée' }}
                    </span>
                  </div>
                  <div class="mt-1 text-xs opacity-70">
                    {{ SECTION_COLUMN_COUNT_LABELS[section.columnCount] }}
                  </div>
                </button>

                <div class="mt-3 flex flex-wrap gap-2">
                  <button type="button" class="btn btn-xs" :disabled="index === 0" @click="moveSection(index, -1)">Monter</button>
                  <button type="button" class="btn btn-xs" :disabled="index === content.sections.length - 1" @click="moveSection(index, 1)">Descendre</button>
                  <button type="button" class="btn btn-xs btn-outline" @click="duplicateSection(index)">Dupliquer</button>
                  <button type="button" class="btn btn-xs btn-outline btn-error" @click="removeSection(index)">Supprimer</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <div v-if="selectedSection">
      <div role="tablist" class="tabs tabs-lift flex-wrap">
        <button type="button" class="tab cursor-pointer" :class="editorTab === 'section' ? 'tab-active' : 'border-0'" @click="editorTab = 'section'">
          Section
        </button>
        <button type="button" class="tab cursor-pointer" :class="editorTab === 'columns' ? 'tab-active' : 'border-0'" @click="editorTab = 'columns'">
          Colonnes
        </button>
      </div>

      <section v-if="editorTab === 'section'" class="rounded-b-box rounded-tr-box border border-base-300 bg-base-200 p-6 shadow">
        <div class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="card-title">Section</h2>
            <div class="flex flex-wrap gap-4">
              <label class="label cursor-pointer justify-start gap-2">
                <input v-model="selectedSection.enabled" type="checkbox" class="toggle toggle-primary" />
                <span class="label-text">Afficher</span>
              </label>
              <label v-if="selectedSection.columnCount === 2" class="label cursor-pointer justify-start gap-2">
                <input v-model="selectedSection.reverseOnDesktop" type="checkbox" class="toggle toggle-primary" />
                <span class="label-text">Inverser sur desktop</span>
              </label>
            </div>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <div class="form-control">
              <label class="label"><span class="label-text">Type de section</span></label>
              <select
                :value="String(selectedSection.columnCount)"
                class="select select-bordered w-full"
                @change="onSectionColumnCountChange($event)"
              >
                <option v-for="count in SECTION_COLUMN_COUNTS" :key="count" :value="String(count)">
                  {{ SECTION_COLUMN_COUNT_LABELS[count] }}
                </option>
              </select>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Identifiant technique</span></label>
              <input v-model="selectedSection.id" class="input input-bordered w-full" />
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Largeur du container</span></label>
              <select v-model="selectedSection.containerWidth" class="select select-bordered w-full">
                <option v-for="width in SECTION_CONTAINER_WIDTHS" :key="width" :value="width">
                  {{ SECTION_CONTAINER_WIDTH_LABELS[width] }}
                </option>
              </select>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">Alignement vertical des colonnes</span></label>
              <select v-model="selectedSection.contentVerticalAlign" class="select select-bordered w-full">
                <option v-for="align in VERTICAL_ALIGNS" :key="align" :value="align">{{ align }}</option>
              </select>
            </div>
          </div>

          <ThemeColorPicker v-model="selectedSection.backgroundColor" label="Fond de section" default-token="base-100" />
          <AdminPageBuilderSectionBackgroundFields :section="selectedSection" />
        </div>
      </section>

      <section v-else class="rounded-b-box rounded-tr-box border border-base-300 bg-base-200 p-6 shadow">
        <div class="space-y-4">
          <div role="tablist" class="tabs tabs-lift flex-wrap">
            <button
              v-for="(_, columnIndex) in selectedSection.columns.slice(0, selectedSection.columnCount)"
              :key="columnIndex"
              type="button"
              class="tab cursor-pointer"
              :class="sectionColumnTab === columnIndex ? 'tab-active' : ''"
              @click="sectionColumnTab = columnIndex"
            >
              Colonne {{ columnIndex + 1 }}
            </button>
          </div>

          <template v-if="selectedColumn">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="form-control">
                <label class="label"><span class="label-text">Alignement horizontal</span></label>
                <select v-model="selectedColumn.align" class="select select-bordered w-full">
                  <option v-for="align in CONTENT_ALIGNS" :key="align" :value="align">{{ align }}</option>
                </select>
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text">Alignement vertical du contenu</span></label>
                <select v-model="selectedColumn.verticalAlign" class="select select-bordered w-full">
                  <option v-for="align in VERTICAL_ALIGNS" :key="align" :value="align">{{ align }}</option>
                </select>
              </div>
            </div>

            <ThemeColorPicker
              v-model="selectedColumn.textColor"
              label="Couleur du texte de la colonne"
              default-token="base-content"
            />

            <div class="rounded-xl border border-base-300 bg-base-100 p-4">
              <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div class="font-medium">Éléments de la colonne</div>
                <div class="flex flex-wrap gap-2">
                  <button type="button" class="btn btn-xs btn-outline" @click="addColumnItem('badge')">Badge</button>
                  <button type="button" class="btn btn-xs btn-outline" @click="addColumnItem('title')">Titre</button>
                  <button type="button" class="btn btn-xs btn-outline" @click="addColumnItem('text')">Texte</button>
                  <button type="button" class="btn btn-xs btn-outline" @click="addColumnItem('buttons')">Boutons</button>
                  <button type="button" class="btn btn-xs btn-outline" @click="addColumnItem('cards')">Cartes</button>
                  <button type="button" class="btn btn-xs btn-outline" @click="addColumnItem('image')">Image</button>
                  <button type="button" class="btn btn-xs btn-outline" @click="addColumnItem('carousel')">Carousel</button>
                </div>
              </div>

              <div class="space-y-4">
                <div
                  v-for="(item, itemIndex) in selectedColumn.items"
                  :key="item.id"
                  class="rounded-xl border border-base-300 bg-base-200 p-4"
                >
                  <div class="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <button type="button" class="min-w-0 flex-1 cursor-pointer text-left" @click="toggleItemPanel(item.id)">
                      <div class="flex items-center gap-2">
                        <Icon :name="isItemPanelOpen(item.id) ? 'mdi:chevron-down' : 'mdi:chevron-right'" size="18" />
                        <div class="font-medium">{{ itemLabel(item) }}</div>
                      </div>
                      <div class="mt-1 pl-6 text-xs opacity-65">
                        {{ itemSummary(item) }}
                      </div>
                    </button>

                    <div class="flex flex-wrap gap-2">
                      <button type="button" class="btn btn-xs" :disabled="itemIndex === 0" @click="moveItem(selectedColumn.items, itemIndex, -1)">Monter</button>
                      <button type="button" class="btn btn-xs" :disabled="itemIndex === selectedColumn.items.length - 1" @click="moveItem(selectedColumn.items, itemIndex, 1)">Descendre</button>
                      <button type="button" class="btn btn-xs btn-outline" @click="duplicateColumnItem(itemIndex)">Dupliquer</button>
                      <button type="button" class="btn btn-xs btn-outline btn-error" @click="selectedColumn.items.splice(itemIndex, 1)">Supprimer</button>
                    </div>
                  </div>

                  <div v-if="isItemPanelOpen(item.id) && (item.type === 'badge' || item.type === 'title' || item.type === 'text')" class="space-y-4">
                    <AdminPageBuilderTranslationTabs
                      :model-value="item.text"
                      :label="item.type === 'badge' ? 'Badge' : item.type === 'title' ? 'Titre' : 'Texte'"
                      :size="item.size"
                      :multiline="item.type === 'text'"
                      @update:size="item.size = $event as typeof item.size"
                    />
                    <div v-if="item.type === 'title'" class="form-control">
                      <label class="label"><span class="label-text">Balise du titre</span></label>
                      <select v-model="item.headingTag" class="select select-bordered w-full">
                        <option v-for="tag in HEADING_TAGS" :key="tag" :value="tag">
                          {{ HEADING_TAG_LABELS[tag] }}
                        </option>
                      </select>
                    </div>
                    <template v-if="item.type === 'badge'">
                      <ThemeColorPicker v-model="item.backgroundColor" label="Fond du badge" default-token="primary" />
                      <ThemeColorPicker v-model="item.textColor" label="Texte du badge" default-token="primary-content" />
                      <ThemeColorPicker v-model="item.borderColor" label="Bordure du badge" default-token="primary" />
                    </template>
                  </div>

                  <div v-else-if="isItemPanelOpen(item.id) && item.type === 'buttons'" class="space-y-4">
                    <div class="rounded-xl border border-base-300 bg-base-100 p-4">
                      <div class="mb-3 flex items-center justify-between gap-2">
                        <div class="font-medium">Bouton principal</div>
                        <button v-if="!item.primaryButton" type="button" class="btn btn-xs btn-outline" @click="item.primaryButton = createEmptyButton()">
                          Ajouter
                        </button>
                        <button v-else type="button" class="btn btn-xs btn-outline btn-error" @click="item.primaryButton = null">
                          Retirer
                        </button>
                      </div>
                      <AdminPageBuilderButtonFields v-if="item.primaryButton" :button="item.primaryButton" />
                    </div>

                    <div class="rounded-xl border border-base-300 bg-base-100 p-4">
                      <div class="mb-3 flex items-center justify-between gap-2">
                        <div class="font-medium">Bouton secondaire</div>
                        <button v-if="!item.secondaryButton" type="button" class="btn btn-xs btn-outline" @click="item.secondaryButton = createEmptyButton()">
                          Ajouter
                        </button>
                        <button v-else type="button" class="btn btn-xs btn-outline btn-error" @click="item.secondaryButton = null">
                          Retirer
                        </button>
                      </div>
                      <AdminPageBuilderButtonFields v-if="item.secondaryButton" :button="item.secondaryButton" />
                    </div>
                  </div>

                  <div v-else-if="isItemPanelOpen(item.id) && item.type === 'image'" class="space-y-4">
                    <div class="form-control">
                      <label class="label"><span class="label-text">Image</span></label>
                      <ImageInput v-model="item.imageUrl" />
                    </div>

                    <AdminPageBuilderTranslationTabs :model-value="item.alt" label="Alt" />

                    <div class="grid gap-4 md:grid-cols-2">
                      <div class="form-control">
                        <label class="label"><span class="label-text">Ratio</span></label>
                        <select v-model="item.aspect" class="select select-bordered w-full">
                          <option v-for="aspect in IMAGE_ASPECTS" :key="aspect" :value="aspect">{{ aspect }}</option>
                        </select>
                      </div>

                      <div class="form-control">
                        <label class="label"><span class="label-text">Placement</span></label>
                        <select v-model="item.fit" class="select select-bordered w-full">
                          <option v-for="fit in IMAGE_FITS" :key="fit" :value="fit">{{ fit }}</option>
                        </select>
                      </div>

                      <div class="form-control">
                        <label class="label"><span class="label-text">Alignement vertical</span></label>
                        <select v-model="item.verticalAlign" class="select select-bordered w-full">
                          <option v-for="align in VERTICAL_ALIGNS" :key="align" :value="align">{{ align }}</option>
                        </select>
                      </div>
                    </div>

                    <label class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
                      <input v-model="item.framed" type="checkbox" class="toggle toggle-primary" />
                      <span class="label-text">Afficher l'image dans une carte</span>
                    </label>

                    <label class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
                      <input v-model="item.enlarge" type="checkbox" class="toggle toggle-primary" />
                      <span class="label-text">Forcer un affichage plus grand</span>
                    </label>
                  </div>

                  <div v-else-if="isItemPanelOpen(item.id) && item.type === 'cards'" class="space-y-4">
                    <div class="form-control">
                      <label class="label"><span class="label-text">Affichage des cartes</span></label>
                      <select v-model="item.display" class="select select-bordered w-full">
                        <option v-for="display in CARDS_DISPLAYS" :key="display" :value="display">
                          {{ CARDS_DISPLAY_LABELS[display] }}
                        </option>
                      </select>
                    </div>

                    <div class="flex justify-end">
                      <button
                        type="button"
                        class="btn btn-sm btn-primary"
                        @click="addCard(item.cards)"
                      >
                        Ajouter une carte
                      </button>
                    </div>

                    <div class="space-y-4">
                      <div
                        v-for="(card, cardIndex) in item.cards"
                        :key="card.id"
                        class="rounded-xl border border-base-300 bg-base-100 p-4"
                      >
                        <div class="mb-3 flex flex-wrap items-start justify-between gap-3">
                          <button type="button" class="min-w-0 flex-1 cursor-pointer text-left" @click="toggleItemPanel(card.id)">
                            <div class="flex items-center gap-2">
                              <Icon :name="isItemPanelOpen(card.id) ? 'mdi:chevron-down' : 'mdi:chevron-right'" size="18" />
                              <div class="font-medium">Carte {{ cardIndex + 1 }}</div>
                            </div>
                            <div class="mt-1 pl-6 text-xs opacity-65">
                              {{ cardSummary(card) }}
                            </div>
                          </button>
                          <div class="flex flex-wrap gap-2">
                            <button type="button" class="btn btn-xs" :disabled="cardIndex === 0" @click="moveItem(item.cards, cardIndex, -1)">Monter</button>
                            <button type="button" class="btn btn-xs" :disabled="cardIndex === item.cards.length - 1" @click="moveItem(item.cards, cardIndex, 1)">Descendre</button>
                            <button type="button" class="btn btn-xs btn-outline" @click="duplicateCard(item.cards, cardIndex)">Dupliquer</button>
                            <button type="button" class="btn btn-xs btn-outline btn-error" @click="item.cards.splice(cardIndex, 1)">Supprimer</button>
                          </div>
                        </div>
                        <AdminPageBuilderCardFields v-if="isItemPanelOpen(card.id)" :card="card" />
                      </div>
                    </div>
                  </div>

                  <div v-else-if="isItemPanelOpen(item.id) && item.type === 'carousel'" class="space-y-4">
                    <AdminPageBuilderCarouselFields :carousel="item" />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import ThemeColorPicker from '~/components/admin/ThemeColorPicker.vue'
import AdminPageBuilderButtonFields from '~/components/admin/page-builder/ButtonFields.vue'
import AdminPageBuilderCarouselFields from '~/components/admin/page-builder/CarouselFields.vue'
import AdminPageBuilderCardFields from '~/components/admin/page-builder/CardFields.vue'
import AdminPageBuilderSectionBackgroundFields from '~/components/admin/page-builder/SectionBackgroundFields.vue'
import AdminPageBuilderTranslationTabs from '~/components/admin/page-builder/TranslationTabs.vue'
import type { PageBuilderCard, PageBuilderColumn, PageBuilderColumnItem, PageBuilderContent, SectionColumnCount } from '~/shared/pageBuilder'
import {
  CARDS_DISPLAY_LABELS,
  CARDS_DISPLAYS,
  CONTENT_ALIGNS,
  createBadgeItem,
  createButtonsItem,
  createCarouselItem,
  createCardsItem,
  createEmptyButton,
  createEmptyCard,
  createEmptyColumnsSection,
  createEmptyContentBlock,
  createImageItem,
  createTextItem,
  createTitleItem,
  duplicatePageBuilderCard,
  duplicatePageBuilderItem,
  duplicatePageBuilderSection,
  HEADING_TAG_LABELS,
  HEADING_TAGS,
  IMAGE_ASPECTS,
  IMAGE_FITS,
  SECTION_COLUMN_COUNTS,
  SECTION_COLUMN_COUNT_LABELS,
  SECTION_CONTAINER_WIDTH_LABELS,
  SECTION_CONTAINER_WIDTHS,
  VERTICAL_ALIGNS
} from '~/shared/pageBuilder'
import ImageInput from '~/components/ImageInput.vue'

const props = defineProps<{
  content: PageBuilderContent
}>()

const selectedSectionId = ref(props.content.sections[0]?.id || '')
const sectionColumnTab = ref(0)
const editorTab = ref<'section' | 'columns'>('section')
const openPanelIds = ref<string[]>([])

const selectedSection = computed(() =>
  props.content.sections.find(section => section.id === selectedSectionId.value) ?? null
)

const selectedColumn = computed<PageBuilderColumn | null>(() => {
  if (!selectedSection.value) return null
  return selectedSection.value.columns[sectionColumnTab.value] ?? null
})

watch(() => props.content.sections.length, () => {
  if (!props.content.sections.length) {
    selectedSectionId.value = ''
    return
  }
  if (!props.content.sections.some(section => section.id === selectedSectionId.value)) {
    selectedSectionId.value = props.content.sections[0]?.id || ''
    sectionColumnTab.value = 0
  }
}, { immediate: true })

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`

const selectSection = (id: string) => {
  selectedSectionId.value = id
  sectionColumnTab.value = 0
  editorTab.value = 'section'
}

const addSection = (count: SectionColumnCount) => {
  const section = createEmptyColumnsSection(createId('section'), count)
  props.content.sections.push(section)
  selectSection(section.id)
}

const moveItem = <T,>(list: T[], index: number, direction: -1 | 1) => {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= list.length) return
  const [item] = list.splice(index, 1)
  if (!item) return
  list.splice(nextIndex, 0, item)
}

const moveSection = (index: number, direction: -1 | 1) => {
  moveItem(props.content.sections, index, direction)
}

const duplicateSection = (index: number) => {
  const section = props.content.sections[index]
  if (!section) return
  const clone = duplicatePageBuilderSection(section)
  props.content.sections.splice(index + 1, 0, clone)
  selectSection(clone.id)
}

const removeSection = (index: number) => {
  const removed = props.content.sections[index]
  if (!removed) return
  props.content.sections.splice(index, 1)
  if (!props.content.sections.length) {
    selectedSectionId.value = ''
    return
  }
  if (selectedSectionId.value === removed.id) {
    selectedSectionId.value = props.content.sections[Math.max(0, index - 1)]?.id || props.content.sections[0]?.id || ''
    sectionColumnTab.value = 0
  }
}

const onSectionColumnCountChange = (event: Event) => {
  if (!selectedSection.value) return
  const count = Number((event.target as HTMLSelectElement).value) as SectionColumnCount
  selectedSection.value.columnCount = count
  while (selectedSection.value.columns.length < count) {
    selectedSection.value.columns.push(createEmptyContentBlock())
  }
  selectedSection.value.columns = selectedSection.value.columns.slice(0, count)
  sectionColumnTab.value = Math.min(sectionColumnTab.value, count - 1)
}

const addColumnItem = (type: PageBuilderColumnItem['type']) => {
  if (!selectedColumn.value) return
  let newId = ''
  switch (type) {
    case 'badge':
      newId = createId('badge')
      selectedColumn.value.items.push(createBadgeItem(newId))
      break
    case 'title':
      newId = createId('title')
      selectedColumn.value.items.push(createTitleItem(newId))
      break
    case 'text':
      newId = createId('text')
      selectedColumn.value.items.push(createTextItem(newId))
      break
    case 'buttons':
      newId = createId('buttons')
      selectedColumn.value.items.push(createButtonsItem(newId))
      break
    case 'cards':
      newId = createId('cards')
      selectedColumn.value.items.push(createCardsItem(newId))
      break
    case 'image':
      newId = createId('image')
      selectedColumn.value.items.push(createImageItem(newId))
      break
    case 'carousel':
      newId = createId('carousel')
      selectedColumn.value.items.push(createCarouselItem(newId))
      break
  }
  if (newId) openPanel(newId)
}

const duplicateColumnItem = (index: number) => {
  if (!selectedColumn.value) return
  const item = selectedColumn.value.items[index]
  if (!item) return
  const clone = duplicatePageBuilderItem(item)
  selectedColumn.value.items.splice(index + 1, 0, clone)
  openPanel(clone.id)
  if (clone.type === 'cards') {
    clone.cards.forEach(card => openPanel(card.id))
  }
}

const itemLabel = (item: PageBuilderColumnItem) => {
  switch (item.type) {
    case 'badge': return 'Badge'
    case 'title': return 'Titre'
    case 'text': return 'Texte'
    case 'buttons': return 'Boutons'
    case 'cards': return 'Cartes'
    case 'image': return 'Image'
    case 'carousel': return 'Carousel'
  }
}

const openPanel = (id: string) => {
  if (!openPanelIds.value.includes(id)) {
    openPanelIds.value = [...openPanelIds.value, id]
  }
}

const isItemPanelOpen = (id: string) => openPanelIds.value.includes(id)

const toggleItemPanel = (id: string) => {
  if (isItemPanelOpen(id)) {
    openPanelIds.value = openPanelIds.value.filter(panelId => panelId !== id)
    return
  }
  openPanel(id)
}

const itemSummary = (item: PageBuilderColumnItem) => {
  switch (item.type) {
    case 'badge':
    case 'title':
    case 'text':
      return item.text.fr || item.text.en || 'Sans contenu'
    case 'buttons':
      return [
        item.primaryButton?.label.fr || item.primaryButton?.label.en || '',
        item.secondaryButton?.label.fr || item.secondaryButton?.label.en || ''
      ].filter(Boolean).join(' • ') || 'Aucun bouton'
    case 'image':
      return item.imageUrl || 'Image vide'
    case 'cards':
      return `${item.cards.length} carte${item.cards.length > 1 ? 's' : ''}`
    case 'carousel':
      return `${item.slides.filter(slide => slide.imageUrl.trim()).length} slide${item.slides.filter(slide => slide.imageUrl.trim()).length > 1 ? 's' : ''}`
  }
}

const cardSummary = (card: { title: { fr: string, en: string }, text: { fr: string, en: string } }) =>
  card.title.fr || card.title.en || card.text.fr || card.text.en || 'Carte sans contenu'

const addCard = (cards: Array<{ id: string }>) => {
  const newId = createId('card')
  cards.push(createEmptyCard(newId))
  openPanel(newId)
}

const duplicateCard = (cards: PageBuilderCard[], index: number) => {
  const card = cards[index]
  if (!card) return
  const clone = duplicatePageBuilderCard(card)
  cards.splice(index + 1, 0, clone)
  openPanel(clone.id)
}

watch(selectedColumn, (column) => {
  if (!column) return
  openPanelIds.value = []
}, { immediate: true })
</script>
