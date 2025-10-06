import { Header, Selection } from '@renderer/utils/textOps'
import { createContext, memo, ReactNode, useContext, useMemo, useState } from 'react'

export type SelectedStats = {
  charCount: number
  wordCount: number
  lineCount: number
}

type EditorState = {
  scrollToHeader: Header | null
  setScrollToHeader: (header: Header | null) => void
  selectedStats: SelectedStats | null
  setSelectedStats: (selection: SelectedStats | null) => void
  parentHeaderActive: Selection | null
  setParentHeaderActive: (selection: Selection | null) => void
  parentHeader2Active: Selection | null
  setParentHeader2Active: (selection: Selection | null) => void
}

const EditorContext = createContext<EditorState | undefined>(undefined)

export const useEditorContext = (): EditorState => {
  const context = useContext(EditorContext)
  if (!context) {
    throw new Error('Attempted to use EditorContext without a provider!')
  }
  return context
}

type Props = { children: ReactNode }

const EditorProvider = memo(({ children }: Props) => {
  const [scrollToHeader, setScrollToHeader] = useState<Header | null>(null)
  const [selectedStats, setSelectedStats] = useState<SelectedStats | null>(null)
  const [parentHeaderActive, setParentHeaderActive] = useState<Selection | null>(null)
  const [parentHeader2Active, setParentHeader2Active] = useState<Selection | null>(null)

  const value = useMemo(
    () => ({
      scrollToHeader: scrollToHeader,
      setScrollToHeader: setScrollToHeader,
      selectedStats: selectedStats,
      setSelectedStats: setSelectedStats,
      parentHeaderActive: parentHeaderActive,
      setParentHeaderActive: setParentHeaderActive,
      parentHeader2Active: parentHeader2Active,
      setParentHeader2Active: setParentHeader2Active
    }),
    [
      scrollToHeader,
      setScrollToHeader,
      selectedStats,
      setSelectedStats,
      parentHeaderActive,
      setParentHeaderActive,
      parentHeader2Active,
      setParentHeader2Active
    ]
  )

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
})

EditorProvider.displayName = 'EditorProvider'

export default EditorProvider
