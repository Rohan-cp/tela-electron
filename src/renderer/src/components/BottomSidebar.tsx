import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import ScrollProgressBar from './ScrollProgressBar'
import { HStack } from './Spacer/Stack'
import { LLMAutocompleteState } from '@renderer/hooks/useLLMAutocomplete'
import { useEditorContext } from '@renderer/contexts/EditorContext'

const CompletedText = styled.div`
  font-weight: 600;
  color: #ffffff;
`

const Text = styled.div`
  font-weight: 600;
  color: #656565;
`

const Wrapper = styled.div`
  display: flex;
  width: 100%;
  margin-left: 20px;
  align-items: flex-start;
  min-height: 135px;
  margin-top: 18px;
  line-height: 1.2;
`

type Props = {
  isScrolling: boolean
  scrollPercent: number
  charCount: number
  wordCount: number
  lineCount: number
  autocompleteState?: LLMAutocompleteState
  saveStatus?: string | null
}

type BottomSidebarTypes =
  | 'file-stats'
  | 'scroll-progress'
  | 'autocomplete'
  | 'saved-file'
  | 'selected-text-stats'

export default function BottomSidebar({
  isScrolling,
  scrollPercent,
  charCount,
  wordCount,
  lineCount,
  autocompleteState,
  saveStatus
}: Props): JSX.Element {
  const [type, setType] = useState<BottomSidebarTypes>('file-stats')
  const { selectedStats } = useEditorContext()

  useEffect(() => {
    if (selectedStats) {
      setType('selected-text-stats')
    } else {
      setType('file-stats')
    }
  }, [selectedStats])

  useEffect(() => {
    if (isScrolling) {
      setType('scroll-progress')
    } else {
      setType('file-stats')
    }
  }, [isScrolling])

  useEffect(() => {
    if (autocompleteState?.isActive || autocompleteState?.isLoading) {
      setType('autocomplete')
    } else {
      setType('file-stats')
    }
  }, [autocompleteState])

  useEffect(() => {
    if (saveStatus) {
      setType('saved-file')
    } else {
      setType('file-stats')
    }
  }, [saveStatus])

  const inner = useMemo(() => {
    if (type === 'file-stats') {
      const fileStatsText = `${lineCount}L ${wordCount}W ${charCount}C`
      return <Text>{fileStatsText}</Text>
    } else if (type === 'autocomplete') {
      if (autocompleteState?.isLoading) {
        return <Text>🤖 Generating suggestion...</Text>
      } else if (autocompleteState?.isActive && autocompleteState?.suggestion) {
        return (
          <HStack>
            <Text>Press Tab to accept:</Text>
            <CompletedText>{autocompleteState.suggestion}</CompletedText>
          </HStack>
        )
      } else if (autocompleteState?.error) {
        return <Text>❌ {autocompleteState.error}</Text>
      }
      return <Text>🤖 Press Tab for AI autocomplete</Text>
    } else if (type === 'scroll-progress') {
      return <ScrollProgressBar scrollPercent={scrollPercent} />
    } else if (type === 'saved-file') {
      return <Text>{saveStatus}</Text>
    } else if (type === 'selected-text-stats') {
      if (selectedStats) {
        const { charCount, wordCount } = selectedStats
        const selectedStatsText = `[ ${wordCount}W ${charCount}C ]`
        return <Text style={{ color: '#fefefe' }}>{selectedStatsText}</Text>
      } else {
        return <Text>error</Text>
      }
    }
    return null
  }, [
    type,
    scrollPercent,
    charCount,
    wordCount,
    lineCount,
    autocompleteState,
    selectedStats,
    saveStatus
  ])

  return <Wrapper>{inner}</Wrapper>
}
