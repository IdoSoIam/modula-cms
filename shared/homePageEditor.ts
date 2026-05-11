import type {
  HomePageButton,
  HomePageCard,
  HomePageColumn,
  HomePageColumnItem,
  HomePageSection,
  LocalizedText
} from '~/shared/homePage'

export type HomePageEditTarget =
  | { kind: 'section'; label: string; section: HomePageSection; sections: HomePageSection[]; sectionIndex: number }
  | { kind: 'column'; label: string; column: HomePageColumn; section: HomePageSection; columnIndex: number }
  | { kind: 'item'; label: string; item: HomePageColumnItem; parentItems: HomePageColumnItem[]; itemIndex: number }
  | { kind: 'card'; label: string; card: HomePageCard; parentCards: HomePageCard[]; cardIndex: number }
  | { kind: 'button'; label: string; button: HomePageButton }
  | { kind: 'text'; label: string; text: LocalizedText; multiline?: boolean; fontSize?: any }
