<template>
  <Teleport to="body">
    <div v-if="isVisible" class="fixed inset-0 z-[140] bg-black/30 backdrop-blur-[2px]">
      <div class="flex h-full w-full items-stretch justify-center p-0 sm:p-4">
        <div class="flex h-full w-full max-w-7xl flex-col overflow-hidden bg-base-100 shadow-2xl sm:rounded-3xl">
          <div class="flex items-center justify-between gap-4 border-b border-base-300 bg-base-100 px-4 py-3 sm:px-6">
            <div>
              <div class="text-sm opacity-60">Mode édition</div>
              <div class="text-lg font-semibold">{{ modalTitle }}</div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button type="button" class="btn btn-sm btn-outline" :disabled="loading || saving" @click="reload">Recharger</button>
              <button type="button" class="btn btn-sm btn-primary" :disabled="loading || saving || !model" @click="save">
                <span v-if="saving" class="loading loading-spinner loading-xs" />
                Enregistrer
              </button>
              <button type="button" class="btn btn-sm btn-outline" :disabled="saving" @click="handleClose">Fermer</button>
            </div>
          </div>

          <div v-if="loading" class="flex flex-1 items-center justify-center">
            <span class="loading loading-spinner loading-lg" />
          </div>

          <div v-else-if="model" class="grid min-h-0 flex-1 gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside class="border-b border-base-300 bg-base-200 p-4 lg:border-b-0 lg:border-r">
              <div class="space-y-2">
                <button type="button" class="btn w-full justify-start" :class="activeShellPanel === 'header' ? 'btn-primary' : 'btn-ghost'" @click="openShellEditor('header')">Header</button>
                <button type="button" class="btn w-full justify-start" :class="activeShellPanel === 'navigation' ? 'btn-primary' : 'btn-ghost'" @click="openShellEditor('navigation')">Navigation</button>
                <button type="button" class="btn w-full justify-start" :class="activeShellPanel === 'footer' ? 'btn-primary' : 'btn-ghost'" @click="openShellEditor('footer')">Footer</button>
              </div>
            </aside>

            <div class="min-h-0 overflow-y-auto p-4 sm:p-6">
              <div v-if="activeShellPanel === 'header'" class="space-y-4">
                <section class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100" :class="isOpen('header-layout') ? 'collapse-open' : 'collapse-close'">
                  <button type="button" class="collapse-title w-full text-left text-lg font-medium" @click="toggleAccordion('header-layout')">Structure</button>
                  <div class="collapse-content space-y-4">
                    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Hauteur desktop</span></span><input v-model.number="model.settings.header.heightPx" type="number" min="56" max="180" class="input input-bordered w-full" /></label>
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Logo desktop</span></span><input v-model.number="model.settings.header.logoHeightPx" type="number" min="24" max="160" class="input input-bordered w-full" /></label>
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Hauteur mobile</span></span><input v-model.number="model.settings.header.mobileHeightPx" type="number" min="56" max="160" class="input input-bordered w-full" /></label>
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Logo mobile</span></span><input v-model.number="model.settings.header.mobileLogoHeightPx" type="number" min="24" max="120" class="input input-bordered w-full" /></label>
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Style navigation</span></span><select v-model="model.settings.header.navigationStyle" class="select select-bordered w-full"><option v-for="style in CMS_HEADER_NAVIGATION_STYLES" :key="style" :value="style">{{ headerNavigationStyleLabels[style] }}</option></select></label>
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Ouverture sous-menu</span></span><select v-model="model.settings.header.submenuTrigger" class="select select-bordered w-full"><option v-for="trigger in CMS_HEADER_SUBMENU_TRIGGERS" :key="trigger" :value="trigger">{{ headerSubmenuTriggerLabels[trigger] }}</option></select></label>
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Animation</span></span><select v-model="model.settings.header.submenuAnimation" class="select select-bordered w-full"><option v-for="animation in CMS_HEADER_SUBMENU_ANIMATIONS" :key="animation" :value="animation">{{ headerSubmenuAnimationLabels[animation] }}</option></select></label>
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Radius sous-menu</span></span><input v-model.number="model.settings.header.submenuRadiusPx" type="number" min="0" max="40" class="input input-bordered w-full" /></label>
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Logo header mobile</span></span><select v-model="model.settings.header.mobileHeaderLogoPosition" class="select select-bordered w-full"><option v-for="position in CMS_HEADER_MOBILE_LOGO_POSITIONS" :key="position" :value="position">{{ mobilePositionLabels[position] }}</option></select></label>
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Burger mobile</span></span><select v-model="model.settings.header.mobileBurgerPosition" class="select select-bordered w-full"><option v-for="position in CMS_HEADER_MOBILE_LOGO_POSITIONS" :key="`burger-${position}`" :value="position">{{ burgerPositionLabels[position] }}</option></select></label>
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Logo menu mobile</span></span><select v-model="model.settings.header.mobileMenuLogoPosition" class="select select-bordered w-full"><option v-for="position in CMS_HEADER_MOBILE_LOGO_POSITIONS" :key="`menu-${position}`" :value="position">{{ mobilePositionLabels[position] }}</option></select></label>
                    </div>
                  </div>
                </section>

                <section class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100" :class="isOpen('header-visibility') ? 'collapse-open' : 'collapse-close'">
                  <button type="button" class="collapse-title w-full text-left text-lg font-medium" @click="toggleAccordion('header-visibility')">Affichage</button>
                  <div class="collapse-content grid gap-3 md:grid-cols-2">
                    <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4"><input v-model="model.settings.header.showSiteName" type="checkbox" class="checkbox checkbox-primary mt-0.5" /><span>Afficher le nom du site sur desktop</span></label>
                    <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4"><input v-model="model.settings.header.showSiteTagline" type="checkbox" class="checkbox checkbox-primary mt-0.5" /><span>Afficher la baseline sur desktop</span></label>
                    <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4"><input v-model="model.settings.header.mobileHeaderShowSiteName" type="checkbox" class="checkbox checkbox-primary mt-0.5" /><span>Afficher le nom du site dans le header mobile</span></label>
                    <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4"><input v-model="model.settings.header.mobileHeaderShowSiteTagline" type="checkbox" class="checkbox checkbox-primary mt-0.5" /><span>Afficher la baseline dans le header mobile</span></label>
                    <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4"><input v-model="model.settings.header.mobileMenuShowSiteName" type="checkbox" class="checkbox checkbox-primary mt-0.5" /><span>Afficher le nom du site dans le menu mobile</span></label>
                    <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4"><input v-model="model.settings.header.mobileMenuShowSiteTagline" type="checkbox" class="checkbox checkbox-primary mt-0.5" /><span>Afficher la baseline dans le menu mobile</span></label>
                    <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4"><input v-model="model.settings.header.showPrimaryNavigation" type="checkbox" class="checkbox checkbox-primary mt-0.5" /><span>Afficher la navigation principale</span></label>
                    <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4"><input v-model="model.settings.header.sticky" type="checkbox" class="checkbox checkbox-primary mt-0.5" /><span>Header sticky</span></label>
                  </div>
                </section>

                <section class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100" :class="isOpen('header-colors') ? 'collapse-open' : 'collapse-close'">
                  <button type="button" class="collapse-title w-full text-left text-lg font-medium" @click="toggleAccordion('header-colors')">Couleurs</button>
                  <div class="collapse-content grid gap-4 lg:grid-cols-2">
                    <ThemeColorPicker v-model="model.settings.header.backgroundColor" label="Fond du header" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="base-100" />
                    <ThemeColorPicker v-model="model.settings.header.textColor" label="Texte du header" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="base-content" />
                    <ThemeColorPicker v-model="model.settings.header.navigationActiveBackgroundColor" label="Fond actif navigation" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="primary" />
                    <ThemeColorPicker v-model="model.settings.header.navigationActiveTextColor" label="Texte actif navigation" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="primary-content" />
                    <ThemeColorPicker v-model="model.settings.header.navigationHoverBackgroundColor" label="Fond survol navigation" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="base-200" />
                    <ThemeColorPicker v-model="model.settings.header.navigationHoverTextColor" label="Texte survol navigation" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="base-content" />
                    <ThemeColorPicker v-model="model.settings.header.submenuBackgroundColor" label="Fond sous-menu" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="base-100" />
                    <ThemeColorPicker v-model="model.settings.header.submenuTextColor" label="Texte sous-menu" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="base-content" />
                  </div>
                </section>
              </div>

              <div v-else-if="activeShellPanel === 'navigation'" class="space-y-4">
                <section v-if="focusedNavigationItem" class="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <div class="mb-3 text-sm font-semibold">Élément ciblé</div>
                  <div class="space-y-4">
                    <div class="grid gap-4 lg:grid-cols-2">
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Titre interne</span></span><input v-model="focusedNavigationItem.title" class="input input-bordered w-full" /></label>
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Lien</span></span><input v-model="focusedNavigationItem.href" class="input input-bordered w-full" /></label>
                    </div>
                    <AdminPageBuilderTranslationTabs :model-value="focusedNavigationItem.labels" label="Libellé" />
                  </div>
                </section>

                <section class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100" :class="isOpen('nav-primary') ? 'collapse-open' : 'collapse-close'">
                  <button type="button" class="collapse-title w-full text-left text-lg font-medium" @click="toggleAccordion('nav-primary')">Navigation header</button>
                  <div class="collapse-content space-y-3">
                    <div class="flex justify-end"><button type="button" class="btn btn-sm btn-primary" @click="addNavigationItem('PRIMARY')">Ajouter un lien</button></div>
                    <article v-for="(item, index) in primaryNavigationItems" :key="item.navigationItemKey" class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100" :class="isOpen(`nav-item-${item.navigationItemKey}`) ? 'collapse-open' : 'collapse-close'">
                      <button type="button" class="collapse-title w-full text-left font-medium" @click="toggleAccordion(`nav-item-${item.navigationItemKey}`)">{{ previewText(item.labels) || item.title || `Lien ${index + 1}` }}</button>
                      <div class="collapse-content space-y-4">
                        <div class="flex flex-wrap gap-2 justify-end">
                          <button type="button" class="btn btn-xs" :disabled="index === 0" @click="moveNavigationItem('PRIMARY', index, -1)">Monter</button>
                          <button type="button" class="btn btn-xs" :disabled="index === primaryNavigationItems.length - 1" @click="moveNavigationItem('PRIMARY', index, 1)">Descendre</button>
                          <button type="button" class="btn btn-xs btn-outline" @click="duplicateNavigationItem(item)">Dupliquer</button>
                          <button type="button" class="btn btn-xs btn-outline btn-error" @click="removeNavigationItem(item.navigationItemKey)">Supprimer</button>
                        </div>
                        <div class="grid gap-4 lg:grid-cols-2">
                          <label class="form-control gap-2"><span class="label"><span class="label-text">Clé technique</span></span><input v-model="item.navigationItemKey" class="input input-bordered w-full" /></label>
                          <label class="form-control gap-2"><span class="label"><span class="label-text">Parent</span></span><select v-model="item.parentItemKey" class="select select-bordered w-full"><option :value="null">Aucun</option><option v-for="candidate in parentCandidates(item.navigationItemKey, 'PRIMARY')" :key="candidate.navigationItemKey" :value="candidate.navigationItemKey">{{ candidate.title || previewText(candidate.labels) || candidate.navigationItemKey }}</option></select></label>
                          <label class="form-control gap-2"><span class="label"><span class="label-text">Titre interne</span></span><input v-model="item.title" class="input input-bordered w-full" /></label>
                          <label class="form-control gap-2"><span class="label"><span class="label-text">Lien</span></span><input v-model="item.href" class="input input-bordered w-full" /></label>
                          <label class="form-control gap-2"><span class="label"><span class="label-text">Type</span></span><select v-model="item.itemType" class="select select-bordered w-full"><option value="APPLICATION_ROUTE">Route</option><option value="EXTERNAL_URL">URL externe</option><option value="CMS_PAGE">Page CMS</option></select></label>
                          <div class="grid gap-3 sm:grid-cols-2">
                            <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4"><input v-model="item.visible" type="checkbox" class="checkbox checkbox-primary mt-0.5" /><span>Visible</span></label>
                            <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4"><input v-model="item.newTab" type="checkbox" class="checkbox checkbox-primary mt-0.5" /><span>Nouvel onglet</span></label>
                          </div>
                        </div>
                        <AdminPageBuilderTranslationTabs :model-value="item.labels" label="Libellé" />
                      </div>
                    </article>
                  </div>
                </section>

                <section class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100" :class="isOpen('nav-footer') ? 'collapse-open' : 'collapse-close'">
                  <button type="button" class="collapse-title w-full text-left text-lg font-medium" @click="toggleAccordion('nav-footer')">Navigation footer</button>
                  <div class="collapse-content space-y-3">
                    <div class="flex justify-end"><button type="button" class="btn btn-sm btn-outline" @click="addNavigationItem('FOOTER')">Ajouter un lien</button></div>
                    <article v-for="(item, index) in footerNavigationItems" :key="item.navigationItemKey" class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100" :class="isOpen(`nav-item-${item.navigationItemKey}`) ? 'collapse-open' : 'collapse-close'">
                      <button type="button" class="collapse-title w-full text-left font-medium" @click="toggleAccordion(`nav-item-${item.navigationItemKey}`)">{{ previewText(item.labels) || item.title || `Lien ${index + 1}` }}</button>
                      <div class="collapse-content space-y-4">
                        <div class="flex flex-wrap gap-2 justify-end">
                          <button type="button" class="btn btn-xs" :disabled="index === 0" @click="moveNavigationItem('FOOTER', index, -1)">Monter</button>
                          <button type="button" class="btn btn-xs" :disabled="index === footerNavigationItems.length - 1" @click="moveNavigationItem('FOOTER', index, 1)">Descendre</button>
                          <button type="button" class="btn btn-xs btn-outline" @click="duplicateNavigationItem(item)">Dupliquer</button>
                          <button type="button" class="btn btn-xs btn-outline btn-error" @click="removeNavigationItem(item.navigationItemKey)">Supprimer</button>
                        </div>
                        <div class="grid gap-4 lg:grid-cols-2">
                          <label class="form-control gap-2"><span class="label"><span class="label-text">Titre interne</span></span><input v-model="item.title" class="input input-bordered w-full" /></label>
                          <label class="form-control gap-2"><span class="label"><span class="label-text">Lien</span></span><input v-model="item.href" class="input input-bordered w-full" /></label>
                        </div>
                        <AdminPageBuilderTranslationTabs :model-value="item.labels" label="Libellé" />
                      </div>
                    </article>
                  </div>
                </section>
              </div>

              <div v-else-if="activeShellPanel === 'footer'" class="space-y-4">
                <section v-if="focusedFooterBlock || focusedFooterColumn || focusedSocialLink" class="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <div class="mb-3 text-sm font-semibold">Élément ciblé</div>
                  <div v-if="focusedFooterBlock" class="space-y-4">
                    <div class="grid gap-4 lg:grid-cols-2">
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Type</span></span><select v-model="focusedFooterBlock.type" class="select select-bordered w-full"><option v-for="type in footerBlockTypes" :key="type" :value="type">{{ footerBlockLabels[type] }}</option></select></label>
                      <label v-if="focusedFooterBlock.type === 'navigation'" class="form-control gap-2"><span class="label"><span class="label-text">Menu</span></span><select v-model="focusedFooterBlock.navigationMenu" class="select select-bordered w-full"><option value="FOOTER">Footer</option><option value="PRIMARY">Principal</option></select></label>
                    </div>
                    <div v-if="focusedFooterBlock.type === 'title' || focusedFooterBlock.type === 'text'">
                      <AdminPageBuilderTranslationTabs :model-value="focusedFooterBlock.text!" :label="focusedFooterBlock.type === 'title' ? 'Titre' : 'Texte'" :multiline="focusedFooterBlock.type === 'text'" />
                    </div>
                  </div>
                  <div v-else-if="focusedFooterColumn" class="grid gap-4 lg:grid-cols-2">
                    <label class="form-control gap-2"><span class="label"><span class="label-text">Id</span></span><input v-model="focusedFooterColumn.id" class="input input-bordered w-full" /></label>
                    <label class="form-control gap-2"><span class="label"><span class="label-text">Alignement</span></span><select v-model="focusedFooterColumn.align" class="select select-bordered w-full"><option value="start">Début</option><option value="center">Centre</option></select></label>
                  </div>
                  <div v-else-if="focusedSocialLink" class="space-y-4">
                    <div class="grid gap-4 lg:grid-cols-2">
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Id</span></span><input v-model="focusedSocialLink.id" class="input input-bordered w-full" /></label>
                      <AdminIconPicker v-model="focusedSocialLink.icon" label="Icône" />
                      <label class="form-control gap-2 lg:col-span-2"><span class="label"><span class="label-text">URL</span></span><input v-model="focusedSocialLink.href" class="input input-bordered w-full" /></label>
                    </div>
                    <AdminPageBuilderTranslationTabs :model-value="focusedSocialLink.label" label="Label" />
                  </div>
                </section>

                <section class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100" :class="isOpen('footer-settings') ? 'collapse-open' : 'collapse-close'">
                  <button type="button" class="collapse-title w-full text-left text-lg font-medium" @click="toggleAccordion('footer-settings')">Réglages généraux</button>
                  <div class="collapse-content space-y-4">
                    <div class="grid gap-4 lg:grid-cols-2">
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Largeur du footer</span></span><select v-model="model.settings.footer.containerWidth" class="select select-bordered w-full"><option v-for="width in SECTION_CONTAINER_WIDTHS" :key="width" :value="width">{{ SECTION_CONTAINER_WIDTH_LABELS[width] }}</option></select></label>
                      <label class="form-control gap-2"><span class="label"><span class="label-text">Alignement des colonnes</span></span><select v-model="model.settings.footer.containerAlign" class="select select-bordered w-full"><option value="start">Début</option><option value="center">Centre</option><option value="between">Réparti</option></select></label>
                      <ThemeColorPicker v-model="model.settings.footer.backgroundColor" label="Fond du footer" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="neutral" />
                      <ThemeColorPicker v-model="model.settings.footer.textColor" label="Texte du footer" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="neutral-content" />
                    </div>
                    <AdminPageBuilderTranslationTabs :model-value="model.settings.footer.copyright" label="Copyright" />
                  </div>
                </section>

                <section class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100" :class="isOpen('footer-social') ? 'collapse-open' : 'collapse-close'">
                  <button type="button" class="collapse-title w-full text-left text-lg font-medium" @click="toggleAccordion('footer-social')">Réseaux sociaux</button>
                  <div class="collapse-content space-y-3">
                    <div class="flex justify-end"><button type="button" class="btn btn-sm btn-outline" @click="addSocialLink">Ajouter</button></div>
                    <article v-for="(link, index) in model.settings.socialLinks" :key="link.id" class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100" :class="isOpen(`social-${link.id}`) ? 'collapse-open' : 'collapse-close'">
                      <button type="button" class="collapse-title w-full text-left font-medium" @click="toggleAccordion(`social-${link.id}`)">{{ previewText(link.label) || `Réseau ${index + 1}` }}</button>
                      <div class="collapse-content space-y-4">
                        <div class="flex justify-end"><button type="button" class="btn btn-xs btn-outline btn-error" @click="model.settings.socialLinks.splice(index, 1)">Supprimer</button></div>
                        <div class="grid gap-4 lg:grid-cols-2">
                          <label class="form-control gap-2"><span class="label"><span class="label-text">Id</span></span><input v-model="link.id" class="input input-bordered w-full" /></label>
                          <AdminIconPicker v-model="link.icon" label="Icône" />
                          <label class="form-control gap-2 lg:col-span-2"><span class="label"><span class="label-text">URL</span></span><input v-model="link.href" class="input input-bordered w-full" /></label>
                        </div>
                        <AdminPageBuilderTranslationTabs :model-value="link.label" label="Label" />
                      </div>
                    </article>
                  </div>
                </section>

                <section class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100" :class="isOpen('footer-columns') ? 'collapse-open' : 'collapse-close'">
                  <button type="button" class="collapse-title w-full text-left text-lg font-medium" @click="toggleAccordion('footer-columns')">Colonnes et blocs</button>
                  <div class="collapse-content space-y-3">
                    <div class="flex justify-end"><button type="button" class="btn btn-sm btn-outline" @click="addFooterColumn">Ajouter une colonne</button></div>
                    <article v-for="(column, columnIndex) in model.settings.footer.columns" :key="column.id" class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100" :class="isOpen(`footer-column-${column.id}`) ? 'collapse-open' : 'collapse-close'">
                      <button type="button" class="collapse-title w-full text-left font-medium" @click="toggleAccordion(`footer-column-${column.id}`)">{{ previewText(column.title) || `Colonne ${columnIndex + 1}` }}</button>
                      <div class="collapse-content space-y-4">
                        <div class="flex flex-wrap gap-2 justify-end">
                          <button type="button" class="btn btn-xs" :disabled="columnIndex === 0" @click="moveItem(model.settings.footer.columns, columnIndex, -1)">Monter</button>
                          <button type="button" class="btn btn-xs" :disabled="columnIndex === model.settings.footer.columns.length - 1" @click="moveItem(model.settings.footer.columns, columnIndex, 1)">Descendre</button>
                          <button type="button" class="btn btn-xs btn-outline btn-error" @click="model.settings.footer.columns.splice(columnIndex, 1)">Supprimer</button>
                        </div>
                        <div class="grid gap-4 lg:grid-cols-2">
                          <label class="form-control gap-2"><span class="label"><span class="label-text">Id</span></span><input v-model="column.id" class="input input-bordered w-full" /></label>
                          <label class="form-control gap-2"><span class="label"><span class="label-text">Alignement</span></span><select v-model="column.align" class="select select-bordered w-full"><option value="start">Début</option><option value="center">Centre</option></select></label>
                          <label class="form-control gap-2"><span class="label"><span class="label-text">Alignement vertical</span></span><select v-model="column.verticalAlign" class="select select-bordered w-full"><option v-for="align in VERTICAL_ALIGNS" :key="align" :value="align">{{ align }}</option></select></label>
                          <label class="form-control gap-2"><span class="label"><span class="label-text">Espacement</span></span><input v-model.number="column.gapPx" type="number" min="0" max="48" class="input input-bordered w-full" /></label>
                        </div>
                        <div class="flex flex-wrap gap-2"><button v-for="type in footerBlockTypes" :key="type" type="button" class="btn btn-xs btn-outline" @click="addFooterBlock(column, type)">{{ footerBlockLabels[type] }}</button></div>
                        <article v-for="(block, blockIndex) in column.blocks" :key="block.id" class="collapse collapse-arrow rounded-xl border border-base-300 bg-base-200" :class="isOpen(`footer-block-${block.id}`) ? 'collapse-open' : 'collapse-close'">
                          <button type="button" class="collapse-title w-full text-left font-medium" @click="toggleAccordion(`footer-block-${block.id}`)">{{ footerBlockLabels[block.type] }}</button>
                          <div class="collapse-content space-y-4">
                            <div class="flex flex-wrap gap-2 justify-end">
                              <button type="button" class="btn btn-xs" :disabled="blockIndex === 0" @click="moveItem(column.blocks, blockIndex, -1)">Monter</button>
                              <button type="button" class="btn btn-xs" :disabled="blockIndex === column.blocks.length - 1" @click="moveItem(column.blocks, blockIndex, 1)">Descendre</button>
                              <button type="button" class="btn btn-xs btn-outline btn-error" @click="column.blocks.splice(blockIndex, 1)">Supprimer</button>
                            </div>
                            <div class="grid gap-4 lg:grid-cols-2">
                              <label class="form-control gap-2"><span class="label"><span class="label-text">Type</span></span><select v-model="block.type" class="select select-bordered w-full"><option v-for="type in footerBlockTypes" :key="type" :value="type">{{ footerBlockLabels[type] }}</option></select></label>
                              <label v-if="block.type === 'navigation'" class="form-control gap-2"><span class="label"><span class="label-text">Menu</span></span><select v-model="block.navigationMenu" class="select select-bordered w-full"><option value="FOOTER">Footer</option><option value="PRIMARY">Principal</option></select></label>
                            </div>
                            <div v-if="block.type === 'title' || block.type === 'text'">
                              <AdminPageBuilderTranslationTabs :model-value="block.text!" :label="block.type === 'title' ? 'Titre' : 'Texte'" :multiline="block.type === 'text'" />
                            </div>
                          </div>
                        </article>
                      </div>
                    </article>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import ThemeColorPicker from '#modula/components/admin/ThemeColorPicker.vue'
import AdminIconPicker from '#modula/components/admin/IconPicker.vue'
import AdminPageBuilderTranslationTabs from '#modula/components/admin/page-builder/TranslationTabs.vue'
import {
  buildResolvedNavigationPreview,
  CMS_HEADER_MOBILE_LOGO_POSITIONS,
  CMS_HEADER_NAVIGATION_STYLES,
  CMS_HEADER_SUBMENU_ANIMATIONS,
  CMS_HEADER_SUBMENU_TRIGGERS,
  createCmsFooterBlock,
  createDefaultCmsFooterColumn,
  createEmptyCmsLocalizedText,
  type CmsFooterBlock,
  type CmsFooterBlockType,
  type CmsFooterColumn,
  type CmsNavigationItemPayload,
  type CmsSocialLink
} from '#modula/shared/cms'
import { SECTION_CONTAINER_WIDTH_LABELS, SECTION_CONTAINER_WIDTHS, VERTICAL_ALIGNS } from '#modula/shared/pageBuilder'

const CMS_THEME_COLOR_TOKENS = ['base-100', 'base-200', 'base-300', 'base-content', 'primary', 'primary-content', 'secondary', 'secondary-content', 'accent', 'accent-content', 'neutral', 'neutral-content', 'info', 'success', 'warning', 'error', 'white', 'white-90', 'white-70', 'white-10', 'transparent'] as const
const footerBlockTypes: CmsFooterBlockType[] = ['logo', 'site-name', 'site-tagline', 'title', 'text', 'opening-hours', 'contact', 'social-links', 'navigation']
const footerBlockLabels: Record<CmsFooterBlockType, string> = { logo: 'Logo', 'site-name': 'Nom du site', 'site-tagline': 'Baseline', title: 'Titre', text: 'Texte', 'opening-hours': 'Horaires', contact: 'Contact', 'social-links': 'Réseaux sociaux', navigation: 'Navigation' }
const headerNavigationStyleLabels = { ghost: 'Léger', soft: 'Pilules douces', outline: 'Pilules contour', solid: 'Pilules pleines', menu: 'Menu DaisyUI', underline: 'Souligné' } as const
const headerSubmenuTriggerLabels = { hover: 'Au survol', click: 'Au clic' } as const
const headerSubmenuAnimationLabels = { none: 'Aucune', fade: 'Fondu', scale: 'Zoom', slide: 'Glissé' } as const
const mobilePositionLabels = { left: 'À gauche', right: 'À droite' } as const
const burgerPositionLabels = { left: 'Burger à gauche', right: 'Burger à droite' } as const

const { activeShellPanel, activeShellFocus, isShellEditorOpen, openShellEditor, closeShellEditor } = useCmsLiveEdit()
const router = useRouter()
const siteConfig = useSiteConfigState()
const { $toast } = useNuxtApp() as any

const model = ref<any | null>(null)
const loading = ref(false)
const saving = ref(false)
const openAccordions = ref<string[]>([])
const savedShellSnapshot = ref('')
const savedShellState = ref<any | null>(null)
let removeRouteLeaveGuard: (() => void) | null = null

const isVisible = computed(() => isShellEditorOpen.value && Boolean(activeShellPanel.value))
const shellDirty = computed(() =>
  isVisible.value
  && Boolean(savedShellSnapshot.value)
  && serializeShellState() !== savedShellSnapshot.value
)
const modalTitle = computed(() => activeShellFocus.value?.kind === 'navigation-item'
  ? 'Édition du lien de navigation'
  : activeShellFocus.value?.kind === 'footer-block'
    ? 'Édition du bloc footer'
    : activeShellFocus.value?.kind === 'footer-column'
      ? 'Édition de la colonne footer'
      : activeShellFocus.value?.kind === 'social-link'
        ? 'Édition du réseau social'
        : activeShellPanel.value === 'header'
          ? 'Header'
          : activeShellPanel.value === 'navigation'
            ? 'Navigation'
            : 'Footer')

const previewText = (value?: { fr: string, en: string } | null) => value?.fr || value?.en || ''
const cloneData = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const serializeShellState = () => JSON.stringify(model.value ?? null)
const syncShellSnapshot = () => {
  savedShellSnapshot.value = serializeShellState()
  savedShellState.value = model.value ? cloneData(model.value) : null
}
const confirmDiscardShellChanges = () => {
  if (!shellDirty.value || !import.meta.client) return true
  return window.confirm('Des modifications non sauvegardées sont en cours. Êtes-vous sûr de vouloir quitter ?')
}
const handleShellBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!shellDirty.value) return
  event.preventDefault()
  event.returnValue = ''
}
const restoreShellState = () => {
  model.value = savedShellState.value ? cloneData(savedShellState.value) : null
}

const primaryNavigationItems = computed(() => model.value?.navigation.filter((item: any) => item.menu === 'PRIMARY').sort((a: any, b: any) => a.position - b.position) ?? [])
const footerNavigationItems = computed(() => model.value?.navigation.filter((item: any) => item.menu === 'FOOTER').sort((a: any, b: any) => a.position - b.position) ?? [])
const focusedNavigationItem = computed(() => activeShellFocus.value?.kind === 'navigation-item'
  ? model.value?.navigation.find((item: any) => item.navigationItemKey === activeShellFocus.value?.key && item.menu === activeShellFocus.value?.menu) ?? null
  : null)
const focusedFooterColumn = computed<CmsFooterColumn | null>(() => activeShellFocus.value?.kind === 'footer-column'
  ? model.value?.settings.footer.columns.find((column: CmsFooterColumn) => column.id === activeShellFocus.value?.columnId) ?? null
  : null)
const focusedFooterBlock = computed<CmsFooterBlock | null>(() => {
  if (activeShellFocus.value?.kind !== 'footer-block') return null
  const column = model.value?.settings.footer.columns.find((entry: CmsFooterColumn) => entry.id === activeShellFocus.value?.columnId)
  return column?.blocks.find((block: CmsFooterBlock) => block.id === activeShellFocus.value?.blockId) ?? null
})
const focusedSocialLink = computed<CmsSocialLink | null>(() => activeShellFocus.value?.kind === 'social-link'
  ? model.value?.settings.socialLinks.find((link: CmsSocialLink) => link.id === activeShellFocus.value?.id) ?? null
  : null)

const isOpen = (id: string) => openAccordions.value.includes(id)
const toggleAccordion = (id: string) => {
  openAccordions.value = isOpen(id)
    ? openAccordions.value.filter(entry => entry !== id)
    : [...openAccordions.value, id]
}

const moveItem = <T,>(list: T[], index: number, direction: -1 | 1) => {
  const next = index + direction
  if (next < 0 || next >= list.length) return
  const [item] = list.splice(index, 1)
  if (!item) return
  list.splice(next, 0, item)
}

const parentCandidates = (currentKey: string, menu: 'PRIMARY' | 'FOOTER') =>
  (model.value?.navigation.filter((item: any) => item.menu === menu && item.navigationItemKey !== currentKey) ?? [])

const addNavigationItem = (menu: 'PRIMARY' | 'FOOTER') => {
  if (!model.value) return
  const index = model.value.navigation.filter((item: any) => item.menu === menu).length + 1
  model.value.navigation.push({
    id: null,
    menu,
    itemType: 'APPLICATION_ROUTE',
    title: `Lien ${index}`,
    labels: createEmptyCmsLocalizedText(),
    navigationItemKey: `${menu.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`,
    parentItemKey: null,
    href: '/',
    pageId: null,
    newTab: false,
    visible: true,
    position: index - 1
  })
}

const moveNavigationItem = (menu: 'PRIMARY' | 'FOOTER', index: number, direction: -1 | 1) => {
  const list = (model.value?.navigation.filter((item: any) => item.menu === menu).sort((a: any, b: any) => a.position - b.position) ?? [])
  moveItem(list, index, direction)
  const others = model.value?.navigation.filter((item: any) => item.menu !== menu) ?? []
  list.forEach((item: any, itemIndex: number) => { item.position = itemIndex })
  model.value.navigation = [...others, ...list]
}

const duplicateNavigationItem = (item: CmsNavigationItemPayload & { id?: number | null }) => {
  if (!model.value) return
  model.value.navigation.push({
    ...cloneData(item),
    id: null,
    labels: cloneData(item.labels),
    navigationItemKey: `${item.navigationItemKey}-${Math.random().toString(36).slice(2, 6)}`,
    position: model.value.navigation.filter((entry: any) => entry.menu === item.menu).length
  })
}

const removeNavigationItem = (key: string) => {
  if (!model.value) return
  model.value.navigation = model.value.navigation.filter((item: any) => item.navigationItemKey !== key && item.parentItemKey !== key)
}

const addSocialLink = () => {
  if (!model.value) return
  model.value.settings.socialLinks.push({ id: `social-${Math.random().toString(36).slice(2, 8)}`, label: createEmptyCmsLocalizedText(), href: '', icon: 'mdi:web' })
}

const addFooterColumn = () => {
  if (!model.value) return
  model.value.settings.footer.columns.push(createDefaultCmsFooterColumn(`footer-col-${Math.random().toString(36).slice(2, 8)}`))
}

const addFooterBlock = (column: CmsFooterColumn, type: CmsFooterBlockType) => {
  column.blocks.push(createCmsFooterBlock(type, column.blocks.length + 1))
}

const reload = async () => {
  if (model.value && !loading.value && !confirmDiscardShellChanges()) return
  loading.value = true
  try {
    const response = await $fetch<{ settings: any, navigation: Array<CmsNavigationItemPayload & { id?: number | null }> }>('/api/admin/cms/site-shell')
    model.value = { settings: cloneData(response.settings), navigation: cloneData(response.navigation) }
    syncShellSnapshot()
  } finally {
    loading.value = false
  }
}

const save = async () => {
  if (!model.value) return
  saving.value = true
  try {
    ;(['PRIMARY', 'FOOTER'] as const).forEach((menu) => {
      model.value.navigation.filter((item: any) => item.menu === menu).sort((a: any, b: any) => a.position - b.position).forEach((item: any, index: number) => {
        item.position = index
      })
    })
    await $fetch('/api/admin/cms/site-shell', { method: 'PUT', body: { settings: model.value.settings, navigation: model.value.navigation } })
    siteConfig.value = null
    await ensureSiteConfigState()
    syncShellSnapshot()
    $toast?.success?.('Mise en page enregistrée')
  } catch (error: any) {
    console.error('Cms shell save failed', error)
    $toast?.error?.(error?.data?.statusMessage || error?.message || 'Impossible d’enregistrer la mise en page')
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  if (!confirmDiscardShellChanges()) return
  if (shellDirty.value) restoreShellState()
  closeShellEditor()
}

onMounted(() => {
  if (!import.meta.client) return
  window.addEventListener('beforeunload', handleShellBeforeUnload)
  removeRouteLeaveGuard = router.beforeEach(() => {
    if (confirmDiscardShellChanges()) {
      if (shellDirty.value) restoreShellState()
      return true
    }
    return false
  })
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('beforeunload', handleShellBeforeUnload)
  removeRouteLeaveGuard?.()
  removeRouteLeaveGuard = null
})

watch(isVisible, async (visible) => {
  if (visible && !model.value) await reload()
})

watch([activeShellPanel, activeShellFocus], () => {
  openAccordions.value = []
  if (activeShellPanel.value === 'header') return
  if (activeShellFocus.value?.kind === 'navigation-item') {
    openAccordions.value = [activeShellFocus.value.menu === 'PRIMARY' ? 'nav-primary' : 'nav-footer', `nav-item-${activeShellFocus.value.key}`]
  }
  if (activeShellFocus.value?.kind === 'footer-column') {
    openAccordions.value = ['footer-columns', `footer-column-${activeShellFocus.value.columnId}`]
  }
  if (activeShellFocus.value?.kind === 'footer-block') {
    openAccordions.value = ['footer-columns', `footer-column-${activeShellFocus.value.columnId}`, `footer-block-${activeShellFocus.value.blockId}`]
  }
  if (activeShellFocus.value?.kind === 'social-link') {
    openAccordions.value = ['footer-social', `social-${activeShellFocus.value.id}`]
  }
})

</script>
