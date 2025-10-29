import styled from "styled-components";
import { VStack, HStack } from "../Spacer/Stack";

type Props = {
  onClose: () => void;
};

const keyboardCommands = [
  { shortcut: "CMD + N", description: "Create a new file" },
  { shortcut: "CMD + O", description: "Open a .md new file" },
  { shortcut: "CMD + T", description: "Select text and transform it inline" },
  {
    shortcut: "CMD + L",
    description: "Open chat (optionally select text before)",
  },
  {
    shortcut: "CMD + 1",
    description: "Select a line and turn into a header 1",
  },
  {
    shortcut: "CMD + 2",
    description: "Select a line and turn into a header 2",
  },
  {
    shortcut: "Tab. Tab",
    description:
      "Hit Tab in the middle of a sentence to see a suggested autocomplete. Hit Tab again to accept the suggestion",
  },
];

export default function KeyboardCommandsModal({ onClose }: Props): JSX.Element {
  const handleBgClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <StyledModalOverlay onClick={handleBgClick} data-modal>
      <StyledModal>
        <StyledContentWrapper>
          <VStack gap={24}>
            <TitleText>Keyboard Commands</TitleText>
            <VStack gap={16}>
              {keyboardCommands.map((command, index) => (
                <HStack key={index} gap={16} align="center">
                  <ShortcutButton>{command.shortcut}</ShortcutButton>
                  <DescriptionText>{command.description}</DescriptionText>
                </HStack>
              ))}
            </VStack>
          </VStack>
        </StyledContentWrapper>
      </StyledModal>
    </StyledModalOverlay>
  );
}

const TitleText = styled.span`
  font-size: 28px;
  font-family: "Playfair Display", serif;
  font-weight: 400;
  color: #3c3c3c;
  text-align: center;
`;

const ShortcutButton = styled.div`
  background-color: #2c2c2c;
  color: white;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 20px;
  white-space: nowrap;
  min-width: 100px;
  text-align: center;
`;

const DescriptionText = styled.span`
  font-family: "Inter", sans-serif;
  font-weight: 400;
  font-size: 16px;
  color: #3c3c3c;
  flex: 1;
`;

const StyledModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const StyledModal = styled.div`
  width: 600px;
  background: #f5f2ed;
  border-radius: 16px;
  box-shadow: 0 5px 20px 0 rgba(0, 0, 0, 0.04);
`;

const StyledContentWrapper = styled.div`
  padding: 40px;
  display: flex;
  flex-direction: column;
  min-height: 300px;
`;
