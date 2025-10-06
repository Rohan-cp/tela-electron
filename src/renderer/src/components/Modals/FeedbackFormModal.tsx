/* eslint-disable @typescript-eslint/explicit-function-return-type */

import styled from 'styled-components'
import Button from '../Button'
import { useEffect, useState } from 'react'

type Props = {
  onClose: () => void
}

export default function FeedbackFormModal({ onClose }: Props) {
  const [clusterTitle, setClusterTitle] = useState('')
  const [clusterDescription, setClusterDescription] = useState('')
  const [isSubmitReady, setIsSubmitReady] = useState<boolean>(false)

  useEffect(() => {
    if (clusterTitle?.length > 0 && clusterDescription.length > 0) {
      setIsSubmitReady(true)
    }
  }, [clusterTitle, clusterDescription])

  const handleBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSubmitFeedback = () => {
    // need to implement this once backend for this is ready
    // TODO(Rohan): create feedback endpoint and handler
  }

  return (
    <StyledModalOverlay onClick={handleBgClick}>
      <StyledModal>
        <StyledContentWrapper>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10
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
              type="text"
              placeholder="your feedback here..."
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            <Button onClick={handleSubmitFeedback} active={isSubmitReady}>
              Submit
            </Button>
          </div>
        </StyledContentWrapper>
      </StyledModal>
    </StyledModalOverlay>
  )
}

const TitleInput = styled.input`
  font-size: 29px;
  background: none;
  color: #ffffff;
  border: 1px solid #3e3d3d;
  outline: none;
  padding: 8px;
  font-family: Chiaroscura;
`

const DescriptionInput = styled.input`
  font-size: 16px;
  background: none;
  color: #888888;
  border: 1px solid #3e3d3d;
  min-height: 200px;
  padding: 8px;
  outline: none;
`

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
`

const StyledModal = styled.div`
  width: 407px;
  background: #242424;
  color: white;
  border-radius: 16px;
  box-shadow: 0 5px 20px 0 rgba(0, 0, 0, 0.04);
`

const StyledContentWrapper = styled.div`
  padding: 30px;
  display: flex;
  flex-direction: column;
  min-height: 207px;
  justify-content: space-between;
  gap: 10px;
`
