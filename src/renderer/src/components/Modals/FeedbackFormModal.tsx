/* eslint-disable @typescript-eslint/explicit-function-return-type */

import styled from "styled-components";
import { useEffect, useState } from "react";
import { API_ENDPOINTS, FeedbackRequest } from "../../lib/api";
import { useApiClient } from "../../hooks/useApiClient";
import { useAuthContext } from "../../contexts/AuthContext";

type Props = {
  onClose: () => void;
};

export default function FeedbackFormModal({ onClose }: Props) {
  const [clusterTitle, setClusterTitle] = useState("");
  const [clusterDescription, setClusterDescription] = useState("");
  const [isSubmitReady, setIsSubmitReady] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const { userToken } = useAuthContext();
  const apiClient = useApiClient();

  useEffect(() => {
    if (clusterTitle?.length > 0 && clusterDescription.length > 0) {
      setIsSubmitReady(true);
    }
  }, [clusterTitle, clusterDescription]);

  const handleBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmitFeedback = async () => {
    if (!userToken) {
      setSubmitMessage("Please log in to submit feedback");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      const feedbackData: FeedbackRequest = {
        email: clusterTitle,
        message: clusterDescription,
      };

      await apiClient.post(API_ENDPOINTS.FEEDBACK, feedbackData);

      setSubmitMessage("Thank you for your feedback!");
      setClusterTitle("");
      setClusterDescription("");

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      setSubmitMessage("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StyledModalOverlay onClick={handleBgClick} data-modal>
      <StyledModal>
        <StyledContentWrapper>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <TitleInput
              value={clusterTitle}
              onChange={(e) => setClusterTitle(e.target.value)}
              type="text"
              placeholder="your email address"
            />
            <DescriptionInput
              value={clusterDescription}
              onChange={(e) => setClusterDescription(e.target.value)}
              placeholder="your feedback here..."
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <SubmitButton
              onClick={handleSubmitFeedback}
              disabled={!isSubmitReady || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </SubmitButton>
            {submitMessage && (
              <SubmitMessage success={submitMessage.includes("Thank you")}>
                {submitMessage}
              </SubmitMessage>
            )}
          </div>
        </StyledContentWrapper>
      </StyledModal>
    </StyledModalOverlay>
  );
}

const TitleInput = styled.input`
  font-size: 29px;
  background: none;
  color: #ffffff;
  border: 1px solid #3e3d3d;
  outline: none;
  padding: 8px;
  width: 100%;
  font-family: Chiaroscura;
`;

const DescriptionInput = styled.textarea`
  font-size: 16px;
  background: #ffffff;
  color: #000000;
  border: 1px solid #3e3d3d;
  min-height: 200px;
  width: 100%;
  padding: 8px;
  outline: none;
  resize: none;
  font-family: inherit;

  &::placeholder {
    color: #888888;
  }
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
  z-index: 1000; // High z-index to ensure it's above other elements
`;

const StyledModal = styled.div`
  width: 407px;
  background: #242424;
  color: white;
  border-radius: 16px;
  box-shadow: 0 5px 20px 0 rgba(0, 0, 0, 0.04);
`;

const StyledContentWrapper = styled.div`
  padding: 30px;
  display: flex;
  flex-direction: column;
  min-height: 207px;
  justify-content: space-between;
  gap: 10px;
`;

const SubmitButton = styled.button`
  color: #1a1a1a;
  font-size: 13px;
  border-radius: 24px;
  padding-left: 30px;
  padding-right: 30px;
  padding-top: 8px;
  padding-bottom: 8px;
  background-color: #eae8e2;
  border: 0.4px solid #fff;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-family: NM-Medium;

  &:hover:not(:disabled) {
    background-color: #f5f5f0;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SubmitMessage = styled.div<{ success: boolean }>`
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-family: NM-Medium;
  color: ${(props) => (props.success ? "#4CAF50" : "#f44336")};
  background-color: ${(props) =>
    props.success ? "rgba(76, 175, 80, 0.1)" : "rgba(244, 67, 54, 0.1)"};
  border: 1px solid ${(props) => (props.success ? "#4CAF50" : "#f44336")};
`;
