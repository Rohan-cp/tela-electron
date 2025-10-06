import { useCallback, useState } from 'react'
import { useEditorContext } from '@renderer/contexts/EditorContext'
import {
  countLineBreaks,
  countWords,
  createHeaderLines,
  extractHeaders,
  getSubstring,
  Selection
} from '@renderer/utils/textOps'
import { ToolbarPosition } from '@renderer/components/FloatingToolbar'

export interface UseSelectionHandlingProps {
  quillRef: React.RefObject<any>
  setSelectedStats: (
    stats: { charCount: number; wordCount: number; lineCount: number } | null
  ) => void
}

export function useSelectionHandling({ quillRef, setSelectedStats }: UseSelectionHandlingProps) {
  const [showToolbar, setShowToolbar] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState<ToolbarPosition>({ top: 0, left: 0 })
  const [transformSelection, setTransformSelection] = useState<{
    index: number
    length: number
  } | null>(null)

  const { scrollToHeader, setScrollToHeader, setParentHeaderActive, setParentHeader2Active } =
    useEditorContext()

  const handleUpdatingSelectedStats = useCallback(
    (range: any, editor: any) => {
      if (range) {
        const { index, length } = range
        if (length > 0) {
          const fileText = editor.getText()
          const selectedText = getSubstring(fileText, index, length)
          const wordCount = countWords(selectedText ?? '')
          const lineCount = countLineBreaks(selectedText ?? '')

          setSelectedStats({
            charCount: selectedText.length,
            wordCount: wordCount,
            lineCount: lineCount
          })
        } else {
          setSelectedStats(null)
        }
      }
    },
    [setSelectedStats]
  )

  const handleSelectionChange = useCallback(
    (range: any, _source: any, editor: any) => {
      if (range) {
        const { index, length } = range

        // Update the active headers based on cursor position
        if (index !== undefined) {
          // Find the header that contains the current cursor position
          const fileText = editor.getText()
          const content = editor.getHTML()
          const headersExtracted = extractHeaders(content ?? '')
          const headerLines = createHeaderLines(fileText ?? '', headersExtracted)

          // Find the nearest headers before the cursor position
          let nearestH1: Selection | null = null
          let nearestH2: Selection | null = null
          let nearestH1Distance = Infinity
          let nearestH2Distance = Infinity

          if (headerLines) {
            // Find the nearest H1 and H2 headers before the cursor
            for (const header of headerLines) {
              const headerIndex = header.index

              // Only consider headers that are before the cursor
              if (headerIndex <= index) {
                const distance = index - headerIndex

                if (header.type === 'h1' && distance < nearestH1Distance) {
                  nearestH1 = {
                    index: header.index,
                    length: header.length
                  }
                  nearestH1Distance = distance
                } else if (header.type === 'h2' && distance < nearestH2Distance) {
                  nearestH2 = {
                    index: header.index,
                    length: header.length
                  }
                  nearestH2Distance = distance
                }
              }
            }
          }

          // Update the context - prioritize H2 over H1 for parentHeaderActive
          if (nearestH2) {
            setParentHeaderActive(null)
            setParentHeader2Active(nearestH2)
          } else if (nearestH1) {
            setParentHeaderActive(nearestH1)
            setParentHeader2Active(null)
          } else {
            // No headers found before cursor
            setParentHeaderActive(null)
            setParentHeader2Active(null)
          }
        }

        if (length > 0) {
          // Show the toolbar
          const bounds = quillRef.current?.getEditor().getBounds(index, length)

          // Fix the 'bounds' is possibly 'null' error
          if (bounds) {
            // Position the toolbar below the selection
            setToolbarPosition({
              top: bounds.bottom + 10, // 10px below the selection
              left: bounds.left
            })

            setShowToolbar(true)
          }

          handleUpdatingSelectedStats(range, editor)
        } else {
          // No text is selected, clear the selected stats
          setSelectedStats(null)
        }
      } else {
        // No range, clear the selected stats
        setSelectedStats(null)
      }
    },
    [
      handleUpdatingSelectedStats,
      setParentHeaderActive,
      setParentHeader2Active,
      setSelectedStats,
      quillRef
    ]
  )

  const scrollToHeaderHandler = useCallback(() => {
    if (scrollToHeader) {
      const quill = quillRef.current?.getEditor()
      if (!quill) return
      quill.setSelection(scrollToHeader.index, scrollToHeader.length, 'api')
      setScrollToHeader(null)
    }
  }, [scrollToHeader, quillRef, setScrollToHeader])

  return {
    showToolbar,
    setShowToolbar,
    toolbarPosition,
    setToolbarPosition,
    transformSelection,
    setTransformSelection,
    handleSelectionChange,
    handleUpdatingSelectedStats,
    scrollToHeaderHandler
  }
}
