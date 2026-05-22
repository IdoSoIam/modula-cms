export type CmsShellEditorPanel = 'header' | 'navigation' | 'footer'
export type CmsShellEditorFocus =
  | { kind: 'navigation-item', key: string, menu: 'PRIMARY' | 'FOOTER' }
  | { kind: 'footer-column', columnId: string }
  | { kind: 'footer-block', columnId: string, blockId: string }
  | { kind: 'social-link', id: string }

export interface CmsShellEditorState {
  panel: CmsShellEditorPanel
  focus?: CmsShellEditorFocus | null
}

export function useCmsLiveEdit() {
  const activeShellState = useState<CmsShellEditorState | null>('cms-live-edit-shell-panel', () => null)
  const activeShellPanel = computed<CmsShellEditorPanel | null>(() => activeShellState.value?.panel ?? null)
  const activeShellFocus = computed<CmsShellEditorFocus | null>(() => activeShellState.value?.focus ?? null)

  const isShellEditorOpen = computed(() => activeShellState.value !== null)

  const openShellEditor = (
    panelOrState: CmsShellEditorPanel | CmsShellEditorState,
    focus?: CmsShellEditorFocus | null
  ) => {
    activeShellState.value = typeof panelOrState === 'string'
      ? { panel: panelOrState, focus: focus ?? null }
      : panelOrState
  }

  const closeShellEditor = () => {
    activeShellState.value = null
  }

  return {
    activeShellState,
    activeShellPanel,
    activeShellFocus,
    isShellEditorOpen,
    openShellEditor,
    closeShellEditor
  }
}
