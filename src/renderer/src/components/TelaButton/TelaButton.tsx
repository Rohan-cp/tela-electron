import { useState } from "react";
import telaIcon from "../../assets/telaButtonIcon.png";
import TelaTooltip from "./TelaTooltip";
import styled from "styled-components";

// for now this button will not do anything
// for beta, this should allow you update the app
export default function TelaButton(): JSX.Element {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggleTooltip = (): void => {
    setShowTooltip((currVal) => !currVal);
  };

  return (
    <div onClick={handleToggleTooltip}>
      <img
        style={{
          width: 38,
          height: 38,
          cursor: "pointer",
        }}
        alt="button"
        src={telaIcon}
      />
      <StyledTooltip visible={showTooltip} />
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
  z-index: 1;
`;
