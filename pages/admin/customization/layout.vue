<template>
  <div v-if="model" class="min-w-0 space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.customizationLayoutPage.title') }}</h1>
        <p class="mt-2 max-w-3xl text-sm opacity-70">
          {{ t('admin.customizationLayoutPage.description') }}
        </p>
      </div>

      <button class="btn btn-primary" :disabled="saving" @click="save">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        {{ t('admin.common.save') }}
      </button>
    </div>

    <div class="min-w-0">
    <div class="flex flex-wrap items-end gap-4">
      <div class="tabs tabs-lift w-full max-w-full sm:w-fit">
        <button type="button" class="tab" :class="previewLocale === 'fr' ? 'tab-active' : 'border-0'" @click="previewLocale = 'fr'">{{ t('admin.customizationLayoutPage.previewFr') }}</button>
        <button type="button" class="tab" :class="previewLocale === 'en' ? 'tab-active' : 'border-0'" @click="previewLocale = 'en'">{{ t('admin.customizationLayoutPage.previewEn') }}</button>
      </div>
      <div class="tabs tabs-box w-full max-w-full sm:w-fit">
        <button type="button" class="tab" :class="previewDevice === 'desktop' ? 'tab-active' : ''" @click="previewDevice = 'desktop'">Vue desktop</button>
        <button type="button" class="tab" :class="previewDevice === 'mobile' ? 'tab-active' : ''" @click="previewDevice = 'mobile'">Vue mobile</button>
      </div>
    </div>

    <section class="min-w-0 space-y-5 rounded-box rounded-bottom rounded-topright border border-base-300 bg-base-100 xl:p-4 p-2 sm:p-6">
      <div>
        <h2 class="text-xl font-semibold">{{ t('admin.customizationLayoutPage.headerTitle') }}</h2>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.customizationLayoutPage.headerDescription') }}</p>
      </div>

      

        <div class="min-w-0 space-y-3">
          <div class="text-sm font-medium">{{ t('admin.customizationLayoutPage.previewTitle') }}</div>

          <div
            v-if="previewDevice === 'desktop'"
            class="min-w-0 overflow-visible border border-base-300 bg-base-200 shadow-sm"
          >
            <Navigation
              :preview-locale="previewLocale"
              :preview-site-config="previewSiteConfig"
              :preview-show-utility-controls="true"
              :preview-force-open-first-submenu="true"
            />
            <div class="pointer-events-none h-28" aria-hidden="true" />
          </div>
        </div>

      <div 
      class="grid min-w-0 gap-6"
      :class="[previewDevice === 'mobile' ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)]' : '']">
        <div class="min-w-0 space-y-5">
          <div class="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label class="form-control min-w-0 gap-2">
              <span class="label"><span class="label-text">{{ t('admin.customizationLayoutPage.headerHeight') }}</span></span>
              <input v-model.number="model.settings.header.heightPx" type="number" min="56" max="180" class="input input-bordered w-full" />
            </label>

            <label class="form-control min-w-0 gap-2">
              <span class="label"><span class="label-text">{{ t('admin.customizationLayoutPage.desktopLogoHeight') }}</span></span>
              <input v-model.number="model.settings.header.logoHeightPx" type="number" min="24" max="140" class="input input-bordered w-full" />
            </label>

            <label class="form-control min-w-0 gap-2">
              <span class="label"><span class="label-text">{{ t('admin.customizationLayoutPage.mobileLogoHeight') }}</span></span>
              <input v-model.number="model.settings.header.mobileLogoHeightPx" type="number" min="24" max="120" class="input input-bordered w-full" />
            </label>

            <label class="form-control min-w-0 gap-2">
              <span class="label"><span class="label-text">Hauteur mobile</span></span>
              <input v-model.number="model.settings.header.mobileHeightPx" type="number" min="56" max="160" class="input input-bordered w-full" />
            </label>

            <label class="form-control min-w-0 gap-2">
              <span class="label"><span class="label-text">{{ t('admin.customizationLayoutPage.navigationStyle') }}</span></span>
              <select v-model="model.settings.header.navigationStyle" class="select select-bordered w-full">
                <option v-for="style in CMS_HEADER_NAVIGATION_STYLES" :key="style" :value="style">
                  {{ headerNavigationStyleLabels[style] }}
                </option>
              </select>
            </label>

            <label class="form-control min-w-0 gap-2">
              <span class="label"><span class="label-text">Ouverture du sous-menu</span></span>
              <select v-model="model.settings.header.submenuTrigger" class="select select-bordered w-full">
                <option v-for="trigger in CMS_HEADER_SUBMENU_TRIGGERS" :key="trigger" :value="trigger">
                  {{ headerSubmenuTriggerLabels[trigger] }}
                </option>
              </select>
            </label>

            <label class="form-control min-w-0 gap-2">
              <span class="label"><span class="label-text">Animation du sous-menu</span></span>
              <select v-model="model.settings.header.submenuAnimation" class="select select-bordered w-full">
                <option v-for="animation in CMS_HEADER_SUBMENU_ANIMATIONS" :key="animation" :value="animation">
                  {{ headerSubmenuAnimationLabels[animation] }}
                </option>
              </select>
            </label>

            <label class="form-control min-w-0 gap-2">
              <span class="label"><span class="label-text">Radius du sous-menu</span></span>
              <input v-model.number="model.settings.header.submenuRadiusPx" type="number" min="0" max="40" class="input input-bordered w-full" />
            </label>

            <label class="form-control min-w-0 gap-2">
              <span class="label"><span class="label-text">Position du logo mobile</span></span>
              <select v-model="model.settings.header.mobileHeaderLogoPosition" class="select select-bordered w-full">
                <option v-for="position in CMS_HEADER_MOBILE_LOGO_POSITIONS" :key="position" :value="position">
                  {{ headerMobileLogoPositionLabels[position] }}
                </option>
              </select>
            </label>

            <label class="form-control min-w-0 gap-2">
              <span class="label"><span class="label-text">Position du burger mobile</span></span>
              <select v-model="model.settings.header.mobileBurgerPosition" class="select select-bordered w-full">
                <option v-for="position in CMS_HEADER_MOBILE_LOGO_POSITIONS" :key="`burger-${position}`" :value="position">
                  {{ headerMobileBurgerPositionLabels[position] }}
                </option>
              </select>
            </label>

            <label class="form-control gap-2">
              <span class="label"><span class="label-text">Position du logo dans le menu mobile</span></span>
              <select v-model="model.settings.header.mobileMenuLogoPosition" class="select select-bordered w-full">
                <option v-for="position in CMS_HEADER_MOBILE_LOGO_POSITIONS" :key="`menu-${position}`" :value="position">
                  {{ headerMobileLogoPositionLabels[position] }}
                </option>
              </select>
            </label>
          </div>

          <div class="grid min-w-0 gap-4 lg:grid-cols-2">
            <div class="min-w-0">
              <ThemeColorPicker
                v-model="model.settings.header.backgroundColor"
                :label="t('admin.customizationLayoutPage.headerBackground')"
                :allowed-tokens="CMS_THEME_COLOR_TOKENS"
                :allow-custom="false"
                default-token="base-100"
              />
            </div>
            <div class="min-w-0">
              <ThemeColorPicker
                v-model="model.settings.header.textColor"
                :label="t('admin.customizationLayoutPage.headerText')"
                :allowed-tokens="CMS_THEME_COLOR_TOKENS"
                :allow-custom="false"
                default-token="base-content"
              />
            </div>
            <div class="min-w-0">
              <ThemeColorPicker
                v-model="model.settings.header.navigationActiveBackgroundColor"
                label="Couleur de fond active de la navigation"
                :allowed-tokens="CMS_THEME_COLOR_TOKENS"
                :allow-custom="false"
                default-token="primary"
              />
            </div>
            <div class="min-w-0">
              <ThemeColorPicker
                v-model="model.settings.header.navigationActiveTextColor"
                label="Couleur du texte actif de la navigation"
                :allowed-tokens="CMS_THEME_COLOR_TOKENS"
                :allow-custom="false"
                default-token="primary-content"
              />
            </div>
            <div class="min-w-0">
              <ThemeColorPicker
                v-model="model.settings.header.navigationHoverBackgroundColor"
                label="Couleur de survol de la navigation"
                :allowed-tokens="CMS_THEME_COLOR_TOKENS"
                :allow-custom="false"
                default-token="base-200"
              />
            </div>
            <div class="min-w-0">
              <ThemeColorPicker
                v-model="model.settings.header.navigationHoverTextColor"
                label="Couleur du texte au survol"
                :allowed-tokens="CMS_THEME_COLOR_TOKENS"
                :allow-custom="false"
                default-token="base-content"
              />
            </div>
            <div class="min-w-0">
              <ThemeColorPicker
                v-model="model.settings.header.submenuBackgroundColor"
                label="Fond du sous-menu"
                :allowed-tokens="CMS_THEME_COLOR_TOKENS"
                :allow-custom="false"
                default-token="base-100"
              />
            </div>
            <div class="min-w-0">
              <ThemeColorPicker
                v-model="model.settings.header.submenuTextColor"
                label="Texte du sous-menu"
                :allowed-tokens="CMS_THEME_COLOR_TOKENS"
                :allow-custom="false"
                default-token="base-content"
              />
            </div>
          </div>

          <div class="grid gap-3">
            <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
              <input v-model="model.settings.header.showSiteName" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
              <div>
                <div class="font-medium">{{ t('admin.customizationLayoutPage.showSiteName') }}</div>
                <div class="text-sm opacity-70">{{ t('admin.customizationLayoutPage.showSiteNameHelp') }}</div>
              </div>
            </label>

            <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
              <input v-model="model.settings.header.showSiteTagline" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
              <div>
                <div class="font-medium">{{ t('admin.customizationLayoutPage.showSiteTagline') }}</div>
                <div class="text-sm opacity-70">{{ t('admin.customizationLayoutPage.showSiteTaglineHelp') }}</div>
              </div>
            </label>

            <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
              <input v-model="model.settings.header.showPrimaryNavigation" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
              <div>
                <div class="font-medium">{{ t('admin.customizationLayoutPage.showPrimaryNavigation') }}</div>
                <div class="text-sm opacity-70">{{ t('admin.customizationLayoutPage.showPrimaryNavigationHelp') }}</div>
              </div>
            </label>

            <div class="rounded-xl border border-base-300 p-4 space-y-3">
              <div class="text-sm font-semibold">Header mobile</div>

              <label class="flex items-start gap-3">
                <input v-model="model.settings.header.mobileHeaderShowSiteName" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
                <div>
                  <div class="font-medium">Afficher le nom du site</div>
                  <div class="text-sm opacity-70">Contrôle uniquement la barre du header mobile.</div>
                </div>
              </label>

              <label class="flex items-start gap-3">
                <input v-model="model.settings.header.mobileHeaderShowSiteTagline" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
                <div>
                  <div class="font-medium">Afficher la baseline</div>
                  <div class="text-sm opacity-70">À activer seulement si tu veux une barre mobile plus haute.</div>
                </div>
              </label>
            </div>

            <div class="rounded-xl border border-base-300 p-4 space-y-3">
              <div class="text-sm font-semibold">Menu mobile</div>

              <label class="flex items-start gap-3">
                <input v-model="model.settings.header.mobileMenuShowSiteName" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
                <div>
                  <div class="font-medium">Afficher le nom du site</div>
                  <div class="text-sm opacity-70">Contrôle uniquement le panneau du menu mobile.</div>
                </div>
              </label>

              <label class="flex items-start gap-3">
                <input v-model="model.settings.header.mobileMenuShowSiteTagline" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
                <div>
                  <div class="font-medium">Afficher la baseline</div>
                  <div class="text-sm opacity-70">Permet d’avoir une baseline visible dans le drawer sans l’afficher dans la barre mobile.</div>
                </div>
              </label>
            </div>

            <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
              <input v-model="model.settings.header.sticky" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
              <div>
                <div class="font-medium">{{ t('admin.customizationLayoutPage.stickyHeader') }}</div>
                <div class="text-sm opacity-70">{{ t('admin.customizationLayoutPage.stickyHeaderHelp') }}</div>
              </div>
            </label>
          </div>
        </div>

        <div
         v-if="previewDevice === 'mobile'"
         class="min-w-0 space-y-3">
          <div class="text-sm font-medium">{{ t('admin.customizationLayoutPage.previewTitle') }}</div>


          <div class="mx-auto w-full max-w-[390px] overflow-hidden rounded-[2rem] border border-base-300 bg-base-200 shadow-sm">
            <Navigation
              :preview-locale="previewLocale"
              :preview-site-config="previewSiteConfig"
              :preview-show-utility-controls="false"
              :preview-force-mobile="true"
            />
            <MobileMenu
              :preview-locale="previewLocale"
              :preview-site-config="previewSiteConfig"
              :preview-static="true"
            />
          </div>
        </div>
      </div>
    </section>
</div>
    <section class="min-w-0 space-y-5 rounded-box border border-base-300 bg-base-100 p-4 sm:p-6">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">{{ t('admin.customizationLayoutPage.socialLinksTitle') }}</h2>
          <p class="mt-1 text-sm opacity-70">{{ t('admin.customizationLayoutPage.socialLinksDescription') }}</p>
        </div>
        <button class="btn btn-outline btn-sm" @click="addSocialLink">{{ t('admin.common.add') }}</button>
      </div>

      <div class="min-w-0 space-y-4">
        <article
          v-for="(link, index) in model.settings.socialLinks"
          :key="link.id"
          class="min-w-0 rounded-2xl border border-base-300 p-5"
        >
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button type="button" class="min-w-0 flex-1 cursor-pointer text-left" @click="togglePanel(link.id)">
              <div class="flex items-center gap-2">
                <Icon :name="isPanelOpen(link.id) ? 'mdi:chevron-down' : 'mdi:chevron-right'" size="18" />
                <div class="font-medium">{{ t('admin.customizationLayoutPage.socialLinkLabel', { index: index + 1 }) }}</div>
              </div>
              <div class="mt-1 pl-6 text-xs opacity-65">
                {{ previewText(link.label) || link.href || t('admin.customizationLayoutPage.emptyContent') }}
              </div>
            </button>
            <button class="btn btn-outline btn-error btn-xs" @click="model.settings.socialLinks.splice(index, 1)">{{ t('admin.common.delete') }}</button>
          </div>

          <div v-if="isPanelOpen(link.id)" class="grid min-w-0 gap-4 lg:grid-cols-2">
            <label class="form-control min-w-0 gap-2">
              <span class="label"><span class="label-text">{{ t('admin.customizationLayoutPage.idField') }}</span></span>
              <input v-model="link.id" class="input input-bordered w-full" />
            </label>

            <AdminIconPicker v-model="link.icon" :label="t('admin.customizationLayoutPage.iconField')" />

            <label class="form-control min-w-0 gap-2 lg:col-span-2">
              <span class="label"><span class="label-text">{{ t('admin.customizationLayoutPage.urlField') }}</span></span>
              <input v-model="link.href" class="input input-bordered w-full" />
            </label>
          </div>

          <div v-if="isPanelOpen(link.id)" class="mt-4">
            <AdminPageBuilderTranslationTabs :model-value="link.label" :label="t('admin.customizationLayoutPage.labelField')" />
          </div>
        </article>
      </div>
    </section>

    <section class="min-w-0 space-y-5 rounded-box border border-base-300 bg-base-100 p-4 sm:p-6">
      <div>
        <h2 class="text-xl font-semibold">{{ t('admin.customizationLayoutPage.footerTitle') }}</h2>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.customizationLayoutPage.footerDescription') }}</p>
      </div>

      <div class="grid min-w-0 gap-4 lg:grid-cols-2">
        <label class="form-control min-w-0 gap-2">
          <span class="label"><span class="label-text">{{ t('admin.customizationLayoutPage.footerContainerWidth') }}</span></span>
          <select v-model="model.settings.footer.containerWidth" class="select select-bordered w-full">
            <option v-for="width in SECTION_CONTAINER_WIDTHS" :key="width" :value="width">
              {{ SECTION_CONTAINER_WIDTH_LABELS[width] }}
            </option>
          </select>
        </label>
        <label class="form-control min-w-0 gap-2">
          <span class="label"><span class="label-text">{{ t('admin.customizationLayoutPage.footerContainerAlign') }}</span></span>
          <select v-model="model.settings.footer.containerAlign" class="select select-bordered w-full">
            <option v-for="(label, value) in CMS_FOOTER_CONTAINER_ALIGN_LABELS" :key="value" :value="value">{{ label }}</option>
          </select>
        </label>
        <div class="min-w-0">
          <ThemeColorPicker
            v-model="model.settings.footer.backgroundColor"
            :label="t('admin.customizationLayoutPage.footerBackground')"
            :allowed-tokens="CMS_THEME_COLOR_TOKENS"
            :allow-custom="false"
            default-token="neutral"
          />
        </div>
        <div class="min-w-0">
          <ThemeColorPicker
            v-model="model.settings.footer.textColor"
            :label="t('admin.customizationLayoutPage.footerText')"
            :allowed-tokens="CMS_THEME_COLOR_TOKENS"
            :allow-custom="false"
            default-token="neutral-content"
          />
        </div>
      </div>

      <div class="overflow-hidden rounded-[2rem] border border-base-300">
        <Footer
          :preview-locale="previewLocale"
          :preview-site-config="previewSiteConfig"
        />
      </div>

      <div class="min-w-0 space-y-6">
        <article
          v-for="(column, columnIndex) in model.settings.footer.columns"
          :key="column.id"
          class="min-w-0 rounded-2xl border border-base-300 p-5"
        >
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button type="button" class="min-w-0 flex-1 cursor-pointer text-left" @click="togglePanel(column.id)">
              <div class="flex items-center gap-2">
                <Icon :name="isPanelOpen(column.id) ? 'mdi:chevron-down' : 'mdi:chevron-right'" size="18" />
                <h3 class="text-lg font-semibold">{{ t('admin.customizationLayoutPage.columnLabel', { index: columnIndex + 1 }) }}</h3>
              </div>
              <div class="mt-1 pl-6 text-xs opacity-65">
                {{ t('admin.customizationLayoutPage.blocksCount', { count: column.blocks.length }) }}
              </div>
            </button>
            <button v-if="isPanelOpen(column.id)" type="button" class="btn btn-outline btn-sm" @click="addFooterBlock(column, 'text')">{{ t('admin.customizationLayoutPage.addBlock') }}</button>
          </div>

          <label v-if="isPanelOpen(column.id)" class="form-control mb-4 min-w-0 gap-2">
            <span class="label"><span class="label-text">{{ t('admin.customizationLayoutPage.technicalId') }}</span></span>
            <input v-model="column.id" class="input input-bordered w-full" />
          </label>

          <div v-if="isPanelOpen(column.id)" class="mb-4 grid min-w-0 gap-4 md:grid-cols-3">
            <label class="form-control min-w-0 gap-2">
              <span class="label"><span class="label-text">{{ t('admin.customizationLayoutPage.horizontalAlign') }}</span></span>
              <select v-model="column.align" class="select select-bordered w-full">
                <option v-for="(label, value) in CMS_FOOTER_ALIGN_LABELS" :key="value" :value="value">{{ label }}</option>
              </select>
            </label>

            <label class="form-control min-w-0 gap-2">
              <span class="label"><span class="label-text">{{ t('admin.customizationLayoutPage.verticalAlign') }}</span></span>
              <select v-model="column.verticalAlign" class="select select-bordered w-full">
                <option v-for="align in VERTICAL_ALIGNS" :key="align" :value="align">{{ align }}</option>
              </select>
            </label>

            <label class="form-control min-w-0 gap-2">
              <span class="label"><span class="label-text">{{ t('admin.customizationLayoutPage.gapBetweenItems') }}</span></span>
              <input v-model.number="column.gapPx" type="number" min="4" max="64" step="2" class="input input-bordered w-full" />
            </label>
          </div>

          <div v-if="isPanelOpen(column.id)" class="min-w-0 space-y-4">
            <article
              v-for="(block, blockIndex) in column.blocks"
              :key="block.id"
              class="min-w-0 rounded-xl border border-base-300 p-4"
            >
              <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
                <button type="button" class="min-w-0 flex-1 cursor-pointer text-left" @click="togglePanel(block.id)">
                  <div class="flex items-center gap-2">
                    <Icon :name="isPanelOpen(block.id) ? 'mdi:chevron-down' : 'mdi:chevron-right'" size="18" />
                     <div class="font-medium">{{ t('admin.customizationLayoutPage.blockLabel', { index: blockIndex + 1 }) }}</div>
                  </div>
                  <div class="mt-1 pl-6 text-xs opacity-65">
                    {{ footerBlockSummary(block) }}
                  </div>
                </button>
                <div class="flex flex-wrap gap-2">
                  <button type="button" class="btn btn-xs" :disabled="blockIndex === 0" @click="moveFooterBlock(column, blockIndex, -1)">{{ t('admin.customizationLayoutPage.moveUp') }}</button>
                  <button type="button" class="btn btn-xs" :disabled="blockIndex === column.blocks.length - 1" @click="moveFooterBlock(column, blockIndex, 1)">{{ t('admin.customizationLayoutPage.moveDown') }}</button>
                  <button type="button" class="btn btn-xs btn-outline" @click="duplicateFooterBlock(column, blockIndex)">{{ t('admin.common.duplicate') }}</button>
                  <button type="button" class="btn btn-xs btn-outline btn-error" @click="removeFooterBlock(column, blockIndex)">{{ t('admin.common.delete') }}</button>
                </div>
              </div>

              <label v-if="isPanelOpen(block.id)" class="form-control min-w-0 gap-2">
                <span class="label"><span class="label-text">{{ t('admin.customizationLayoutPage.blockType') }}</span></span>
                <select v-model="block.type" class="select select-bordered w-full">
                  <option v-for="type in footerBlockTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
                </select>
              </label>

              <div v-if="isPanelOpen(block.id) && (block.type === 'title' || block.type === 'text')" class="mt-4">
                <AdminPageBuilderTranslationTabs :model-value="ensureBlockText(block)" :label="block.type === 'title' ? t('admin.customizationLayoutPage.titleField') : t('admin.customizationLayoutPage.textField')" :multiline="block.type === 'text'" />
              </div>

              <div v-if="isPanelOpen(block.id) && block.type === 'navigation'" class="mt-4">
                <label class="form-control min-w-0 gap-2">
                  <span class="label"><span class="label-text">{{ t('admin.customizationLayoutPage.injectedMenu') }}</span></span>
                  <select v-model="block.navigationMenu" class="select select-bordered w-full">
                    <option value="PRIMARY">{{ t('admin.customizationLayoutPage.headerTitle') }}</option>
                    <option value="FOOTER">{{ t('admin.customizationLayoutPage.footerTitle') }}</option>
                  </select>
                </label>
              </div>
            </article>

            <div v-if="!column.blocks.length" class="rounded-xl border border-dashed border-base-300 p-4 text-sm opacity-70">
              {{ t('admin.customizationLayoutPage.noBlocks') }}
            </div>
          </div>
        </article>
      </div>

      <AdminPageBuilderTranslationTabs :model-value="model.settings.footer.copyright" :label="t('admin.customizationLayoutPage.footerBottomText')" />
    </section>
  </div>
</template>

<script setup lang="ts">
import ImageInput from '#modula/components/ImageInput.vue'
import AdminIconPicker from '#modula/components/admin/IconPicker.vue'
import ThemeColorPicker from '#modula/components/admin/ThemeColorPicker.vue'
import AdminPageBuilderTranslationTabs from '#modula/components/admin/page-builder/TranslationTabs.vue'
import Footer from '#modula/components/layout/Footer.vue'
import MobileMenu from '#modula/components/layout/MobileMenu.vue'
import Navigation from '#modula/components/layout/Navigation.vue'
import { ADMIN_I18N_PATHS } from '#modula/shared/adminRoutes'
import {
  CMS_FOOTER_ALIGN_LABELS,
  CMS_FOOTER_CONTAINER_ALIGN_LABELS,
  CMS_HEADER_MOBILE_LOGO_POSITIONS,
  CMS_HEADER_NAVIGATION_STYLES,
  CMS_HEADER_SUBMENU_ANIMATIONS,
  CMS_HEADER_SUBMENU_TRIGGERS,
  CMS_THEME_COLOR_TOKENS,
  buildResolvedNavigationPreview,
  createCmsFooterBlock,
  createEmptyCmsLocalizedText,
  type PublicSiteShell,
  type CmsFooterBlock,
  type CmsFooterColumn,
  type CmsLocalizedText,
  type CmsNavigationItemPayload,
  type CmsSiteSettings
} from '#modula/shared/cms'
import type { ThemeColorSelection } from '#modula/shared/pageBuilder'
import { SECTION_CONTAINER_WIDTH_LABELS, SECTION_CONTAINER_WIDTHS, VERTICAL_ALIGNS } from '#modula/shared/pageBuilder'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.customizationLayout
  }
})

interface SiteShellModel {
  settings: CmsSiteSettings
  navigation: Array<CmsNavigationItemPayload & { id?: number | null }>
}

const { $toast } = useNuxtApp() as any
const { t } = useI18n()
const footerBlockTypes = [
  { value: 'logo', label: t('admin.customizationLayoutPage.blockTypes.logo') },
  { value: 'site-name', label: t('admin.customizationLayoutPage.blockTypes.siteName') },
  { value: 'site-tagline', label: t('admin.customizationLayoutPage.blockTypes.siteTagline') },
  { value: 'title', label: t('admin.customizationLayoutPage.blockTypes.title') },
  { value: 'text', label: t('admin.customizationLayoutPage.blockTypes.text') },
  { value: 'opening-hours', label: t('admin.customizationLayoutPage.blockTypes.openingHours') },
  { value: 'contact', label: t('admin.customizationLayoutPage.blockTypes.contact') },
  { value: 'social-links', label: t('admin.customizationLayoutPage.blockTypes.socialLinks') },
  { value: 'navigation', label: t('admin.customizationLayoutPage.blockTypes.navigation') }
] as const

const headerNavigationStyleLabels = {
  ghost: 'Léger',
  soft: 'Pilules douces',
  outline: 'Pilules contour',
  solid: 'Pilules pleines',
  menu: 'Menu DaisyUI',
  underline: 'Souligné'
} as const

const headerSubmenuTriggerLabels = {
  hover: 'Au survol',
  click: 'Au clic'
} as const

const headerSubmenuAnimationLabels = {
  none: 'Aucune',
  fade: 'Fondu',
  scale: 'Zoom',
  slide: 'Glissement'
} as const

const headerMobileLogoPositionLabels = {
  left: 'À gauche',
  right: 'À droite'
} as const

const headerMobileBurgerPositionLabels = {
  left: 'À gauche',
  right: 'À droite'
} as const

const saving = ref(false)
const previewLocale = ref<'fr' | 'en'>('fr')
const previewDevice = ref<'desktop' | 'mobile'>('desktop')
const openPanelIds = ref<string[]>([])
const cloneFooterData = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const { data } = await useFetch<SiteShellModel>('/api/admin/cms/site-shell')
const { data: settingsData } = await useFetch<{
  farmPickup: {
    address: string
    dayOfWeek: number
    startTime: string
    endTime: string
  }
  contactEmail: string
  adminPhone: string
}>('/api/admin/settings')

if (!data.value) {
  throw createError({ statusCode: 500, statusMessage: t('admin.customizationLayoutPage.loadError') })
}

const model = reactive<SiteShellModel>(structuredClone(data.value))
const publicPhone = ref(settingsData.value?.adminPhone ?? '')
const contactEmail = ref(settingsData.value?.contactEmail ?? '')
const farmOpening = reactive({
  address: settingsData.value?.farmPickup.address ?? '',
  dayOfWeek: settingsData.value?.farmPickup.dayOfWeek ?? 5,
  startTime: settingsData.value?.farmPickup.startTime ?? '17:30',
  endTime: settingsData.value?.farmPickup.endTime ?? '19:00'
})

watchEffect(() => {
  if (!settingsData.value) return
  farmOpening.address = settingsData.value.farmPickup.address
  farmOpening.dayOfWeek = settingsData.value.farmPickup.dayOfWeek
  farmOpening.startTime = settingsData.value.farmPickup.startTime
  farmOpening.endTime = settingsData.value.farmPickup.endTime
  publicPhone.value = settingsData.value.adminPhone
  contactEmail.value = settingsData.value.contactEmail
})

const previewNavigation = computed(() => buildResolvedNavigationPreview(model.navigation))
const previewSiteConfig = computed(() => ({
  inDevelopment: false,
  registerEnabled: true,
  adminPhone: publicPhone.value,
  contactEmail: contactEmail.value,
  farmPickup: {
    address: farmOpening.address,
    dayOfWeek: farmOpening.dayOfWeek,
    startTime: farmOpening.startTime,
    endTime: farmOpening.endTime,
    slotLabel: ''
  },
  cms: {
    settings: model.settings,
    navigation: previewNavigation.value
  } as PublicSiteShell
}))

const previewText = (value: CmsLocalizedText | null | undefined) => {
  if (!value) return ''
  return previewLocale.value === 'en' ? value.en : value.fr
}

const mixColor = (color: string, opacity: number) => {
  if (opacity >= 1) return color
  const percent = Math.max(0, Math.min(100, Math.round(opacity * 100)))
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}

const colorToCss = (selection?: ThemeColorSelection | null, opacity = 1) => {
  if (!selection) return ''
  const selectionOpacity = typeof selection.opacity === 'number'
    ? Math.max(0, Math.min(100, selection.opacity)) / 100
    : 1
  const finalOpacity = opacity * selectionOpacity
  switch (selection.token) {
    case 'transparent': return 'transparent'
    case 'white': return mixColor('#ffffff', finalOpacity)
    case 'white-90': return `rgba(255,255,255,${0.9 * finalOpacity})`
    case 'white-70': return `rgba(255,255,255,${0.7 * finalOpacity})`
    case 'white-10': return `rgba(255,255,255,${0.1 * finalOpacity})`
    case 'custom': return selection.customHex ? mixColor(selection.customHex, finalOpacity) : ''
    default: return mixColor(`var(--color-${selection.token})`, finalOpacity)
  }
}

const selectionToStyle = (selection?: ThemeColorSelection | null, cssProperty: 'backgroundColor' | 'color' = 'backgroundColor') => {
  const value = colorToCss(selection)
  return value ? { [cssProperty]: value } : {}
}

const dayLabels = {
  fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
}
const openingHoursPreview = computed(() => {
  const day = dayLabels[previewLocale.value][farmOpening.dayOfWeek] || dayLabels[previewLocale.value][5]
  return previewLocale.value === 'en'
    ? `Every ${day} from ${farmOpening.startTime.replace(':', 'h')} to ${farmOpening.endTime.replace(':', 'h')}`
    : `Tous les ${day} de ${farmOpening.startTime.replace(':', 'h')} à ${farmOpening.endTime.replace(':', 'h')}`
})

const primaryNavigationPreview = computed(() =>
  model.navigation.filter((item) => item.menu === 'PRIMARY' && item.visible).sort((a, b) => a.position - b.position)
)

const primaryNavigationRootPreview = computed(() =>
  primaryNavigationPreview.value.filter((item) => !item.parentItemKey)
)

const firstDesktopSubmenuPreview = computed(() => {
  const parent = primaryNavigationRootPreview.value.find(item =>
    primaryNavigationPreview.value.some(child => child.parentItemKey === item.navigationItemKey)
  )
  if (!parent) return null
  return {
    parent,
    children: primaryNavigationPreview.value.filter(child => child.parentItemKey === parent.navigationItemKey)
  }
})

const getMenuPreviewItems = (menu: 'PRIMARY' | 'FOOTER') =>
  model.navigation.filter((item) => item.menu === menu && item.visible).sort((a, b) => a.position - b.position)

const addSocialLink = () => {
  const id = `social-${Date.now()}`
  model.settings.socialLinks.push({
    id,
    label: { fr: '', en: '' },
    href: '',
    icon: ''
  })
  openPanel(id)
}

const ensureBlockText = (block: CmsFooterBlock) => {
  if (!block.text) {
    block.text = createEmptyCmsLocalizedText()
  }
  return block.text
}

const addFooterBlock = (column: CmsFooterColumn, type: CmsFooterBlock['type']) => {
  const block = createCmsFooterBlock(type, column.blocks.length + 1)
  column.blocks.push(block)
  openPanel(block.id)
}

const moveFooterBlock = (column: CmsFooterColumn, index: number, direction: -1 | 1) => {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= column.blocks.length) return
  const [block] = column.blocks.splice(index, 1)
  if (!block) return
  column.blocks.splice(nextIndex, 0, block)
}

const removeFooterBlock = (column: CmsFooterColumn, index: number) => {
  column.blocks.splice(index, 1)
}

const duplicateFooterBlock = (column: CmsFooterColumn, index: number) => {
  const block = column.blocks[index]
  if (!block) return
  const clone = cloneFooterData(block)
  clone.id = `footer-block-${clone.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  column.blocks.splice(index + 1, 0, clone)
  openPanel(clone.id)
}

const isPanelOpen = (id: string) => openPanelIds.value.includes(id)

const openPanel = (id: string) => {
  if (!openPanelIds.value.includes(id)) {
    openPanelIds.value = [...openPanelIds.value, id]
  }
}

const togglePanel = (id: string) => {
  if (isPanelOpen(id)) {
    openPanelIds.value = openPanelIds.value.filter(panelId => panelId !== id)
    return
  }
  openPanel(id)
}

const footerBlockSummary = (block: CmsFooterBlock) => {
  switch (block.type) {
    case 'logo': return t('admin.customizationLayoutPage.blockTypes.logo')
    case 'site-name': return t('admin.customizationLayoutPage.blockTypes.siteName')
    case 'site-tagline': return t('admin.customizationLayoutPage.blockTypes.siteTagline')
    case 'opening-hours': return t('admin.customizationLayoutPage.blockTypes.openingHours')
    case 'contact': return t('admin.customizationLayoutPage.blockTypes.contact')
    case 'social-links': return t('admin.customizationLayoutPage.blockTypes.socialLinks')
    case 'navigation': return block.navigationMenu === 'PRIMARY'
      ? t('admin.customizationLayoutPage.headerMenu')
      : t('admin.customizationLayoutPage.footerMenu')
    case 'title':
    case 'text':
      return previewText(block.text) || t('admin.customizationLayoutPage.noText')
    default:
      return block.type
  }
}

const save = async () => {
  saving.value = true
  try {
    await $fetch('/api/admin/cms/site-shell', {
      method: 'PUT',
      body: model
    })
    $toast?.success(t('admin.customizationLayoutPage.saved'))
  } catch (error: any) {
    $toast?.error(error.statusMessage || t('admin.customizationLayoutPage.saveError'))
  } finally {
    saving.value = false
  }
}

</script>
