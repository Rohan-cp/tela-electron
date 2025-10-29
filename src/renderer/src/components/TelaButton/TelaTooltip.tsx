import styled from "styled-components";
import { HStack, VStack } from "../Spacer/Stack";
import { useCallback, useMemo, useState } from "react";
import telaIcon from "../../assets/icon.png";
import { useModalContext } from "@renderer/contexts/ModalContext";

type Props = {
  description?: string;
  className?: string;
  dataTestId?: string;
  whiteSpace?: "nowrap" | "normal";
};

export default function Tooltip({ className, dataTestId }: Props): JSX.Element {
  const {
    setIsChangelogModalOpen,
    setIsFeedbackFormModalOpen,
    setIsKeyboardCommandsModalOpen,
  } = useModalContext();
  const [isNewVersionAvailable] = useState(true);
  const [userMode] = useState("editor");

  const handleOpenChangelogModal = useCallback((): void => {
    setIsChangelogModalOpen(true);
  }, [setIsChangelogModalOpen]);

  const handleOpenFeedbackModal = useCallback((): void => {
    setIsFeedbackFormModalOpen(true);
  }, [setIsFeedbackFormModalOpen]);

  const handleOpenKeyboardCommandsModal = useCallback((): void => {
    setIsKeyboardCommandsModalOpen(true);
  }, [setIsKeyboardCommandsModalOpen]);

  const switchHref = useMemo((): string => {
    if (userMode === "editor") {
      return "#/";
    } else {
      return "#/";
    }
  }, [userMode]);

  return (
    <StyledTooltip className={className} data-testid={dataTestId}>
      <VStack align="center" justify="center" gap={14}>
        <div
          style={{
            display: "flex",
          }}
        >
          <img
            style={{
              width: 40,
              height: 40,
              borderRadius: "999px",
            }}
            alt="button"
            src={telaIcon}
          />

          <Title>TELA</Title>
        </div>

        <VStack>
          <Text>Version: 1.0.0</Text>
          <SmallText onClick={handleOpenChangelogModal}>changelog</SmallText>
        </VStack>
        <VStack
          style={{
            width: "100%",
            marginTop: 4,
          }}
          gap={8}
        >
          {isNewVersionAvailable && (
            <Bubble align="center" justify="center">
              Restart and update Tela
            </Bubble>
          )}

          <Bubble
            onClick={handleOpenFeedbackModal}
            align="center"
            justify="center"
          >
            Share feedback
          </Bubble>

          <Bubble
            align="center"
            justify="center"
            onClick={handleOpenKeyboardCommandsModal}
          >
            Keyboard commands
          </Bubble>

          <a
            style={{
              textDecoration: "none",
            }}
            href={switchHref}
          >
            <Bubble align="center" justify="center">
              Logout
            </Bubble>
          </a>
        </VStack>
      </VStack>
    </StyledTooltip>
  );
}

export const StyledTooltip = styled(VStack)`
  background: #eae8e2;
  border-radius: 1px;
  padding: 2px 4px;
  position: absolute;
  opacity: 0;
  transition:
    opacity 300ms ease-in-out,
    transform 300ms ease-in-out;
`;

const Bubble = styled(HStack)`
  background-color: #212121;
  color: #fff;
  border-radius: 20px;
  width: 100%;
  font-size: 13px;
  padding-top: 9px;
  padding-bottom: 9px;
  cursor: pointer;
  font-family: NM-Medium;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    color: #a4a4a4;
  }
`;

const Title = styled.span`
  font-size: 26px;
  font-family: Chiaroscura;
  color: #3c3c3c;
`;

const Text = styled.span`
  font-size: 16px;
  font-family: Geist;
  color: #3c3c3c;
`;

const SmallText = styled.div`
  font-size: 12px;
  font-family: Geist;
  color: #898989;
  text-decoration: underline;
  cursor: pointer;
`;
