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
      createTheme('theme-recolte', 'recolte', 'Recolte', 'light', {
        base100: '#fbf1e0',
        base200: '#f4e0c0',
        base300: '#e8c89a',
        baseContent: '#3e2918',
        primary: '#b04a1e',
        primaryContent: '#fbf1e0',
        secondary: '#8a5a2b',
        secondaryContent: '#fbf1e0',
        accent: '#d99423',
        accentContent: '#3e2918',
        neutral: '#6e4a2a',
        neutralContent: '#fbf1e0',
        info: '#8a7250',
        infoContent: '#fbf1e0',
        success: '#7a8a3a',
        successContent: '#fbf1e0',
        warning: '#d9a233',
        warningContent: '#3e2918',
        error: '#a83817',
        errorContent: '#fbf1e0'
      }, { isDefault: true }),
      createTheme('theme-ferme', 'ferme', 'Champ ensoleille', 'light', {
        base100: '#fbf6ec',
        base200: '#f3ead4',
        base300: '#e6d8b4',
        baseContent: '#3e3325',
        primary: '#5a7d3a',
        primaryContent: '#fbf6ec',
        secondary: '#b07a2a',
        secondaryContent: '#fbf6ec',
        accent: '#c94f2c',
        accentContent: '#fbf6ec',
        neutral: '#6b5a44',
        neutralContent: '#f3ead4',
        info: '#6b8caf',
        infoContent: '#fbf6ec',
        success: '#6f8f3d',
        successContent: '#fbf6ec',
        warning: '#d99b2c',
        warningContent: '#3e3325',
        error: '#b54a2a',
        errorContent: '#fbf6ec'
      }),
      createTheme('theme-ferme-dark', 'ferme-dark', "Nuit à l'étable", 'dark', {
        base100: '#221c14',
        base200: '#2d251a',
        base300: '#3a2f22',
        baseContent: '#f3ead4',
        primary: '#8fae68',
        primaryContent: '#1a160f',
        secondary: '#d8a155',
        secondaryContent: '#1a160f',
        accent: '#d97447',
        accentContent: '#1a160f',
        neutral: '#4a3e2c',
        neutralContent: '#d9cba9',
        info: '#94b3cf',
        infoContent: '#1a160f',
        success: '#9bbd66',
        successContent: '#1a160f',
        warning: '#e0b15a',
        warningContent: '#1a160f',
        error: '#d96a52',
        errorContent: '#1a160f'
      }, { isDefaultDark: true }),
      createTheme('theme-prairie', 'prairie', 'Prairie', 'light', {
        base100: '#f4f7ec',
        base200: '#e8eed7',
        base300: '#d6e0bb',
        baseContent: '#2e3a1f',
        primary: '#4a7a32',
        primaryContent: '#f4f7ec',
        secondary: '#8fb04a',
        secondaryContent: '#2e3a1f',
        accent: '#d9b96b',
        accentContent: '#2e3a1f',
        neutral: '#5d6b3f',
        neutralContent: '#f4f7ec',
        info: '#7fa07a',
        infoContent: '#f4f7ec',
        success: '#6a994e',
        successContent: '#f4f7ec',
        warning: '#c9a94a',
        warningContent: '#2e3a1f',
        error: '#b54a2a',
        errorContent: '#f4f7ec'
      }),
      createTheme('theme-lavande', 'lavande', 'Lavande', 'light', {
        base100: '#f6f2f8',
        base200: '#ebe2ee',
        base300: '#d8c8de',
        baseContent: '#3a2e44',
        primary: '#7a5da8',
        primaryContent: '#f6f2f8',
        secondary: '#b3996b',
        secondaryContent: '#f6f2f8',
        accent: '#d99b8a',
        accentContent: '#3a2e44',
        neutral: '#5e4a6e',
        neutralContent: '#f6f2f8',
        info: '#8aa3c9',
        infoContent: '#f6f2f8',
        success: '#7a9a6a',
        successContent: '#f6f2f8',
        warning: '#d4a85c',
        warningContent: '#3a2e44',
        error: '#b9534a',
        errorContent: '#f6f2f8'
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
  return {
    enableThemeController: config.enableThemeController,
    defaultTheme: getDefaultThemeName(config),
    themeSelectorThemes: enabledThemes
      .filter((theme) => theme.includeInThemeSelector)
      .map((theme) => ({
        name: theme.name,
        displayName: theme.displayName,
        preview: theme.colors.base100
      })),
    allThemeNames: enabledThemes.map((theme) => theme.name),
    generatedCss: enabledThemes.map((theme) => renderDaisyUiThemeCss(theme, config.enableThemeController)).join('\n\n')
  }
}

export function renderDaisyUiThemeCss(theme: DaisyUiThemeDefinition, includeThemeControllerSelector: boolean) {
  const selectors = [
    `[data-theme="${theme.name}"]`
  ]

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
