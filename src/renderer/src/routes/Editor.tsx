/* eslint-disable @typescript-eslint/explicit-function-return-type */

declare module "react" {
  interface CSSProperties {
    WebkitAppRegion?: "drag" | "no-drag";
  }
}

import BottomSidebar from "@renderer/components/BottomSidebar";
import LeftSidebar from "@renderer/components/LeftSidebar";
import ChangelogModal from "@renderer/components/Modals/ChangelogModal";
import FeedbackFormModal from "@renderer/components/Modals/FeedbackFormModal";
import RightSidebar from "@renderer/components/RightSidebar";
import TextEditor, { Suggestion } from "@renderer/components/TextEditor";
import EditorProvider from "@renderer/contexts/EditorContext";
import { useModalContext } from "@renderer/contexts/ModalContext";
import { LLMAutocompleteState } from "@renderer/hooks/useLLMAutocomplete";
import { Subtree } from "@renderer/utils/textOps";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";

export default function Editor(): JSX.Element {
  const [pageTitle, setPageTitle] = useState<string>("Daredevil");
  const [pageDescription, setPageDescription] = useState<string>(
    "The Man without Fear",
  );
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

  const [textValue, setTextValue] = useState("");

  const {
    isFeedbackFormModalOpen,
    setIsFeedbackFormModalOpen,
    isChangelogModalOpen,
    setIsChangelogModalOpen,
  } = useModalContext();

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

  const createNewFile = useCallback(() => {
    setTextValue("");
    setPageTitle("CLAS 104");
    setPageDescription("Notes on classical mythology");
    setCurrentFilePath(null);
    setFileTree([]);
    setCharCount(0);
    setWordCount(0);
    setLineCount(1);
    setSaveStatus("new file created");
  }, []);

  useEffect(() => {
    window.electron.webFrame.setZoomFactor(1);
  }, []);

  useEffect(() => {
    if (saveStatus && saveStatusTimeoutRef.current === null) {
      saveStatusTimeoutRef.current = window.setTimeout(() => {
        setSaveStatus(null);
        saveStatusTimeoutRef.current = null;
      }, 3000);
    }
    return () => {
      if (saveStatusTimeoutRef.current) {
        clearTimeout(saveStatusTimeoutRef.current);
        saveStatusTimeoutRef.current = null;
      }
    };
  }, [saveStatus]);

  // Handle CMD+N for new file
  useEffect(() => {
    const handleNew = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "n") {
        event.preventDefault();
        createNewFile();
      }
    };

    document.addEventListener("keydown", handleNew);

    return () => {
      document.removeEventListener("keydown", handleNew);
    };
  }, [createNewFile]);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPageTitle(e.target.value);
    },
    [],
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPageDescription(e.target.value);
    },
    [],
  );

  const serializeDocument = useCallback(
    (title: string, description: string, body: string): string => {
      const safe = (val: string) => (val ?? "").replace(/\r\n|\r/g, "\n");
      const fmTitle = safe(title).replace(/"/g, '\\"');
      const fmDesc = safe(description).replace(/"/g, '\\"');
      return `---\ntitle: "${fmTitle}"\ndescription: "${fmDesc}"\n---\n\n${safe(body)}`;
    },
    [],
  );

  const parseDocument = useCallback(
    (
      content: string,
    ): { title?: string; description?: string; body: string } => {
      if (!content?.startsWith("---\n")) {
        return { body: content };
      }
      const endIdx = content.indexOf("\n---\n");
      if (endIdx === -1) {
        return { body: content };
      }
      const header = content.slice(4, endIdx); // after first '---\n'
      const body = content.slice(endIdx + 5); // after '\n---\n'
      let title: string | undefined;
      let description: string | undefined;
      header.split("\n").forEach((line) => {
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
    [],
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
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [handleScroll]);

  const handleFileCreated = useCallback(
    (_event: Electron.IpcRendererEvent, { filePath }: { filePath: string }) => {
      setCurrentFilePath(filePath);
      const fileName = filePath.split("/").pop() ?? "file";
      setSaveStatus(`created ${fileName}`);
    },
    [],
  );

  useEffect(() => {
    const handleSave = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        if (currentFilePath) {
          const serialized = serializeDocument(
            pageTitle,
            pageDescription,
            textValue,
          );
          window.api.triggerSaveDocument(currentFilePath, serialized);
          const fileName = currentFilePath.split("/").pop() ?? "file";
          setSaveStatus(`saved ${fileName}`);
        } else {
          const serialized = serializeDocument(
            pageTitle,
            pageDescription,
            textValue,
          );
          window.api.triggerCreateDocument(serialized);
          setSaveStatus("creating new file...");
        }
      }
    };

    document.addEventListener("keydown", handleSave);
    window.api.onFileCreated(handleFileCreated);

    return () => {
      document.removeEventListener("keydown", handleSave);
      window.api.removeFileCreatedListener(handleFileCreated);
    };
  }, [textValue, currentFilePath, handleFileCreated]);

  // use effect to handle opening document on CMD+o
  useEffect(() => {
    const handleOpen = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "o") {
        event.preventDefault();
        window.api.triggerOpenDocument();
      }
    };
    document.addEventListener("keydown", handleOpen);

    const handleFileOpened = (
      _event: Electron.IpcRendererEvent,
      ...args: unknown[]
    ) => {
      const data = args[0] as { filePath: string; content: string };
      const { filePath, content } = data;
      const parsed = parseDocument(content);
      setTextValue(parsed.body ?? "");
      const fallbackTitle =
        filePath.split("/").pop()?.replace(".md", "") ?? "Untitled";
      setPageTitle(parsed.title ?? fallbackTitle);
      if (parsed.description !== undefined) {
        setPageDescription(parsed.description);
      } else {
        setPageDescription((prev) => prev ?? "");
      }
      setCurrentFilePath(filePath);
    };
    window.api.onFileOpened(handleFileOpened);

    return () => {
      document.removeEventListener("keydown", handleOpen);
      window.api.removeFileOpenedListener(handleFileOpened);
    };
  }, [setTextValue, setPageTitle, setCurrentFilePath]);

  // minimize zoomfactor with CMD+'-'
  useEffect(() => {
    const handleMinimize = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "z") {
        event.preventDefault();
        window.electron.webFrame.setZoomFactor(1);
      }
    };
    document.addEventListener("keydown", handleMinimize);

    return () => {
      document.removeEventListener("keydown", handleMinimize);
    };
  }, []);

  useEffect(() => {
    window.api.notifyRouteChange("/");
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
              <StyledTitleInput
                id="documentName"
                value={pageTitle}
                onChange={handleTitleChange}
                placeholder="enter page title..."
              />
              <StyledDescriptionInput
                id="documentDescription"
                value={pageDescription}
                onChange={handleDescriptionChange}
                placeholder="enter page description..."
              />
              <ScrollableContent
                className="thin-scrollbar"
                ref={scrollContainerRef}
              >
                <TextEditor
                  setCharCount={setCharCount}
                  setWordCount={setWordCount}
                  setLineCount={setLineCount}
                  setTextValue={setTextValue}
                  setSuggestion={setSuggestion}
                  setFileTree={setFileTree}
                  setAutocompleteState={(state: unknown) =>
                    setAutocompleteState(state as LLMAutocompleteState | null)
                  }
                  fileTree={fileTree}
                  suggestion={suggestion || undefined}
                  textValue={textValue}
                />
              </ScrollableContent>
              <BottomSidebar
                charCount={charCount}
                wordCount={wordCount}
                lineCount={lineCount}
                isScrolling={isScrolling}
                scrollPercent={scrollPercent}
                saveStatus={saveStatus}
                autocompleteState={autocompleteState || undefined}
              />
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
