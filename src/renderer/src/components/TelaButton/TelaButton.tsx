import { useEffect, useRef, useState } from "react";
import telaIcon from "../../assets/telaButtonIcon.png";
import TelaTooltip from "./TelaTooltip";
import styled from "styled-components";

export default function TelaButton(): JSX.Element {
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggleTooltip = (): void => {
    setShowTooltip(currVal => !currVal);
  };

  useEffect(() => {
    const handleDocumentMouseDown = (event: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener("mousedown", handleDocumentMouseDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [showTooltip]);

  return (
    <div ref={containerRef}>
      <img
        style={{
          width: 38,
          height: 38,
          cursor: "pointer",
        }}
        alt="button"
        src={telaIcon}
        onClick={handleToggleTooltip}
      />
      <div onClick={() => setShowTooltip(false)}>
        <StyledTooltip visible={showTooltip} />
      </div>
    </div>
  );
}

const StyledTooltip = styled(TelaTooltip)<{ visible: boolean }>`
  opacity: ${({ visible }) => (visible ? 1 : 0)};
  border-radius: 9px;
  width: 270px;
  padding: 16px;
  right: 15px;
  top: 48px;
  z-index: 9999;
  pointer-events: ${({ visible }) => (visible ? "auto" : "none")};
`;
