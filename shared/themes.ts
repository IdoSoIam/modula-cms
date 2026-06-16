export type DaisyUiColorScheme = 'light' | 'dark'

export interface DaisyUiThemeColors {
  base100: string
  base200: string
  base300: string
  baseContent: string
  primary: string
  primaryContent: string
  secondary: string
  secondaryContent: string
  accent: string
  accentContent: string
  neutral: string
  neutralContent: string
  info: string
  infoContent: string
  success: string
  successContent: string
  warning: string
  warningContent: string
  error: string
  errorContent: string
}

export interface DaisyUiThemeTokens {
  radiusSelector: string
  radiusField: string
  radiusBox: string
  sizeSelector: string
  sizeField: string
  border: string
  depth: string
  noise: string
}

export interface DaisyUiThemeDefinition {
  id: string
  name: string
  displayName: string
  enabled: boolean
  includeInThemeSelector: boolean
  isDefault: boolean
  isDefaultDark: boolean
  colorScheme: DaisyUiColorScheme
  colors: DaisyUiThemeColors
  tokens: DaisyUiThemeTokens
}

export interface DaisyUiThemeConfig {
  enableThemeController: boolean
  themes: DaisyUiThemeDefinition[]
}

export interface PublicDaisyUiThemeMeta {
  name: string
  displayName: string
  preview: string
}

export interface PublicDaisyUiThemeConfig {
  enableThemeController: boolean
  defaultTheme: string
  themeSelectorThemes: PublicDaisyUiThemeMeta[]
  allThemeNames: string[]
  generatedCss: string
}

const DEFAULT_TOKENS: DaisyUiThemeTokens = {
  radiusSelector: '0.425rem',
  radiusField: '0.425rem',
  radiusBox: '0.5rem',
  sizeSelector: '0.25rem',
  sizeField: '0.25rem',
  border: '1px',
  depth: '1',
  noise: '0'
}

function createTheme(id: string, name: string, displayName: string, colorScheme: DaisyUiColorScheme, colors: DaisyUiThemeColors, options: Partial<DaisyUiThemeDefinition> = {}): DaisyUiThemeDefinition {
  return {
    id,
    name,
    displayName,
    enabled: options.enabled ?? true,
    includeInThemeSelector: options.includeInThemeSelector ?? true,
    isDefault: options.isDefault ?? false,
    isDefaultDark: options.isDefaultDark ?? false,
    colorScheme,
    colors,
    tokens: {
      ...DEFAULT_TOKENS,
      ...options.tokens
    }
  }
}

export function createDefaultDaisyUiThemeConfig(): DaisyUiThemeConfig {
  return {
    enableThemeController: true,
    themes: [
      createTheme('modula-studio', 'modula-studio', 'Modula Studio', 'light', {
        base100: '#f7f7fc',
        base200: '#ebeaf6',
        base300: '#ddd9ed',
        baseContent: '#1e2236',
        primary: '#4b56d2',
        primaryContent: '#f3f5ff',
        secondary: '#0f8b8d',
        secondaryContent: '#e7ffff',
        accent: '#ff8c4b',
        accentContent: '#2f1504',
        neutral: '#394062',
        neutralContent: '#e8ecff',
        info: '#3b82f6',
        infoContent: '#edf5ff',
        success: '#2f9e66',
        successContent: '#edfff5',
        warning: '#d48a2f',
        warningContent: '#311b06',
        error: '#cc3f4b',
        errorContent: '#ffedf1'
      }, { isDefault: true }),
      createTheme('modula-ocean', 'modula-ocean', 'Modula Ocean', 'light', {
        base100: '#eef7fb',
        base200: '#dff0f8',
        base300: '#c6e3f0',
        baseContent: '#153447',
        primary: '#1f7ca0',
        primaryContent: '#e8f8ff',
        secondary: '#2f67c9',
        secondaryContent: '#ecf2ff',
        accent: '#ec8d3c',
        accentContent: '#2f1705',
        neutral: '#27506a',
        neutralContent: '#e7f6ff',
        info: '#2f7fd3',
        infoContent: '#edf6ff',
        success: '#2f9e75',
        successContent: '#edfff8',
        warning: '#d09b2f',
        warningContent: '#312106',
        error: '#c34b4b',
        errorContent: '#ffefef'
      }),
      createTheme('modula-noir', 'modula-noir', 'Modula Noir', 'dark', {
        base100: '#151823',
        base200: '#1d2330',
        base300: '#283043',
        baseContent: '#e9ecff',
        primary: '#6d7dff',
        primaryContent: '#0f1224',
        secondary: '#3ec3c5',
        secondaryContent: '#082020',
        accent: '#ff9f63',
        accentContent: '#281306',
        neutral: '#394463',
        neutralContent: '#e4eaff',
        info: '#62a9ff',
        infoContent: '#081325',
        success: '#62c18d',
        successContent: '#081e13',
        warning: '#f1b35b',
        warningContent: '#2b1807',
        error: '#f57b84',
        errorContent: '#28070d'
      }, { isDefaultDark: true }),
      createTheme('modula-sunset', 'modula-sunset', 'Modula Sunset', 'light', {
        base100: '#fff6f1',
        base200: '#ffe8dc',
        base300: '#ffd6c2',
        baseContent: '#43231b',
        primary: '#cf5b3d',
        primaryContent: '#fff0ea',
        secondary: '#7f4fc3',
        secondaryContent: '#f4efff',
        accent: '#e29f38',
        accentContent: '#3a2507',
        neutral: '#614032',
        neutralContent: '#ffefe7',
        info: '#3f86c8',
        infoContent: '#eff7ff',
        success: '#4f9a64',
        successContent: '#f1fff5',
        warning: '#d0892f',
        warningContent: '#2f1c06',
        error: '#c34842',
        errorContent: '#ffefee'
      }, {
        tokens: {
          radiusBox: '1.1rem',
          radiusField: '0.5rem',
          radiusSelector: '0.5rem',
          sizeSelector: '0.25rem',
          sizeField: '0.25rem',
          border: '1px',
          depth: '0',
          noise: 'noise'
        }
      })
    ]
  }
}

export function createEmptyDaisyUiThemeDefinition(index: number): DaisyUiThemeDefinition {
  return createTheme(`theme-custom-${index}`, `custom-theme-${index}`, `Theme ${index}`, 'light', {
    base100: '#ffffff',
    base200: '#f5f5f5',
    base300: '#e5e5e5',
    baseContent: '#171717',
    primary: '#5a7d3a',
    primaryContent: '#ffffff',
    secondary: '#b07a2a',
    secondaryContent: '#ffffff',
    accent: '#c94f2c',
    accentContent: '#ffffff',
    neutral: '#404040',
    neutralContent: '#fafafa',
    info: '#2563eb',
    infoContent: '#ffffff',
    success: '#16a34a',
    successContent: '#ffffff',
    warning: '#d97706',
    warningContent: '#171717',
    error: '#dc2626',
    errorContent: '#ffffff'
  })
}

export function normalizeDaisyUiThemeConfig(value: unknown): DaisyUiThemeConfig {
  const fallback = createDefaultDaisyUiThemeConfig()
  if (!value || typeof value !== 'object') return fallback

  const source = value as Partial<DaisyUiThemeConfig> & { themes?: unknown[] }
  const normalizedThemes = Array.isArray(source.themes) && source.themes.length
    ? source.themes
      .filter((item) => typeof item === 'object' && item !== null)
      .map((theme, index) => normalizeThemeDefinition(theme as unknown as Record<string, unknown>, fallback.themes[index] ?? createEmptyDaisyUiThemeDefinition(index + 1)))
    : fallback.themes

  const themes = ensureSingleDefaultTheme(ensureSingleDefaultDarkTheme(normalizedThemes))

  return {
    enableThemeController: typeof source.enableThemeController === 'boolean' ? source.enableThemeController : fallback.enableThemeController,
    themes
  }
}

function normalizeThemeDefinition(theme: Record<string, unknown>, fallback: DaisyUiThemeDefinition): DaisyUiThemeDefinition {
  const colors = typeof theme.colors === 'object' && theme.colors !== null ? theme.colors as Record<string, unknown> : {}
  const tokens = typeof theme.tokens === 'object' && theme.tokens !== null ? theme.tokens as Record<string, unknown> : {}

  return {
    id: typeof theme.id === 'string' && theme.id.trim() ? theme.id.trim() : fallback.id,
    name: typeof theme.name === 'string' && theme.name.trim() ? theme.name.trim() : fallback.name,
    displayName: typeof theme.displayName === 'string' && theme.displayName.trim() ? theme.displayName.trim() : fallback.displayName,
    enabled: typeof theme.enabled === 'boolean' ? theme.enabled : fallback.enabled,
    includeInThemeSelector: typeof theme.includeInThemeSelector === 'boolean' ? theme.includeInThemeSelector : fallback.includeInThemeSelector,
    isDefault: typeof theme.isDefault === 'boolean' ? theme.isDefault : false,
    isDefaultDark: typeof theme.isDefaultDark === 'boolean' ? theme.isDefaultDark : false,
    colorScheme: theme.colorScheme === 'dark' ? 'dark' : 'light',
    colors: {
      base100: stringOrFallback(colors.base100, fallback.colors.base100),
      base200: stringOrFallback(colors.base200, fallback.colors.base200),
      base300: stringOrFallback(colors.base300, fallback.colors.base300),
      baseContent: stringOrFallback(colors.baseContent, fallback.colors.baseContent),
      primary: stringOrFallback(colors.primary, fallback.colors.primary),
      primaryContent: stringOrFallback(colors.primaryContent, fallback.colors.primaryContent),
      secondary: stringOrFallback(colors.secondary, fallback.colors.secondary),
      secondaryContent: stringOrFallback(colors.secondaryContent, fallback.colors.secondaryContent),
      accent: stringOrFallback(colors.accent, fallback.colors.accent),
      accentContent: stringOrFallback(colors.accentContent, fallback.colors.accentContent),
      neutral: stringOrFallback(colors.neutral, fallback.colors.neutral),
      neutralContent: stringOrFallback(colors.neutralContent, fallback.colors.neutralContent),
      info: stringOrFallback(colors.info, fallback.colors.info),
      infoContent: stringOrFallback(colors.infoContent, fallback.colors.infoContent),
      success: stringOrFallback(colors.success, fallback.colors.success),
      successContent: stringOrFallback(colors.successContent, fallback.colors.successContent),
      warning: stringOrFallback(colors.warning, fallback.colors.warning),
      warningContent: stringOrFallback(colors.warningContent, fallback.colors.warningContent),
      error: stringOrFallback(colors.error, fallback.colors.error),
      errorContent: stringOrFallback(colors.errorContent, fallback.colors.errorContent)
    },
    tokens: {
      radiusSelector: stringOrFallback(tokens.radiusSelector, fallback.tokens.radiusSelector),
      radiusField: stringOrFallback(tokens.radiusField, fallback.tokens.radiusField),
      radiusBox: stringOrFallback(tokens.radiusBox, fallback.tokens.radiusBox),
      sizeSelector: stringOrFallback(tokens.sizeSelector, fallback.tokens.sizeSelector),
      sizeField: stringOrFallback(tokens.sizeField, fallback.tokens.sizeField),
      border: stringOrFallback(tokens.border, fallback.tokens.border),
      depth: stringOrFallback(tokens.depth, fallback.tokens.depth),
      noise: stringOrFallback(tokens.noise, fallback.tokens.noise)
    }
  }
}

function stringOrFallback(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function ensureSingleDefaultTheme(themes: DaisyUiThemeDefinition[]) {
  if (themes.some((theme) => theme.isDefault)) {
    let found = false
    return themes.map((theme) => {
      if (!theme.isDefault) return theme
      if (found) return { ...theme, isDefault: false }
      found = true
      return theme
    })
  }

  return themes.map((theme, index) => ({
    ...theme,
    isDefault: index === 0
  }))
}

function ensureSingleDefaultDarkTheme(themes: DaisyUiThemeDefinition[]) {
  const darkThemes = themes.filter((theme) => theme.colorScheme === 'dark')
  if (!darkThemes.length) return themes.map((theme) => ({ ...theme, isDefaultDark: false }))

  if (darkThemes.some((theme) => theme.isDefaultDark)) {
    let found = false
    return themes.map((theme) => {
      if (!(theme.colorScheme === 'dark' && theme.isDefaultDark)) return theme
      if (found) return { ...theme, isDefaultDark: false }
      found = true
      return theme
    })
  }

  let assigned = false
  return themes.map((theme) => {
    if (theme.colorScheme !== 'dark' || assigned) return { ...theme, isDefaultDark: false }
    assigned = true
    return { ...theme, isDefaultDark: true }
  })
}

export function getDefaultThemeName(config: DaisyUiThemeConfig) {
  return config.themes.find((theme) => theme.enabled && theme.isDefault)?.name
    || config.themes.find((theme) => theme.enabled)?.name
    || createDefaultDaisyUiThemeConfig().themes[0]!.name
}

export function buildPublicDaisyUiThemeConfig(config: DaisyUiThemeConfig): PublicDaisyUiThemeConfig {
  const enabledThemes = config.themes.filter((theme) => theme.enabled)
  const defaultThemeName = getDefaultThemeName(config)
  return {
    enableThemeController: config.enableThemeController,
    defaultTheme: defaultThemeName,
    themeSelectorThemes: enabledThemes
      .filter((theme) => theme.includeInThemeSelector)
      .map((theme) => ({
        name: theme.name,
        displayName: theme.displayName,
        preview: theme.colors.base100
      })),
    allThemeNames: enabledThemes.map((theme) => theme.name),
    generatedCss: enabledThemes.map((theme) => renderDaisyUiThemeCss(theme, config.enableThemeController, theme.name === defaultThemeName)).join('\n\n')
  }
}

export function renderDaisyUiThemeCss(theme: DaisyUiThemeDefinition, includeThemeControllerSelector: boolean, includeRootSelector = false) {
  const selectors = includeRootSelector
    ? [':root', `[data-theme="${theme.name}"]`]
    : [`[data-theme="${theme.name}"]`]

  if (includeThemeControllerSelector && theme.includeInThemeSelector) {
    selectors.unshift(`:root:has(input.theme-controller[value="${theme.name}"]:checked)`)
  }

  return `${selectors.join(', ')} {
  color-scheme: ${theme.colorScheme};
  --color-base-100: ${theme.colors.base100};
  --color-base-200: ${theme.colors.base200};
  --color-base-300: ${theme.colors.base300};
  --color-base-content: ${theme.colors.baseContent};
  --color-primary: ${theme.colors.primary};
  --color-primary-content: ${theme.colors.primaryContent};
  --color-secondary: ${theme.colors.secondary};
  --color-secondary-content: ${theme.colors.secondaryContent};
  --color-accent: ${theme.colors.accent};
  --color-accent-content: ${theme.colors.accentContent};
  --color-neutral: ${theme.colors.neutral};
  --color-neutral-content: ${theme.colors.neutralContent};
  --color-info: ${theme.colors.info};
  --color-info-content: ${theme.colors.infoContent};
  --color-success: ${theme.colors.success};
  --color-success-content: ${theme.colors.successContent};
  --color-warning: ${theme.colors.warning};
  --color-warning-content: ${theme.colors.warningContent};
  --color-error: ${theme.colors.error};
  --color-error-content: ${theme.colors.errorContent};
  --radius-selector: ${theme.tokens.radiusSelector};
  --radius-field: ${theme.tokens.radiusField};
  --radius-box: ${theme.tokens.radiusBox};
  --size-selector: ${theme.tokens.sizeSelector};
  --size-field: ${theme.tokens.sizeField};
  --border: ${theme.tokens.border};
  --depth: ${theme.tokens.depth};
  --noise: ${theme.tokens.noise};
}`
}
