<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Accueil</h1>
        <p class="mt-1 text-sm opacity-70">
          Personnalisez le hero et les sections de la page d'accueil sans casser le rendu SEO.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <NuxtLink to="/" target="_blank" class="btn btn-outline">
          Voir la page
        </NuxtLink>
        <NuxtLink to="/?editPage=1" target="_blank" class="btn btn-outline btn-primary">
          Éditer sur la page
        </NuxtLink>
        <button class="btn btn-warning btn-outline" :disabled="saving || pending || !content" @click="resetColors">
          <span v-if="resettingColors" class="loading loading-spinner loading-sm" />
          Réinitialiser les couleurs
        </button>
        <button class="btn btn-primary" :disabled="saving || pending || !content" @click="save">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          Enregistrer
        </button>
      </div>
    </div>

    <div v-if="pending" class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200 p-4">
      <span class="loading loading-spinner loading-md" />
      <span>Chargement de la page d'accueil…</span>
    </div>

    <div v-else-if="content" class="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside class="space-y-4">
        <div class="card border border-base-300 bg-base-200 shadow">
          <div class="card-body">
            <div class="flex items-center justify-between gap-3">
              <h2 class="card-title text-lg">Structure</h2>
              <div class="flex flex-wrap gap-2">
                <button class="btn btn-sm btn-outline" @click="addSection('one-column')">
                  <Icon name="mdi:view-agenda-outline" size="16" />
                  1 colonne
                </button>
                <button class="btn btn-sm btn-primary" @click="addSection('two-columns')">
                  <Icon name="mdi:view-column-outline" size="16" />
                  2 colonnes
                </button>
              </div>
            </div>

            <div class="menu mt-2 rounded-box bg-base-100 p-2">
              <button
                class="rounded-xl px-3 py-3 text-left"
                :class="selectedPanel === 'hero' ? 'bg-primary text-primary-content' : 'hover:bg-base-200'"
                @click="selectedPanel = 'hero'"
              >
                <div class="font-medium">Hero</div>
                <div class="text-xs opacity-80">Image de fond, titre, CTA, points clés</div>
              </button>

              <div class="mt-2 space-y-2">
                <div
                  v-for="(section, index) in content.sections"
                  :key="section.id"
                  class="rounded-xl border border-base-300 bg-base-100 p-3"
                  :class="selectedPanel === section.id ? 'ring-2 ring-primary' : ''"
                >
                  <button class="w-full text-left" @click="selectedPanel = section.id">
                    <div class="flex items-center justify-between gap-2">
                      <div class="font-medium">Section {{ index + 1 }}</div>
                      <span class="badge badge-sm" :class="section.enabled ? 'badge-success' : 'badge-ghost'">
                        {{ section.enabled ? 'Active' : 'Masquée' }}
                      </span>
                    </div>
                    <div class="mt-1 text-xs opacity-70">{{ section.type === 'one-column' ? '1 colonne' : '2 colonnes' }}</div>
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

      <div class="space-y-6">
        <template v-if="selectedPanel === 'hero'">
          <div class="tabs tabs-box mb-4">
            <button
              class="tab"
              :class="heroTab === 'content' ? 'tab-active' : ''"
              @click="heroTab = 'content'"
            >
              <Icon name="mdi:home-edit" size="16" class="mr-1" />
              Hero
            </button>
            <button
              class="tab"
              :class="heroTab === 'highlights' ? 'tab-active' : ''"
              @click="heroTab = 'highlights'"
            >
              <Icon name="mdi:star-box-multiple" size="16" class="mr-1" />
              Points clés
            </button>
          </div>

          <section v-if="heroTab === 'content'" class="card border border-base-300 bg-base-200 shadow">
            <div class="card-body">
              <div class="flex items-center justify-between gap-3">
                <h2 class="card-title">Hero</h2>
                <label class="label cursor-pointer justify-start gap-2">
                  <input v-model="content.hero.enabled" type="checkbox" class="toggle toggle-primary" />
                  <span class="label-text">Afficher</span>
                </label>
              </div>

              <div class="space-y-4">
                <div class="form-control">
                  <label class="label"><span class="label-text">Image de fond</span></label>
                  <ImageInput v-model="content.hero.backgroundImageUrl" />
                </div>

                <TranslationTabs v-model="content.hero.badge" label="Badge" />
                <TranslationTabs v-model="content.hero.title" label="Titre" />
                <TranslationTabs v-model="content.hero.text" label="Texte" multiline />

                <div class="rounded-xl border border-base-300 bg-base-100 p-4">
                  <div class="mb-3 font-medium">Bouton principal</div>
                  <HomePageButtonFields :model-value="content.hero.primaryButton" />
                </div>

                <div class="rounded-xl border border-base-300 bg-base-100 p-4">
                  <div class="mb-3 flex items-center justify-between gap-2">
                    <div class="font-medium">Bouton secondaire</div>
                    <button
                      v-if="!content.hero.secondaryButton"
                      class="btn btn-xs btn-outline"
                      @click="content.hero.secondaryButton = createEmptyButton()"
                    >
                      Ajouter
                    </button>
                    <button
                      v-else
                      class="btn btn-xs btn-outline btn-error"
                      @click="content.hero.secondaryButton = null"
                    >
                      Retirer
                    </button>
                  </div>
                  <HomePageButtonFields v-if="content.hero.secondaryButton" :model-value="content.hero.secondaryButton" />
                </div>
              </div>
            </div>
          </section>

          <section v-else class="card border border-base-300 bg-base-200 shadow">
            <div class="card-body">
              <div class="mb-3 flex items-center justify-between gap-3">
                <h2 class="card-title">Points clés du hero</h2>
                <button class="btn btn-sm btn-primary" @click="addHeroHighlight">
                  <Icon name="mdi:plus" size="16" />
                  Carte
                </button>
              </div>

              <div class="space-y-4">
                <div
                  v-for="(card, index) in content.hero.highlights"
                  :key="card.id"
                  class="rounded-xl border border-base-300 bg-base-100 p-4"
                >
                  <div class="mb-3 flex items-center justify-between gap-2">
                    <div class="font-medium">Carte {{ index + 1 }}</div>
                    <button class="btn btn-xs btn-outline btn-error" @click="removeHeroHighlight(index)">Supprimer</button>
                  </div>
                  <HomePageCardFields :model-value="card" />
                </div>
              </div>
            </div>
          </section>
        </template>

        <template v-else-if="selectedSection">
          <div v-for="section in [selectedSection]" :key="section.id" class="space-y-6">
          <section class="card border border-base-300 bg-base-200 shadow">
            <div class="card-body">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h2 class="card-title">Section</h2>
                <div class="flex flex-wrap gap-4">
                  <label class="label cursor-pointer justify-start gap-2">
                    <input v-model="section.enabled" type="checkbox" class="toggle toggle-primary" />
                    <span class="label-text">Afficher</span>
                  </label>
                  <label v-if="section.type === 'two-columns'" class="label cursor-pointer justify-start gap-2">
                    <input v-model="section.reverseOnDesktop" type="checkbox" class="toggle toggle-primary" />
                    <span class="label-text">Inverser sur desktop</span>
                  </label>
                </div>
              </div>

                <div class="flex flex-col gap-4">
                  <div class="form-control gap-3 flex max-w-sm">
                    <label class="label"><span class="label-text">Type</span></label>
                    <select :value="section.type" class="select select-bordered w-full" @change="onSectionTypeChange(section, $event)">
                      <option value="two-columns">2 colonnes</option>
                      <option value="one-column">1 colonne</option>
                    </select>
                  </div>
                  <div class="form-control gap-3 flex">
                    <label class="label"><span class="label-text">Identifiant technique</span></label>
                    <input v-model="section.id" class="input input-bordered w-full" />
                  </div>
                  <div class="form-control gap-3 flex max-w-sm">
                    <label class="label"><span class="label-text">Largeur du container</span></label>
                    <select v-model="section.containerWidth" class="select select-bordered w-full">
                      <option v-for="width in SECTION_CONTAINER_WIDTHS" :key="width" :value="width">
                        {{ SECTION_CONTAINER_WIDTH_LABELS[width] }}
                      </option>
                    </select>
                  </div>

                  <ThemeColorPicker
                    v-model="section.backgroundColor"
                    label="Fond de section"
                    default-token="base-100"
                  />
                </div>
            </div>
          </section>

          <section class="card border border-base-300 bg-base-200 shadow">
            <div class="card-body">
              <div v-if="section.type === 'two-columns'" class="tabs tabs-box mb-4">
                <button
                  class="tab"
                  :class="sectionColumnTab === 0 ? 'tab-active' : ''"
                  @click="sectionColumnTab = 0"
                >
                  <Icon name="mdi:numeric-1-circle" size="16" class="mr-1" />
                  Colonne 1
                </button>
                <button
                  class="tab"
                  :class="sectionColumnTab === 1 ? 'tab-active' : ''"
                  @click="sectionColumnTab = 1"
                >
                  <Icon name="mdi:numeric-2-circle" size="16" class="mr-1" />
                  Colonne 2
                </button>
              </div>

              <div v-for="(column, columnIndex) in section.type === 'two-columns' ? section.columns : [section.column]" :key="`${section.id}-${columnIndex}`">
                <template v-if="sectionColumnTab === columnIndex">
                  <div class="flex items-center gap-3 mb-4">
                    <h3 class="font-medium">Colonne {{ columnIndex + 1 }}</h3>
                    <select class="select select-bordered select-sm" :value="column.type" @change="onColumnTypeChange(section, columnIndex, $event)">
                      <option value="content">Contenu</option>
                      <option value="image">Image</option>
                    </select>
                  </div>

                  <template v-if="column.type === 'image'">
                    <div class="space-y-4">
                      <div class="form-control gap-3 flex">
                        <label class="label"><span class="label-text">Image</span></label>
                        <ImageInput v-model="column.imageUrl" />
                      </div>
                      <TranslationTabs v-model="column.alt" label="Alt" />
                      <div class="grid gap-4 md:grid-cols-2">
                        <div class="form-control gap-3 flex">
                          <label class="label"><span class="label-text">Ratio</span></label>
                          <select v-model="column.aspect" class="select select-bordered w-full">
                            <option v-for="aspect in IMAGE_ASPECTS" :key="aspect" :value="aspect">{{ aspect }}</option>
                          </select>
                        </div>
                        <div class="form-control gap-3 flex">
                          <label class="label"><span class="label-text">Placement</span></label>
                          <select v-model="column.fit" class="select select-bordered w-full">
                            <option v-for="fit in IMAGE_FITS" :key="fit" :value="fit">{{ fit }}</option>
                          </select>
                        </div>
                      </div>
                      <label class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
                        <input v-model="column.framed" type="checkbox" class="toggle toggle-primary" />
                        <span class="label-text">Afficher l’image dans une carte</span>
                      </label>
                    </div>
                  </template>

                  <template v-else>
                    <div class="space-y-4">
                      <div class="flex flex-col gap-4">
                        <div class="form-control gap-3 flex">
                          <label class="label"><span class="label-text">Alignement horizontal</span></label>
                          <select v-model="column.align" class="select select-bordered w-full">
                            <option v-for="align in CONTENT_ALIGNS" :key="align" :value="align">{{ align }}</option>
                          </select>
                        </div>
                        <div class="form-control gap-3 flex">
                          <label class="label"><span class="label-text">Alignement vertical</span></label>
                          <select v-model="column.verticalAlign" class="select select-bordered w-full">
                            <option v-for="align in VERTICAL_ALIGNS" :key="align" :value="align">{{ align }}</option>
                          </select>
                        </div>
                      </div>

                      <ThemeColorPicker
                        v-model="column.textColor"
                        label="Couleur du texte de la colonne"
                        default-token="base-content"
                      />

                      <TranslationTabs v-model="column.badge" label="Badge" />
                      <TranslationTabs v-model="column.title" label="Titre" />
                      <TranslationTabs v-model="column.text" label="Texte" multiline />

                      <div class="rounded-xl border border-base-300 bg-base-100 p-4">
                        <div class="mb-3 flex items-center justify-between gap-2">
                          <div class="font-medium">Bouton principal</div>
                          <button
                            v-if="!column.primaryButton"
                            class="btn btn-xs btn-outline"
                            @click="column.primaryButton = createEmptyButton()"
                          >
                            Ajouter
                          </button>
                          <button
                            v-else
                            class="btn btn-xs btn-outline btn-error"
                            @click="column.primaryButton = null"
                          >
                            Retirer
                          </button>
                        </div>
                        <HomePageButtonFields v-if="column.primaryButton" :model-value="column.primaryButton" />
                      </div>

                      <div class="rounded-xl border border-base-300 bg-base-100 p-4">
                        <div class="mb-3 flex items-center justify-between gap-2">
                          <div class="font-medium">Bouton secondaire</div>
                          <button
                            v-if="!column.secondaryButton"
                            class="btn btn-xs btn-outline"
                            @click="column.secondaryButton = createEmptyButton()"
                          >
                            Ajouter
                          </button>
                          <button
                            v-else
                            class="btn btn-xs btn-outline btn-error"
                            @click="column.secondaryButton = null"
                          >
                            Retirer
                          </button>
                        </div>
                        <HomePageButtonFields v-if="column.secondaryButton" :model-value="column.secondaryButton" />
                      </div>

                      <div class="rounded-xl border border-base-300 bg-base-100 p-4">
                        <div class="mb-3 flex items-center justify-between gap-3">
                          <div class="font-medium">Cartes</div>
                          <button class="btn btn-xs btn-primary" @click="addColumnCard(column)">
                            <Icon name="mdi:plus" size="14" />
                            Carte
                          </button>
                        </div>

                        <div class="space-y-4">
                          <div
                            v-for="(card, cardIndex) in column.cards"
                            :key="card.id"
                            class="rounded-xl border border-base-300 bg-base-200 p-4"
                          >
                            <div class="mb-3 flex items-center justify-between gap-2">
                              <div class="font-medium">Carte {{ cardIndex + 1 }}</div>
                              <button class="btn btn-xs btn-outline btn-error" @click="removeColumnCard(column, cardIndex)">
                                Supprimer
                              </button>
                            </div>
                            <HomePageCardFields :model-value="card" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                </template>
              </div>
            </div>
          </section>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, type PropType } from 'vue'
import AdminIconPicker from '~/components/admin/IconPicker.vue'
import ThemeColorPicker from '~/components/admin/ThemeColorPicker.vue'
import type { HomePageButton, HomePageCard, HomePageContent, HomePageContentBlock, HomePageOneColumnSection, HomePageTwoColumnsSection, ThemeColorSelection } from '~/shared/homePage'
import {
  applyDefaultSectionStyling,
  BUTTON_TONES,
  CARD_SIZE_LABELS,
  CARD_SIZES,
  CARD_TONES,
  cloneHomePageContent,
  CONTENT_ALIGNS,
  createEmptyButton,
  createEmptyCard,
  createEmptyContentBlock,
  createEmptyImageBlock,
  createEmptyOneColumnSection,
  createEmptyTwoColumnsSection,
  getAlternatingSectionTone,
  IMAGE_ASPECTS,
  IMAGE_FITS,
  SECTION_CONTAINER_WIDTH_LABELS,
  SECTION_CONTAINER_WIDTHS,
  SECTION_TONES,
  VERTICAL_ALIGNS
} from '~/shared/homePage'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const TranslationTabs = defineComponent({
  props: {
    modelValue: { type: Object as PropType<{ fr: string; en: string }>, required: true },
    label: { type: String, required: true },
    multiline: { type: Boolean, default: false }
  },
  setup(props) {
    const activeLang = ref<'fr' | 'en'>('fr')

    return () => h('div', { class: 'form-control' }, [
      h('div', { class: 'flex items-center justify-between mb-2' }, [
        h('label', { class: 'label py-0' }, [h('span', { class: 'label-text' }, props.label)]),
        h('div', { class: 'tabs tabs-box tabs-xs' }, [
          h('button', {
            class: ['tab', activeLang.value === 'fr' ? 'tab-active' : ''],
            onClick: () => activeLang.value = 'fr'
          }, 'FR'),
          h('button', {
            class: ['tab', activeLang.value === 'en' ? 'tab-active' : ''],
            onClick: () => activeLang.value = 'en'
          }, 'EN')
        ])
      ]),
      props.multiline
        ? h('textarea', {
            class: 'textarea textarea-bordered w-full',
            rows: 3,
            value: props.modelValue[activeLang.value],
            onInput: (event: Event) => {
              props.modelValue[activeLang.value] = (event.target as HTMLTextAreaElement).value
            }
          })
        : h('input', {
            class: 'input input-bordered w-full',
            value: props.modelValue[activeLang.value],
            onInput: (event: Event) => {
              props.modelValue[activeLang.value] = (event.target as HTMLInputElement).value
            }
          })
    ])
  }
})

const HomePageButtonFields = defineComponent({
  props: {
    modelValue: {
      type: Object as PropType<HomePageButton>,
      required: true
    }
  },
  setup(props) {
    const labelTab = ref<'fr' | 'en'>('fr')

    return () => h('div', { class: 'space-y-4' }, [
      h('div', { class: 'form-control' }, [
        h('div', { class: 'flex items-center justify-between mb-2' }, [
          h('label', { class: 'label py-0' }, [h('span', { class: 'label-text' }, 'Label')]),
          h('div', { class: 'tabs tabs-box tabs-xs' }, [
            h('button', {
              class: ['tab', labelTab.value === 'fr' ? 'tab-active' : ''],
              onClick: () => labelTab.value = 'fr'
            }, 'FR'),
            h('button', {
              class: ['tab', labelTab.value === 'en' ? 'tab-active' : ''],
              onClick: () => labelTab.value = 'en'
            }, 'EN')
          ])
        ]),
        h('input', {
          class: 'input input-bordered w-full',
          value: props.modelValue.label[labelTab.value],
          onInput: (event: Event) => { props.modelValue.label[labelTab.value] = (event.target as HTMLInputElement).value }
        })
      ]),
      h('div', { class: 'flex flex-col gap-4' }, [
        h('div', { class: 'form-control gap-3 flex' }, [
          h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Lien')]),
          h('input', {
            class: 'input input-bordered w-full',
            value: props.modelValue.href,
            onInput: (event: Event) => { props.modelValue.href = (event.target as HTMLInputElement).value }
          })
        ]),
        h('div', { class: 'form-control gap-3 flex' }, [
          h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Style')]),
          h('select', {
            class: 'select select-bordered w-full',
            value: props.modelValue.tone,
            onChange: (event: Event) => { props.modelValue.tone = (event.target as HTMLSelectElement).value as HomePageButton['tone'] }
          }, BUTTON_TONES.map(tone => h('option', { value: tone }, tone)))
        ])
      ]),
      h(ThemeColorPicker, {
        label: 'Fond du bouton',
        modelValue: props.modelValue.backgroundColor || null,
        defaultToken: 'primary',
        'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.modelValue.backgroundColor = val }
      }),
      h(ThemeColorPicker, {
        label: 'Texte du bouton',
        modelValue: props.modelValue.textColor || null,
        defaultToken: 'primary-content',
        'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.modelValue.textColor = val }
      }),
      h(ThemeColorPicker, {
        label: 'Bordure du bouton',
        modelValue: props.modelValue.borderColor || null,
        defaultToken: 'transparent',
        'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.modelValue.borderColor = val }
      })
    ])
  }
})

const HomePageCardFields = defineComponent({
  props: {
    modelValue: {
      type: Object as PropType<HomePageCard>,
      required: true
    }
  },
  setup(props) {
    const titleTab = ref<'fr' | 'en'>('fr')
    const textTab = ref<'fr' | 'en'>('fr')

    return () => h('div', { class: 'space-y-4' }, [
      h(AdminIconPicker, {
        modelValue: props.modelValue.icon || '',
        'onUpdate:modelValue': (val: string) => props.modelValue.icon = val
      }),
      h('div', { class: 'flex flex-col gap-4' }, [
        h('div', { class: 'form-control' }, [
          h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Ton')]),
          h('select', {
            class: 'select select-bordered w-full',
            value: props.modelValue.tone,
            onChange: (event: Event) => { props.modelValue.tone = (event.target as HTMLSelectElement).value as HomePageCard['tone'] }
          }, CARD_TONES.map(tone => h('option', { value: tone }, tone)))
        ]),
        h('label', { class: 'label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3' }, [
          h('input', {
            type: 'checkbox',
            class: 'toggle toggle-primary toggle-sm',
            checked: props.modelValue.backdropBlur === true,
            onChange: (event: Event) => { props.modelValue.backdropBlur = (event.target as HTMLInputElement).checked }
          }),
          h('span', { class: 'label-text' }, 'Background blur')
        ]),
        h('div', { class: 'form-control' }, [
          h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Taille de la carte')]),
          h('select', {
            class: 'select select-bordered w-full',
            value: props.modelValue.size,
            onChange: (event: Event) => { props.modelValue.size = (event.target as HTMLSelectElement).value as HomePageCard['size'] }
          }, CARD_SIZES.map(size => h('option', { value: size }, CARD_SIZE_LABELS[size])))
        ])
      ]),
      h(ThemeColorPicker, {
        label: 'Fond de la carte',
        modelValue: props.modelValue.backgroundColor || null,
        defaultToken: 'primary',
        'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.modelValue.backgroundColor = val }
      }),
      h(ThemeColorPicker, {
        label: 'Texte de la carte',
        modelValue: props.modelValue.textColor || null,
        defaultToken: 'base-content',
        'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.modelValue.textColor = val }
      }),
      h(ThemeColorPicker, {
        label: 'Couleur de l’icône',
        modelValue: props.modelValue.iconColor || null,
        defaultToken: 'primary',
        'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.modelValue.iconColor = val }
      }),
      h(ThemeColorPicker, {
        label: 'Fond de l’icône',
        modelValue: props.modelValue.iconBackgroundColor || null,
        defaultToken: 'transparent',
        'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.modelValue.iconBackgroundColor = val }
      }),
      h(ThemeColorPicker, {
        label: 'Bordure de la carte',
        modelValue: props.modelValue.borderColor || null,
        defaultToken: 'base-300',
        'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.modelValue.borderColor = val }
      }),
      h('div', { class: 'form-control' }, [
        h('div', { class: 'flex items-center justify-between mb-2' }, [
          h('label', { class: 'label py-0' }, [h('span', { class: 'label-text' }, 'Titre')]),
          h('div', { class: 'tabs tabs-box tabs-xs' }, [
            h('button', {
              class: ['tab', titleTab.value === 'fr' ? 'tab-active' : ''],
              onClick: () => titleTab.value = 'fr'
            }, 'FR'),
            h('button', {
              class: ['tab', titleTab.value === 'en' ? 'tab-active' : ''],
              onClick: () => titleTab.value = 'en'
            }, 'EN')
          ])
        ]),
        h('input', {
          class: 'input input-bordered w-full',
          value: props.modelValue.title[titleTab.value],
          onInput: (event: Event) => { props.modelValue.title[titleTab.value] = (event.target as HTMLInputElement).value }
        })
      ]),
      h('div', { class: 'form-control' }, [
        h('div', { class: 'flex items-center justify-between mb-2' }, [
          h('label', { class: 'label py-0' }, [h('span', { class: 'label-text' }, 'Texte')]),
          h('div', { class: 'tabs tabs-box tabs-xs' }, [
            h('button', {
              class: ['tab', textTab.value === 'fr' ? 'tab-active' : ''],
              onClick: () => textTab.value = 'fr'
            }, 'FR'),
            h('button', {
              class: ['tab', textTab.value === 'en' ? 'tab-active' : ''],
              onClick: () => textTab.value = 'en'
            }, 'EN')
          ])
        ]),
        h('textarea', {
          class: 'textarea textarea-bordered w-full',
          rows: 3,
          value: props.modelValue.text[textTab.value],
          onInput: (event: Event) => { props.modelValue.text[textTab.value] = (event.target as HTMLTextAreaElement).value }
        })
      ]),
      h('div', { class: 'rounded-xl border border-base-300 bg-base-100 p-4' }, [
        h('div', { class: 'mb-3 flex items-center justify-between gap-2' }, [
          h('div', { class: 'font-medium' }, 'Bouton principal'),
          !props.modelValue.primaryButton
            ? h('button', {
                class: 'btn btn-xs btn-outline',
                onClick: () => props.modelValue.primaryButton = createEmptyButton()
              }, 'Ajouter')
            : h('button', {
                class: 'btn btn-xs btn-outline btn-error',
                onClick: () => props.modelValue.primaryButton = null
              }, 'Retirer')
        ]),
        props.modelValue.primaryButton ? h(HomePageButtonFields, { modelValue: props.modelValue.primaryButton }) : null
      ]),
      h('div', { class: 'rounded-xl border border-base-300 bg-base-100 p-4' }, [
        h('div', { class: 'mb-3 flex items-center justify-between gap-2' }, [
          h('div', { class: 'font-medium' }, 'Bouton secondaire'),
          !props.modelValue.secondaryButton
            ? h('button', {
                class: 'btn btn-xs btn-outline',
                onClick: () => props.modelValue.secondaryButton = createEmptyButton()
              }, 'Ajouter')
            : h('button', {
                class: 'btn btn-xs btn-outline btn-error',
                onClick: () => props.modelValue.secondaryButton = null
              }, 'Retirer')
        ]),
        props.modelValue.secondaryButton ? h(HomePageButtonFields, { modelValue: props.modelValue.secondaryButton }) : null
      ])
    ])
  }
})

const content = ref<HomePageContent | null>(null)
const pending = ref(true)
const saving = ref(false)
const resettingColors = ref(false)
const selectedPanel = ref<'hero' | string>('hero')
const heroTab = ref<'content' | 'highlights'>('content')
const sectionColumnTab = ref(0)

const selectedSection = computed(() =>
  content.value?.sections.find(section => section.id === selectedPanel.value) ?? null
)

onMounted(async () => {
  await load()
})

const load = async () => {
  pending.value = true
  try {
    const response = await $fetch<HomePageContent>('/api/admin/home-page')
    content.value = cloneHomePageContent(response)
  } finally {
    pending.value = false
  }
}

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`

const addSection = (type: 'one-column' | 'two-columns') => {
  if (!content.value) return
  const tone = getAlternatingSectionTone(content.value.sections.length)
  const section = type === 'one-column'
    ? createEmptyOneColumnSection(createId('section'))
    : createEmptyTwoColumnsSection(createId('section'))
  section.tone = tone
  content.value.sections.push(section)
  selectedPanel.value = section.id
  sectionColumnTab.value = 0
}

const moveSection = (index: number, direction: -1 | 1) => {
  if (!content.value) return
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= content.value.sections.length) return
  const [section] = content.value.sections.splice(index, 1)
  if (!section) return
  content.value.sections.splice(nextIndex, 0, section)
}

const removeSection = (index: number) => {
  if (!content.value) return
  const removed = content.value.sections[index]
  if (!removed) return
  content.value.sections.splice(index, 1)
  if (selectedPanel.value === removed.id) {
    selectedPanel.value = 'hero'
  }
}

const addHeroHighlight = () => {
  if (!content.value) return
  content.value.hero.highlights.push(createEmptyCard(createId('hero-card')))
}

const removeHeroHighlight = (index: number) => {
  content.value?.hero.highlights.splice(index, 1)
}

const setColumnType = (section: HomePageTwoColumnsSection | HomePageOneColumnSection, index: number, type: string) => {
  const nextColumn = type === 'image' ? createEmptyImageBlock() : createEmptyContentBlock()
  if (section.type === 'two-columns') {
    section.columns[index] = nextColumn
    return
  }

  section.column = nextColumn
}

const onColumnTypeChange = (section: HomePageTwoColumnsSection | HomePageOneColumnSection, index: number, event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  setColumnType(section, index, value)
}

const onSectionTypeChange = (section: HomePageTwoColumnsSection | HomePageOneColumnSection, event: Event) => {
  if (!content.value) return
  const nextType = (event.target as HTMLSelectElement).value as 'one-column' | 'two-columns'
  if (section.type === nextType) return

  const index = content.value.sections.findIndex(item => item.id === section.id)
  if (index === -1) return

  const replacement = nextType === 'one-column'
    ? createEmptyOneColumnSection(section.id)
    : createEmptyTwoColumnsSection(section.id)

  replacement.enabled = section.enabled
  replacement.tone = section.tone
  replacement.containerWidth = section.containerWidth
  replacement.backgroundColor = section.backgroundColor
  replacement.verticalAlign = section.verticalAlign

  content.value.sections.splice(index, 1, replacement)
  sectionColumnTab.value = 0
}

const addColumnCard = (column: HomePageContentBlock) => {
  column.cards.push(createEmptyCard(createId('section-card')))
}

const removeColumnCard = (column: HomePageContentBlock, index: number) => {
  column.cards.splice(index, 1)
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
    $toast?.success('Page d accueil enregistrée')
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
    $toast?.success('Couleurs réinitialisées avec succès')
    await load()
  } catch (error: any) {
    const { $toast } = useNuxtApp() as any
    $toast?.error(error.statusMessage || 'Erreur lors de la réinitialisation')
  } finally {
    resettingColors.value = false
  }
}
</script>
