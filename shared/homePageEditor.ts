import type {
  HomePageButton,
  HomePageCard,
  HomePageContentBlock,
  HomePageHeroSection,
  HomePageImageBlock,
  HomePageOneColumnSection,
  HomePageTwoColumnsSection,
  LocalizedText
} from '~/shared/homePage'

export type EditableSection = HomePageTwoColumnsSection | HomePageOneColumnSection
export type EditableColumn = HomePageContentBlock | HomePageImageBlock

export type HomePageEditTarget =
  | { kind: 'hero'; label: string; hero: HomePageHeroSection }
  | { kind: 'section'; label: string; section: EditableSection }
  | { kind: 'column'; label: string; column: EditableColumn }
  | { kind: 'card'; label: string; card: HomePageCard }
  | { kind: 'button'; label: string; button: HomePageButton }
  | { kind: 'text'; label: string; text: LocalizedText; multiline?: boolean }
