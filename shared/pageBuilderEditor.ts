import type {
  PageBuilderButton,
  PageBuilderCard,
  PageBuilderColumn,
  PageBuilderColumnItem,
  PageBuilderSection,
  LocalizedText
} from '~/shared/pageBuilder'

export type PageBuilderEditTarget =
  | { kind: 'section'; label: string; section: PageBuilderSection; sections: PageBuilderSection[]; sectionIndex: number }
  | { kind: 'column'; label: string; column: PageBuilderColumn; section: PageBuilderSection; columnIndex: number }
  | { kind: 'item'; label: string; item: PageBuilderColumnItem; parentItems: PageBuilderColumnItem[]; itemIndex: number }
  | { kind: 'card'; label: string; card: PageBuilderCard; parentCards: PageBuilderCard[]; cardIndex: number }
  | { kind: 'button'; label: string; button: PageBuilderButton }
  | { kind: 'text'; label: string; text: LocalizedText; multiline?: boolean; fontSize?: any }
