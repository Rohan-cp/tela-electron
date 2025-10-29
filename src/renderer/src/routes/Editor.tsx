declare module "react" {
  interface CSSProperties {
    WebkitAppRegion?: "drag" | "no-drag";
  }
}

import BottomSidebar from "@renderer/components/BottomSidebar";
import LeftSidebar from "@renderer/components/LeftSidebar";
import ChangelogModal from "@renderer/components/Modals/ChangelogModal";
import FeedbackFormModal from "@renderer/components/Modals/FeedbackFormModal";
import KeyboardCommandsModal from "@renderer/components/Modals/KeyboardCommandsModal";
import RightSidebar from "@renderer/components/RightSidebar";
import TextEditor, { Suggestion } from "@renderer/components/TextEditor";
import EditorProvider from "@renderer/contexts/EditorContext";
import { useModalContext } from "@renderer/contexts/ModalContext";
import { LLMAutocompleteState } from "@renderer/hooks/useLLMAutocomplete";
import { Subtree } from "@renderer/utils/textOps";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import InitialPrompt from "@renderer/components/InitialPrompt/InitialPrompt";
import ShimmerMessage from "@renderer/components/ShimmerMessage";
import { useChat } from "@renderer/hooks/useChat";

export default function Editor(): JSX.Element {
  const [pageTitle, setPageTitle] = useState<string>("");
  const [pageDescription, setPageDescription] = useState<string>("");
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

  const [textValue, setTextValue] = useState("");
  const [showInitialPrompt, setShowInitialPrompt] = useState<boolean>(true);
  const [isProcessingInitialMessage, setIsProcessingInitialMessage] =
    useState<boolean>(false);

  const {
    isFeedbackFormModalOpen,
    setIsFeedbackFormModalOpen,
    isChangelogModalOpen,
    setIsChangelogModalOpen,
    isKeyboardCommandsModalOpen,
    setIsKeyboardCommandsModalOpen,
  } = useModalContext();

  const {
    startNewConversation,
    sendMessage,
    isSendingMessage,
    isCreatingConversation,
  } = useChat();

  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [lineCount, setLineCount] = useState(1);

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [autocompleteState, setAutocompleteState] =
    useState<LLMAutocompleteState | null>(null);

  const [fileTree, setFileTree] = useState<Subtree[]>([]);

  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number | null>(null);
  const saveStatusTimeoutRef = useRef<number | null>(null);
  const quillRef = useRef<{
    getEditor: () => unknown;
    updateFileStats: () => void;
  } | null>(null);
  const needsFileTreeUpdate = useRef<boolean>(false);

  const createNewFile = useCallback(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      if (
        quill &&
        typeof quill === "object" &&
        "setText" in quill &&
        typeof quill.setText === "function"
      ) {
        quill.setText("");
      }
    }

    setTextValue("");
    setPageTitle("");
    setPageDescription("");
    setCurrentFilePath(null);
    setFileTree([]);
    setCharCount(0);
    setWordCount(0);
    setLineCount(1);
    setSaveStatus(null);
    setShowInitialPrompt(true);
  }, []);

  const handleInitialPromptSubmit = useCallback(
    async (message: string) => {
      try {
        setShowInitialPrompt(false);
        setIsProcessingInitialMessage(true);

        const conversation = await startNewConversation(
          "New Document",
          undefined
        );

        const response = await sendMessage(message, "", conversation.id);

        const assistantMessage = response.message;
        if (assistantMessage && assistantMessage.content) {
          setTextValue(assistantMessage.content);
          needsFileTreeUpdate.current = true;
        }

        setIsProcessingInitialMessage(false);
      } catch (error) {
        console.error("Error processing initial message:", error);
        setIsProcessingInitialMessage(false);
        setShowInitialPrompt(true);
      }
    },
    [startNewConversation, sendMessage]
  );

  useEffect(() => {
    window.electron.webFrame.setZoomFactor(1);
  }, []);

  useEffect(() => {
    if (
      !isProcessingInitialMessage &&
      needsFileTreeUpdate.current &&
      quillRef.current
    ) {
      const timeoutId = setTimeout(() => {
        if (quillRef.current?.updateFileStats) {
          quillRef.current.updateFileStats();
        }
        needsFileTreeUpdate.current = false;
      }, 100);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [isProcessingInitialMessage]);

  useEffect(() => {
    if (textValue.trim() !== "" || currentFilePath !== null) {
      setShowInitialPrompt(false);
    } else if (!isProcessingInitialMessage) {
      setShowInitialPrompt(true);
    }
  }, [textValue, currentFilePath, isProcessingInitialMessage]);

  useEffect(() => {
    if (saveStatus && saveStatusTimeoutRef.current === null) {
      saveStatusTimeoutRef.current = window.setTimeout(() => {
        setSaveStatus(null);
        saveStatusTimeoutRef.current = null;
      }, 3000);
    }
    return (): void => {
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
        saveStatusTimeoutRef.current = null;
      }
    };
  }, [saveStatus]);

  useEffect(() => {
    const handleNew = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key === "n") {
        event.preventDefault();
        createNewFile();
      }
    };

    document.addEventListener("keydown", handleNew);

    return (): void => {
      document.removeEventListener("keydown", handleNew);
    };
  }, [createNewFile]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setPageTitle(value);
      if (value.trim() !== "" && showInitialPrompt) {
        setShowInitialPrompt(false);
      }
    },
    [showInitialPrompt]
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPageDescription(e.target.value);
    },
    []
  );

  const serializeDocument = useCallback(
    (title: string, description: string, body: string): string => {
      const safe = (val: string): string =>
        (val ?? "").replace(/\r\n|\r/g, "\n");
      const fmTitle = safe(title).replace(/"/g, '\\"');
      const fmDesc = safe(description).replace(/"/g, '\\"');
      return `---\ntitle: "${fmTitle}"\ndescription: "${fmDesc}"\n---\n\n${safe(body)}`;
    },
    []
  );

  const parseDocument = useCallback(
    (
      content: string
    ): { title?: string; description?: string; body: string } => {
      if (!content?.startsWith("---\n")) {
        return { body: content };
      }
      const endIdx = content.indexOf("\n---\n");
      if (endIdx === -1) {
        return { body: content };
      }
      const header = content.slice(4, endIdx);
      const body = content.slice(endIdx + 5);
      let title: string | undefined;
      let description: string | undefined;
      header.split("\n").forEach(line => {
        const [key, ...rest] = line.split(":");
        if (!key || rest.length === 0) return;
        const rawVal = rest.join(":").trim();
        const unquoted =
          rawVal.startsWith('"') && rawVal.endsWith('"')
            ? rawVal.slice(1, -1)
            : rawVal;
        if (key.trim() === "title") title = unquoted;
        if (key.trim() === "description") description = unquoted;
      });
      return { title, description, body };
    },
    []
  );

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        scrollContainerRef.current;
      const scrollPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
      setScrollPercent(scrollPercent);
      setIsScrolling(true);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
    }
  }, []);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }
    return (): void => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  const handleFileCreated = useCallback(
    (
      _event: Electron.IpcRendererEvent,
      { filePath }: { filePath: string }
    ): void => {
      setCurrentFilePath(filePath);
      const fileName = filePath.split("/").pop() ?? "file";
      setSaveStatus(`created ${fileName}`);
    },
    []
  );

  useEffect(() => {
    const handleSave = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        if (currentFilePath) {
          const serialized = serializeDocument(
            pageTitle,
            pageDescription,
            textValue
          );
          window.api.triggerSaveDocument(currentFilePath, serialized);
          const fileName = currentFilePath.split("/").pop() ?? "file";
          setSaveStatus(`saved ${fileName}`);
        } else {
          const serialized = serializeDocument(
            pageTitle,
            pageDescription,
            textValue
          );
          window.api.triggerCreateDocument(serialized);
          setSaveStatus("creating new file...");
        }
      }
    };

    document.addEventListener("keydown", handleSave);
    window.api.onFileCreated(handleFileCreated);

    return (): void => {
      document.removeEventListener("keydown", handleSave);
      window.api.removeFileCreatedListener(handleFileCreated);
    };
  }, [textValue, currentFilePath, handleFileCreated]);

  useEffect(() => {
    const handleOpen = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key === "o") {
        event.preventDefault();
        window.api.triggerOpenDocument();
      }
    };
    document.addEventListener("keydown", handleOpen);

    const handleFileOpened = (
      _event: Electron.IpcRendererEvent,
      data: { filePath: string; content: string }
    ): void => {
      const { filePath, content } = data;
      const parsed = parseDocument(content);
      setTextValue(parsed.body ?? "");
      const fallbackTitle =
        filePath.split("/").pop()?.replace(".md", "") ?? "Untitled";
      setPageTitle(parsed.title ?? fallbackTitle);
      if (parsed.description !== undefined) {
        setPageDescription(parsed.description);
      } else {
        setPageDescription(prev => prev ?? "");
      }
      setCurrentFilePath(filePath);
    };
    window.api.onFileOpened(handleFileOpened);

    return (): void => {
      document.removeEventListener("keydown", handleOpen);
      window.api.removeFileOpenedListener(handleFileOpened);
    };
  }, [setTextValue, setPageTitle, setCurrentFilePath]);

  useEffect(() => {
    const handleMinimize = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        event.preventDefault();
        window.electron.webFrame.setZoomFactor(1);
      }
    };
    document.addEventListener("keydown", handleMinimize);

    return (): void => {
      document.removeEventListener("keydown", handleMinimize);
    };
  }, []);

  useEffect(() => {
    window.api.notifyRouteChange("/");
  }, []);

  useEffect(() => {
    window.api.maximizeWindow();
  }, []);

  return (
    <EditorProvider>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "100%",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "32px",
            backgroundColor: "#1a1a1a",
            WebkitAppRegion: "drag",
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
            width: "100%",
          }}
        >
          <div style={{ WebkitAppRegion: "no-drag" }}>
            {/* Buttons or other controls that shouldn't trigger dragging */}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            width: "100%",
            overflow: "auto",
            overflowY: "hidden",
            scrollbarWidth: "thin",
          }}
        >
          <Wrapper className="thin-scrollbar">
            <LeftSidebar fileName={pageTitle} fileTree={fileTree} />
            <MainContentWrapper>
              {!showInitialPrompt && (
                <StyledTitleInput
                  id="documentName"
                  value={pageTitle}
                  onChange={handleTitleChange}
                  placeholder="Untitled"
                />
              )}
              <StyledDescriptionInput
                id="documentDescription"
                value={pageDescription}
                onChange={handleDescriptionChange}
                placeholder="enter page description..."
                style={{ visibility: showInitialPrompt ? "hidden" : "visible" }}
              />
              <ScrollableContent
                className="thin-scrollbar"
                ref={scrollContainerRef}
              >
                {isProcessingInitialMessage ? (
                  <ShimmerMessageContainer>
                    <ShimmerMessage text="Writing your document..." />
                  </ShimmerMessageContainer>
                ) : (
                  <TextEditor
                    ref={quillRef}
                    setCharCount={setCharCount}
                    setWordCount={setWordCount}
                    setLineCount={setLineCount}
                    setTextValue={setTextValue}
                    setSuggestion={setSuggestion}
                    setFileTree={setFileTree}
                    setAutocompleteState={setAutocompleteState}
                    fileTree={fileTree}
                    suggestion={suggestion || undefined}
                    textValue={textValue}
                  />
                )}
              </ScrollableContent>
              {!showInitialPrompt && (
                <BottomSidebar
                  charCount={charCount}
                  wordCount={wordCount}
                  lineCount={lineCount}
                  isScrolling={isScrolling}
                  scrollPercent={scrollPercent}
                  saveStatus={saveStatus}
                  autocompleteState={autocompleteState || undefined}
                />
              )}
              {showInitialPrompt && (
                <PromptOverlay>
                  <InitialPrompt
                    onSubmit={handleInitialPromptSubmit}
                    isLoading={isCreatingConversation || isSendingMessage}
                  />
                </PromptOverlay>
              )}
            </MainContentWrapper>
            <RightSidebar />
            {isFeedbackFormModalOpen && (
              <FeedbackFormModal
                onClose={() => setIsFeedbackFormModalOpen(false)}
              />
            )}
            {isChangelogModalOpen && (
              <ChangelogModal onClose={() => setIsChangelogModalOpen(false)} />
            )}
            {isKeyboardCommandsModalOpen && (
              <KeyboardCommandsModal
                onClose={() => setIsKeyboardCommandsModalOpen(false)}
              />
            )}
          </Wrapper>
        </div>
      </div>
    </EditorProvider>
  );
}

const Wrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: flex-start;
  height: 100vh;
  overflow: hidden;
  font-family: Geist;
  font-weight: 500;
  scrollbar-width: thin;
`;

const MainContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 69%;
  margin-top: 3%;
  height: 100%;
  position: relative;
`;

const ScrollableContent = styled.div`
  overflow-y: auto;
  flex-grow: 1;
`;

const StyledTitleInput = styled.input`
  display: block;
  background: none;
  margin-left: 20px;
  color: #f4f4f4;
  padding: 0px;
  border: none;
  outline: none;
  width: 100%;
  font-size: 22px;
  margin-bottom: 3px;
  font-family: NM-Medium;
`;

const StyledDescriptionInput = styled.input`
  display: block;
  background: none;
  color: #888888;
  margin-left: 20px;
  padding: 0px;
  border: none;
  outline: none;
  width: 100%;
  font-size: 17px;
  margin-bottom: 16px;
  font-family: NM-Medium;
`;

const ShimmerMessageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 40px;
`;

const PromptOverlay = styled.div`
  position: absolute;
  top: 80px;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10%;
  pointer-events: none;
  z-index: 10;

  > * {
    pointer-events: auto;
  }
`;
