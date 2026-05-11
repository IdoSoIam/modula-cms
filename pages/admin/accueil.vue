<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Accueil</h1>
        <p class="mt-1 text-sm opacity-70">
          Personnalisez la page d'accueil par sections, colonnes et éléments.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/" target="_blank" class="btn btn-outline">Voir la page</NuxtLink>
        <NuxtLink to="/?editPage=1" target="_blank" class="btn btn-outline btn-primary">Editer sur la page</NuxtLink>
        <button class="btn btn-warning btn-outline" :disabled="saving || pending || !content" @click="resetColors">
          <span v-if="resettingColors" class="loading loading-spinner loading-sm" />
          Reinitialiser les couleurs
        </button>
        <button class="btn btn-primary" :disabled="saving || pending || !content" @click="save">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          Enregistrer
        </button>
      </div>
    </div>

    <div v-if="pending" class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200 p-4">
      <span class="loading loading-spinner loading-md" />
      <span>Chargement de la page d'accueil...</span>
    </div>

    <div v-else-if="content" class="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div class="card border border-base-300 bg-base-200 shadow">
          <div class="card-body">
            <h2 class="card-title text-lg">Structure</h2>

            <div class="mt-3 grid gap-2">
              <button
                v-for="count in SECTION_COLUMN_COUNTS"
                :key="count"
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
                  <button class="w-full text-left" @click="selectSection(section.id)">
                    <div class="flex items-center justify-between gap-2">
                      <div class="font-medium">Section {{ index + 1 }}</div>
                      <span class="badge badge-sm" :class="section.enabled ? 'badge-success' : 'badge-ghost'">
                        {{ section.enabled ? 'Active' : 'Masquee' }}
                      </span>
                    </div>
                    <div class="mt-1 text-xs opacity-70">
                      {{ SECTION_COLUMN_COUNT_LABELS[section.columnCount] }}
                    </div>
                  </button>

                  <div class="mt-3 flex flex-wrap gap-2">
                    <button class="btn btn-xs" :disabled="index === 0" @click="moveSection(index, -1)">Monter</button>
                    <button class="btn btn-xs" :disabled="index === content.sections.length - 1" @click="moveSection(index, 1)">Descendre</button>
                    <button class="btn btn-xs btn-outline btn-error" @click="removeSection(index)">Supprimer</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div v-if="selectedSection">
        <div role="tablist" class="tabs tabs-lift flex-wrap">
          <button class="tab" :class="editorTab === 'section' ? 'tab-active' : 'border-0'" @click="editorTab = 'section'">
            Section
          </button>
          <button class="tab" :class="editorTab === 'columns' ? 'tab-active' : 'border-0'" @click="editorTab = 'columns'">
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
                <label class="label"><span class="label-text">Alignement vertical des colonnes dans la section</span></label>
                <select v-model="selectedSection.contentVerticalAlign" class="select select-bordered w-full">
                  <option v-for="align in VERTICAL_ALIGNS" :key="align" :value="align">{{ align }}</option>
                </select>
              </div>
            </div>

            <ThemeColorPicker v-model="selectedSection.backgroundColor" label="Fond de section" default-token="base-100" />
            <AdminHomepageSectionBackgroundFields :section="selectedSection" />
          </div>
        </section>

        <section v-else class="rounded-b-box rounded-tr-box border border-base-300 bg-base-200 p-6 shadow">
          <div class="space-y-4">
            <div role="tablist" class="tabs tabs-lift flex-wrap">
              <button
                v-for="(_, columnIndex) in selectedSection.columns.slice(0, selectedSection.columnCount)"
                :key="columnIndex"
                class="tab"
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
                  <label class="label"><span class="label-text">Alignement vertical du contenu de la colonne</span></label>
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
                  <div class="font-medium">Elements de la colonne</div>
                  <div class="flex flex-wrap gap-2">
                    <button class="btn btn-xs btn-outline" @click="addColumnItem('badge')">Badge</button>
                    <button class="btn btn-xs btn-outline" @click="addColumnItem('title')">Titre</button>
                    <button class="btn btn-xs btn-outline" @click="addColumnItem('text')">Texte</button>
                    <button class="btn btn-xs btn-outline" @click="addColumnItem('buttons')">Boutons</button>
                    <button class="btn btn-xs btn-outline" @click="addColumnItem('cards')">Cartes</button>
                    <button class="btn btn-xs btn-outline" @click="addColumnItem('image')">Image</button>
                    <button class="btn btn-xs btn-outline" @click="addColumnItem('carousel')">Carousel</button>
                  </div>
                </div>

                <div class="space-y-4">
                  <div
                    v-for="(item, itemIndex) in selectedColumn.items"
                    :key="item.id"
                    class="rounded-xl border border-base-300 bg-base-200 p-4"
                  >
                    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div class="font-medium">{{ itemLabel(item) }}</div>
                      <div class="flex flex-wrap gap-2">
                        <button class="btn btn-xs" :disabled="itemIndex === 0" @click="moveItem(selectedColumn.items, itemIndex, -1)">Monter</button>
                        <button class="btn btn-xs" :disabled="itemIndex === selectedColumn.items.length - 1" @click="moveItem(selectedColumn.items, itemIndex, 1)">Descendre</button>
                        <button class="btn btn-xs btn-outline btn-error" @click="selectedColumn.items.splice(itemIndex, 1)">Supprimer</button>
                      </div>
                    </div>

                    <div v-if="item.type === 'badge' || item.type === 'title' || item.type === 'text'" class="space-y-4">
                      <AdminHomepageTranslationTabs
                        :model-value="item.text"
                        :label="item.type === 'badge' ? 'Badge' : item.type === 'title' ? 'Titre' : 'Texte'"
                        :size="item.size"
                        :multiline="item.type === 'text'"
                        @update:size="item.size = $event as typeof item.size"
                      />
                      <template v-if="item.type === 'badge'">
                        <ThemeColorPicker v-model="item.backgroundColor" label="Fond du badge" default-token="primary" />
                        <ThemeColorPicker v-model="item.textColor" label="Texte du badge" default-token="primary-content" />
                        <ThemeColorPicker v-model="item.borderColor" label="Bordure du badge" default-token="primary" />
                      </template>
                    </div>

                    <div v-else-if="item.type === 'buttons'" class="space-y-4">
                      <div class="rounded-xl border border-base-300 bg-base-100 p-4">
                        <div class="mb-3 flex items-center justify-between gap-2">
                          <div class="font-medium">Bouton principal</div>
                          <button v-if="!item.primaryButton" class="btn btn-xs btn-outline" @click="item.primaryButton = createEmptyButton()">
                            Ajouter
                          </button>
                          <button v-else class="btn btn-xs btn-outline btn-error" @click="item.primaryButton = null">
                            Retirer
                          </button>
                        </div>
                        <AdminHomepageButtonFields v-if="item.primaryButton" :button="item.primaryButton" />
                      </div>

                      <div class="rounded-xl border border-base-300 bg-base-100 p-4">
                        <div class="mb-3 flex items-center justify-between gap-2">
                          <div class="font-medium">Bouton secondaire</div>
                          <button v-if="!item.secondaryButton" class="btn btn-xs btn-outline" @click="item.secondaryButton = createEmptyButton()">
                            Ajouter
                          </button>
                          <button v-else class="btn btn-xs btn-outline btn-error" @click="item.secondaryButton = null">
                            Retirer
                          </button>
                        </div>
                        <AdminHomepageButtonFields v-if="item.secondaryButton" :button="item.secondaryButton" />
                      </div>
                    </div>

                    <div v-else-if="item.type === 'image'" class="space-y-4">
                      <div class="form-control">
                        <label class="label"><span class="label-text">Image</span></label>
                        <ImageInput v-model="item.imageUrl" />
                      </div>

                      <AdminHomepageTranslationTabs :model-value="item.alt" label="Alt" />

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

                    <div v-else-if="item.type === 'cards'" class="space-y-4">
                      <div class="form-control">
                        <label class="label"><span class="label-text">Affichage des cartes</span></label>
                        <select v-model="item.display" class="select select-bordered w-full">
                          <option v-for="display in CARDS_DISPLAYS" :key="display" :value="display">
                            {{ CARDS_DISPLAY_LABELS[display] }}
                          </option>
                        </select>
                      </div>

                      <div class="flex justify-end">
                        <button class="btn btn-sm btn-primary" @click="item.cards.push(createEmptyCard(createId('card')))">
                          Ajouter une carte
                        </button>
                      </div>

                      <div class="space-y-4">
                        <div
                          v-for="(card, cardIndex) in item.cards"
                          :key="card.id"
                          class="rounded-xl border border-base-300 bg-base-100 p-4"
                        >
                          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div class="font-medium">Carte {{ cardIndex + 1 }}</div>
                            <div class="flex flex-wrap gap-2">
                              <button class="btn btn-xs" :disabled="cardIndex === 0" @click="moveItem(item.cards, cardIndex, -1)">Monter</button>
                              <button class="btn btn-xs" :disabled="cardIndex === item.cards.length - 1" @click="moveItem(item.cards, cardIndex, 1)">Descendre</button>
                              <button class="btn btn-xs btn-outline btn-error" @click="item.cards.splice(cardIndex, 1)">Supprimer</button>
                            </div>
                          </div>
                          <AdminHomepageCardFields :card="card" />
                        </div>
                      </div>
                    </div>

                    <div v-else-if="item.type === 'carousel'" class="space-y-4">
                      <AdminHomepageCarouselFields :carousel="item" />
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ThemeColorPicker from '~/components/admin/ThemeColorPicker.vue'
import AdminHomepageButtonFields from '~/components/admin/homepage/ButtonFields.vue'
import AdminHomepageCarouselFields from '~/components/admin/homepage/CarouselFields.vue'
import AdminHomepageCardFields from '~/components/admin/homepage/CardFields.vue'
import AdminHomepageSectionBackgroundFields from '~/components/admin/homepage/SectionBackgroundFields.vue'
import AdminHomepageTranslationTabs from '~/components/admin/homepage/TranslationTabs.vue'
import type {
  HomePageColumn,
  HomePageColumnItem,
  HomePageContent,
  SectionColumnCount
} from '~/shared/homePage'
import {
  applyDefaultSectionStyling,
  CARDS_DISPLAY_LABELS,
  CARDS_DISPLAYS,
  CONTENT_ALIGNS,
  cloneHomePageContent,
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
  IMAGE_ASPECTS,
  IMAGE_FITS,
  SECTION_COLUMN_COUNTS,
  SECTION_COLUMN_COUNT_LABELS,
  SECTION_CONTAINER_WIDTH_LABELS,
  SECTION_CONTAINER_WIDTHS,
  VERTICAL_ALIGNS
} from '~/shared/homePage'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const content = ref<HomePageContent | null>(null)
const pending = ref(true)
const saving = ref(false)
const resettingColors = ref(false)
const selectedSectionId = ref('')
const sectionColumnTab = ref(0)
const editorTab = ref<'section' | 'columns'>('section')

const selectedSection = computed(() =>
  content.value?.sections.find(section => section.id === selectedSectionId.value) ?? null
)

const selectedColumn = computed<HomePageColumn | null>(() => {
  if (!selectedSection.value) return null
  return selectedSection.value.columns[sectionColumnTab.value] ?? null
})

onMounted(async () => {
  await load()
})

const load = async () => {
  pending.value = true
  try {
    const response = await $fetch<HomePageContent>('/api/admin/home-page')
    content.value = cloneHomePageContent(response)
    if (content.value.sections.length) {
      selectedSectionId.value = content.value.sections[0]?.id || ''
      sectionColumnTab.value = 0
    }
  } finally {
    pending.value = false
  }
}

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`

const selectSection = (id: string) => {
  selectedSectionId.value = id
  sectionColumnTab.value = 0
  editorTab.value = 'section'
}

const addSection = (count: SectionColumnCount) => {
  if (!content.value) return
  const section = createEmptyColumnsSection(createId('section'), count)
  content.value.sections.push(section)
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
  if (!content.value) return
  moveItem(content.value.sections, index, direction)
}

const removeSection = (index: number) => {
  if (!content.value) return
  const removed = content.value.sections[index]
  if (!removed) return
  content.value.sections.splice(index, 1)
  if (!content.value.sections.length) {
    selectedSectionId.value = ''
    return
  }
  if (selectedSectionId.value === removed.id) {
    selectedSectionId.value = content.value.sections[Math.max(0, index - 1)]?.id || content.value.sections[0]?.id || ''
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

const addColumnItem = (type: HomePageColumnItem['type']) => {
  if (!selectedColumn.value) return
  switch (type) {
    case 'badge':
      selectedColumn.value.items.push(createBadgeItem(createId('badge')))
      break
    case 'title':
      selectedColumn.value.items.push(createTitleItem(createId('title')))
      break
    case 'text':
      selectedColumn.value.items.push(createTextItem(createId('text')))
      break
    case 'buttons':
      selectedColumn.value.items.push(createButtonsItem(createId('buttons')))
      break
    case 'cards':
      selectedColumn.value.items.push(createCardsItem(createId('cards')))
      break
    case 'image':
      selectedColumn.value.items.push(createImageItem(createId('image')))
      break
    case 'carousel':
      selectedColumn.value.items.push(createCarouselItem(createId('carousel')))
      break
  }
}

const itemLabel = (item: HomePageColumnItem) => {
  switch (item.type) {
    case 'badge':
      return 'Badge'
    case 'title':
      return 'Titre'
    case 'text':
      return 'Texte'
    case 'buttons':
      return 'Boutons'
    case 'cards':
      return 'Cartes'
    case 'image':
      return 'Image'
    case 'carousel':
      return 'Carousel'
  }
}

const save = async () => {
  if (!content.value) return
  saving.value = true
  try {
    await $fetch('/api/admin/home-page', {
      method: 'PUT',
      body: content.value
    })
    const { $toast } = useNuxtApp() as any
    $toast?.success('Page d accueil enregistree')
  } catch (error: any) {
    const { $toast } = useNuxtApp() as any
    $toast?.error(error.statusMessage || 'Erreur lors de l enregistrement')
  } finally {
    saving.value = false
  }
}

const resetColors = async () => {
  if (!content.value) return
  resettingColors.value = true
  try {
    applyDefaultSectionStyling(content.value)
    await $fetch('/api/admin/home-page', {
      method: 'PUT',
      body: content.value
    })
    const { $toast } = useNuxtApp() as any
    $toast?.success('Couleurs reinitialisees avec succes')
    await load()
  } catch (error: any) {
    const { $toast } = useNuxtApp() as any
    $toast?.error(error.statusMessage || 'Erreur lors de la reinitialisation')
  } finally {
    resettingColors.value = false
  }
}
</script>
