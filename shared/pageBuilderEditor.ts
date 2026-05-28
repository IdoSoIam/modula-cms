import type {
  PageBuilderButton,
  PageBuilderCard,
  PageBuilderColumn,
  PageBuilderColumnItem,
  PageBuilderSectionItem,
  PageBuilderSection,
  LocalizedText
} from '#modula/shared/pageBuilder'

export type PageBuilderEditableItem = PageBuilderColumnItem | PageBuilderSectionItem

export type PageBuilderEditTarget =
  | { kind: 'section'; label: string; section: PageBuilderSection; sections: PageBuilderSection[]; sectionIndex: number }
  | { kind: 'column'; label: string; column: PageBuilderColumn; section: PageBuilderSection; columnIndex: number }
  | { kind: 'item'; label: string; item: PageBuilderEditableItem; parentItems: PageBuilderEditableItem[]; itemIndex: number }
  | { kind: 'card'; label: string; card: PageBuilderCard; parentCards: PageBuilderCard[]; cardIndex: number }
  | { kind: 'button'; label: string; button: PageBuilderButton }
  | { kind: 'text'; label: string; text: LocalizedText; multiline?: boolean; fontSize?: any }
