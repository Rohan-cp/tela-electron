import styled from "styled-components";
import { secondary, tertiary } from "@renderer/colors";
import { Header, Selection, Subtree } from "@renderer/utils/textOps";
import { useEditorContext } from "@renderer/contexts/EditorContext";
import { useCallback } from "react";

type Props = {
  fileTree: Subtree[];
  fileName: string;
};

export default function LeftSidebar({
  fileTree,
  fileName,
}: Props): JSX.Element {
  const { setScrollToHeader, parentHeaderActive, parentHeader2Active } =
    useEditorContext();

  const handleHeaderClick = useCallback(
    (subtree: Subtree) => {
      setScrollToHeader({
        index: subtree.selection.index,
        length: subtree.selection.length,
        text: subtree.value,
      } as Header);
    },
    [setScrollToHeader],
  );

  const isActiveHeader = useCallback(
    (
      parentHeaderSelectionActive: Selection | null,
      currHeaderIndex: number,
    ): boolean => {
      if (parentHeaderSelectionActive) {
        const { index: parentHeaderIndex } = parentHeaderSelectionActive;
        return parentHeaderIndex === currHeaderIndex;
      } else {
        return false;
      }
    },
    [],
  );

  return (
    <SidebarWrapper>
      <div style={{ position: "relative" }}>
        {!parentHeaderActive && !parentHeader2Active && <Asterisk>*</Asterisk>}
        <TitleWrapper>{fileName}</TitleWrapper>
      </div>
      {fileTree.map((entry, idx) => (
        <div key={idx} style={{ position: "relative", cursor: "pointer" }}>
          {isActiveHeader(parentHeaderActive, entry.selection.index) && (
            <Asterisk>*</Asterisk>
          )}
          <FileNavSubheading
            onClick={() => handleHeaderClick(entry)}
            active={isActiveHeader(parentHeaderActive, entry.selection.index)}
          >
            {entry?.value}
            {entry.children.length > 0 && (
              <div style={{ paddingLeft: "16px" }}>
                {entry.children.map((child, idx) => (
                  <div
                    key={idx}
                    style={{ position: "relative", cursor: "pointer" }}
                  >
                    {isActiveHeader(
                      parentHeader2Active,
                      child.selection.index,
                    ) && <Asterisk>*</Asterisk>}
                    <FileNavSubheading
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHeaderClick(child);
                      }}
                      key={idx}
                      active={isActiveHeader(
                        parentHeader2Active,
                        child.selection.index,
                      )}
                    >
                      {child?.value}
                    </FileNavSubheading>
                  </div>
                ))}
              </div>
            )}
          </FileNavSubheading>
        </div>
      ))}
    </SidebarWrapper>
  );
}

const FileNavSubheading = styled.div<{ active: boolean }>`
  color: ${({ active }) => (active ? secondary : tertiary)};
  font-weight: 500;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SidebarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 18%;
  justify-content: flex-start;
  margin-top: 3%;
  overflow: hidden;
  font-family: SfProDisplayMedium;
  padding-left: 3.4%;
  padding-right: 5%;
`;

const TitleWrapper = styled.div`
  display: flex;
  margin-bottom: 54px;
  overflow-y: hidden;
  justify-content: space-between;
  align-items: center;
  font-family: SfProMedium;
  letter-spacing: -0.05em;
  color: #ffffff;
`;

const Asterisk = styled.div`
  position: absolute;
  left: -14px;
  top: 1.8px;
  color: ${tertiary};
  font-size: 17px;
`;
