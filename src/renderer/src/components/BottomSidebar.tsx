import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import ScrollProgressBar from "./ScrollProgressBar";
import { LLMAutocompleteState } from "@renderer/hooks/useLLMAutocomplete";
import { useEditorContext } from "@renderer/contexts/EditorContext";

const Text = styled.div`
  font-weight: 600;
  color: #656565;
`;

const Wrapper = styled.div`
  display: flex;
  width: 100%;
  margin-left: 20px;
  align-items: flex-start;
  min-height: 135px;
  margin-top: 18px;
  line-height: 1.2;
`;

type Props = {
  isScrolling: boolean;
  scrollPercent: number;
  charCount: number;
  wordCount: number;
  lineCount: number;
  autocompleteState?: LLMAutocompleteState;
  saveStatus?: string | null;
};

enum BottomSidebarTypes {
  FILE_STATS = "file-stats",
  SCROLL_PROGRESS = "scroll-progress",
  AUTOCOMPLETE = "autocomplete",
  SAVED_FILE = "saved-file",
  SELECTED_TEXT_STATS = "selected-text-stats",
}

export default function BottomSidebar({
  isScrolling,
  scrollPercent,
  charCount,
  wordCount,
  lineCount,
  autocompleteState,
  saveStatus,
}: Props): JSX.Element {
  const [type, setType] = useState<BottomSidebarTypes>(
    BottomSidebarTypes.FILE_STATS,
  );
  const { selectedStats } = useEditorContext();

  useEffect(() => {
    if (selectedStats) {
      setType(BottomSidebarTypes.SELECTED_TEXT_STATS);
    } else {
      setType(BottomSidebarTypes.FILE_STATS);
    }
  }, [selectedStats]);

  useEffect(() => {
    if (isScrolling) {
      setType(BottomSidebarTypes.SCROLL_PROGRESS);
    } else {
      setType(BottomSidebarTypes.FILE_STATS);
    }
  }, [isScrolling]);

  useEffect(() => {
    if (autocompleteState?.isLoading) {
      setType(BottomSidebarTypes.AUTOCOMPLETE);
    } else if (saveStatus) {
      setType(BottomSidebarTypes.SAVED_FILE);
    } else {
      setType(BottomSidebarTypes.FILE_STATS);
    }
  }, [autocompleteState?.isLoading, saveStatus]);

  const inner = useMemo(() => {
    if (type === BottomSidebarTypes.FILE_STATS) {
      const fileStatsText = `${lineCount}L ${wordCount}W ${charCount}C`;
      return <Text>{fileStatsText}</Text>;
    } else if (type === BottomSidebarTypes.AUTOCOMPLETE) {
      if (autocompleteState?.isLoading) {
        return <Text>🤖 Preparing autocomplete suggestion...</Text>;
      }
      return <Text>🤖 Ready for autocomplete</Text>;
    } else if (type === BottomSidebarTypes.SCROLL_PROGRESS) {
      return <ScrollProgressBar scrollPercent={scrollPercent} />;
    } else if (type === BottomSidebarTypes.SAVED_FILE) {
      return <Text>{saveStatus}</Text>;
    } else if (type === BottomSidebarTypes.SELECTED_TEXT_STATS) {
      if (selectedStats) {
        const { charCount, wordCount } = selectedStats;
        const selectedStatsText = `[ ${wordCount}W ${charCount}C ]`;
        return <Text style={{ color: "#fefefe" }}>{selectedStatsText}</Text>;
      } else {
        return <Text>error</Text>;
      }
    }
    return null;
  }, [
    type,
    scrollPercent,
    charCount,
    wordCount,
    lineCount,
    autocompleteState,
    selectedStats,
    saveStatus,
  ]);

  return <Wrapper>{inner}</Wrapper>;
}
