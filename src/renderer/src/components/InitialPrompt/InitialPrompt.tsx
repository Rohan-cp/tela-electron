import { useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import telaIconRound from "../../assets/telaIconRound.svg";
import UpArrowIcon from "../../assets/UpArrowIcon.svg";

interface InitialPromptProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
}

export default function InitialPrompt({
  onSubmit,
  isLoading = false,
}: InitialPromptProps): JSX.Element {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim() || isLoading) {
      return;
    }
    onSubmit(inputValue.trim());
    setInputValue("");
  }, [inputValue, isLoading, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleInputContainerMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent the mousedown from causing the textarea to lose focus
    if (!(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
    }
  }, []);

  return (
    <Wrapper data-modal>
      <ContentContainer>
        <IconWrapper>
          <Icon src={telaIconRound} alt="Tela" />
        </IconWrapper>

        <Title>What do you want to write today?</Title>

        <InputContainer onMouseDown={handleInputContainerMouseDown}>
          <StyledTextarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isLoading}
          />
          <SubmitButton
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
          >
            <SubmitIcon src={UpArrowIcon} alt="Submit" />
          </SubmitButton>
        </InputContainer>
      </ContentContainer>
    </Wrapper>
  );
}

// Animation for spinning in the logo
const spinIn = keyframes`
  0% {
    opacity: 0;
    transform: rotate(-180deg) scale(0.5);
  }
  100% {
    opacity: 1;
    transform: rotate(0deg) scale(1);
  }
`;

// Animation for fading in from bottom
const fadeInUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 0;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  max-width: 700px;
  width: 100%;
  padding: 48px;
  border-radius: 16px;
`;

const IconWrapper = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  animation: ${spinIn} 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
`;

const Icon = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 400;
  color: #f4f4f4;
  margin: 0;
  font-family: NM-Medium;
  text-align: center;
  animation: ${fadeInUp} 0.6s ease-out 0.3s backwards;
`;

const InputContainer = styled.div`
  position: relative;
  width: 100%;
  background-color: rgba(39, 39, 39, 0.6);
  border: 1px solid #3a3a3a;
  border-radius: 12px;
  padding-left: 20px;
  padding-right: 20px;
  padding-top: 16px;
  padding-bottom: 56px;
  min-width: 600px;
  min-height: 90px;
  display: flex;
  align-items: flex-start;
  animation: ${fadeInUp} 0.6s ease-out 0.5s backwards;
`;

const StyledTextarea = styled.textarea`
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: #f4f4f4;
  font-size: 16px;
  font-family: SfProRegular;
  resize: none;
  min-height: 24px;
  max-height: 200px;

  &::placeholder {
    color: #6a6a6a;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SubmitButton = styled.button<{ disabled?: boolean }>`
  position: absolute;
  right: 16px;
  bottom: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${(props): string =>
    props.disabled ? "#3a3a3a" : "#f4f4f4"};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${(props): string => (props.disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;
  padding: 0;

  &:hover:not(:disabled) {
    background-color: #ffffff;
    transform: scale(1.05);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }
`;

const SubmitIcon = styled.img`
  width: 16px;
  height: 16px;
  object-fit: contain;
`;
