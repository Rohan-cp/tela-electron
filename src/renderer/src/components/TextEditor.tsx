import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Subtree } from "@renderer/utils/textOps";
import { useEditorContext } from "@renderer/contexts/EditorContext";
import FloatingToolbar from "./FloatingToolbar";
import ChatAssistant from "./ChatAssistant/ChatAssistant";
import TransformModal from "./Modals/TransformModal";
import QuillEditor from "./QuillEditor/QuillEditor";
import EditorContainer from "./EditorContainer/EditorContainer";
import { useContentHandler } from "./ContentHandler/ContentHandler";
import {
  useEditorOperations,
  useSelectionHandling,
  useTransform,
  useKeyboardShortcuts,
  useMouseEvents,
  useChatAssistant,
} from "@renderer/hooks";
import {
  useLLMAutocomplete,
  LLMAutocompleteState,
} from "@renderer/hooks/useLLMAutocomplete";
import "./TextEditor.css";

type Props = {
  setCharCount: (num: number) => void;
  setWordCount: (num: number) => void;
  setLineCount: (num: number) => void;
  setTextValue: (txt: string) => void;
  setSuggestion: (newSuggestion: Suggestion | null) => void;
  setFileTree: (newFileTree: Subtree[]) => void;
  setAutocompleteState: (state: LLMAutocompleteState | null) => void;
  textValue: string;
  fileTree: Subtree[];
  suggestion?: Suggestion;
};

const TextEditor = forwardRef<{ getEditor: () => unknown }, Props>(
  function TextEditor(
    {
      setCharCount,
      setWordCount,
      setLineCount,
      setTextValue,
      setSuggestion,
      setFileTree,
      setAutocompleteState,
      textValue,
    },
    ref,
  ) {
    const [showDiffView, setShowDiffView] = useState(false);
    const [isTransformSelected, setIsTransformSelected] = useState(false);
    const [, setIsInteractingWithToolbar] = useState(false);

    const { quillRef, updateFileStats, getEditorStats, formatHeader } =
      useEditorOperations({
        setCharCount,
        setWordCount,
        setLineCount,
        setFileTree,
      });

    useImperativeHandle(ref, () => ({
      getEditor: () => quillRef.current?.getEditor(),
    }));

    const { setSelectedStats } = useEditorContext();

    const {
      showToolbar,
      setShowToolbar,
      toolbarPosition,
      setToolbarPosition,
      transformSelection,
      setTransformSelection,
      handleSelectionChange,
      handleUpdatingSelectedStats,
      scrollToHeaderHandler,
    } = useSelectionHandling({
      quillRef,
      setSelectedStats,
    });

    const {
      showLoader,
      originalText,
      suggestedText,
      transformError,
      retryCount,
      isTransformModalOpen,
      modalOriginalText,
      modalTransformedText,
      handleSubmitPromptToTransform,
      handleTransformAccept,
      handleTransformReject,
      handleTransformModalClose,
    } = useTransform({
      quillRef,
      transformSelection,
      setSuggestion,
      setShowToolbar,
    });

    const {
      state: autocompleteState,
      handleTabPress,
      handleEscapePress,
      cleanup,
    } = useLLMAutocomplete({
      quillRef,
    });

    const {
      isChatAssistantOpen,
      selectedText,
      closeChatAssistant,
      openChatAssistant,
    } = useChatAssistant();

    useKeyboardShortcuts({
      quillRef,
      formatHeader,
      setTransformSelection,
      setToolbarPosition,
      setShowToolbar,
      setIsTransformSelected,
      setSelectedText: () => {},
      setIsChatAssistantOpen: (
        open: boolean | ((prev: boolean) => boolean),
      ) => {
        if (open) {
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const selection = quill.getSelection();
            if (selection && selection.length > 0) {
              const text = quill.getText(selection.index, selection.length);
              openChatAssistant(text);
            } else {
              openChatAssistant();
            }
          } else {
            openChatAssistant();
          }
        } else {
          closeChatAssistant();
        }
      },
    });

    useMouseEvents({
      quillRef,
      setShowToolbar,
      setIsTransformSelected,
      setShowDiffView,
      setSelectedStats,
      handleUpdatingSelectedStats,
    });

    const { handleChange } = useContentHandler({
      setTextValue,
      updateFileStats,
      handleUpdatingSelectedStats,
      getEditorStats,
      setCharCount,
      setWordCount,
      setLineCount,
      quillRef,
      handleTabPress,
      handleEscapePress,
    });

    useEffect(() => {
      scrollToHeaderHandler();
    }, [scrollToHeaderHandler]);

    // Cleanup autocomplete on unmount
    useEffect(() => {
      return () => {
        cleanup();
      };
    }, [cleanup]);

    // Update parent with autocomplete state
    useEffect(() => {
      setAutocompleteState(autocompleteState);
    }, [autocompleteState, setAutocompleteState]);

    const handleChangePromptInput = (): void => {
      setIsTransformSelected(true);
      setIsInteractingWithToolbar(true);
    };

    return (
      <EditorContainer>
        <QuillEditor
          quillRef={quillRef}
          value={textValue}
          onChange={handleChange}
          onChangeSelection={handleSelectionChange}
        />
        <FloatingToolbar
          showToolbar={showToolbar}
          showDiffView={showDiffView}
          showLoader={showLoader}
          isTransformSelected={isTransformSelected}
          toolbarPosition={toolbarPosition}
          handleChangePromptInput={handleChangePromptInput}
          handleSubmitPromptToTransform={handleSubmitPromptToTransform}
          setIsInteractingWithToolbar={setIsInteractingWithToolbar}
          originalText={originalText}
          suggestedText={suggestedText}
          transformError={transformError}
          retryCount={retryCount}
        />

        <ChatAssistant
          isOpen={isChatAssistantOpen}
          onClose={closeChatAssistant}
          selectedText={selectedText}
          quillRef={quillRef}
        />

        <TransformModal
          isOpen={isTransformModalOpen}
          onClose={handleTransformModalClose}
          onAccept={handleTransformAccept}
          onReject={handleTransformReject}
          originalText={modalOriginalText}
          transformedText={modalTransformedText}
          isLoading={showLoader}
          error={transformError}
        />
      </EditorContainer>
    );
  },
);

export default TextEditor;

export type Suggestion = {
  currentWord: string;
  suggestion: string;
};
