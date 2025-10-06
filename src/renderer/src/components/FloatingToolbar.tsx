import React, { useState, useEffect } from 'react'
import './FloatingToolbar.css'
import telaIcon from '../assets/telaButtonIcon.png'
import arrowIcon from '../assets/arrow.png'

export type ToolbarPosition = {
  top: number
  left: number
}

export type FloatingToolbarProps = {
  showToolbar: boolean
  showDiffView: boolean
  showLoader: boolean
  isTransformSelected: boolean
  toolbarPosition: ToolbarPosition
  handleChangePromptInput: () => void
  handleSubmitPromptToTransform: (userTransformPrompt: string) => void
  setIsInteractingWithToolbar: React.Dispatch<React.SetStateAction<boolean>>
  originalText: string
  suggestedText: string
  transformError: string | null
  retryCount: number
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  showToolbar,
  showDiffView,
  showLoader,
  isTransformSelected,
  toolbarPosition,
  handleChangePromptInput,
  handleSubmitPromptToTransform,
  setIsInteractingWithToolbar,
  originalText,
  suggestedText,
  transformError: _transformError,
  retryCount: _retryCount
}) => {
  const [userTransformPrompt, setUserTransformPrompt] = useState('')

  // Add useEffect to clear the prompt when toolbar is closed
  useEffect(() => {
    // If toolbar is hidden or transform view is not selected, clear the prompt
    if (!showToolbar || !isTransformSelected) {
      setUserTransformPrompt('')
    }
  }, [showToolbar, isTransformSelected])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setUserTransformPrompt(event.target.value)
    handleChangePromptInput()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSubmitPromptToTransform(userTransformPrompt)
    }
  }

  const handleClickOnThinkDiv = (): void => {
    // Handle click on the "Preparing your changes..." text
    // This could be used to cancel the operation or show more details
  }

  if (!showToolbar) return null

  if (showDiffView) {
    return (
      <div
        className="floating-toolbar diff-view"
        style={{
          top: `${toolbarPosition.top}px`,
          left: `${toolbarPosition.left}px`
        }}
      >
        <div className="diff-view-content">
          <div className="diff-view-header">Suggested Change</div>
          <div className="diff-view-container">
            <div className="suggest-remove-text-container">
              <div className="remove-red-left-border" />
              <div className="suggest-remove-text">{originalText}</div>
            </div>
            <div className="suggest-add-text-container">
              <div className="add-green-left-border" />
              <div className="suggest-add-text">{suggestedText}</div>
            </div>
            <div className="diff-view-actions">
              <div className="diff-view-buttons">
                <div className="reject-toolbar-btn hover-btn">Reject (⌘N)</div>
                <div className="accept-toolbar-btn hover-btn">Accept (⌘Y)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showLoader) {
    return (
      <div
        className="floating-toolbar loader-view"
        style={{
          top: `${toolbarPosition.top}px`,
          left: `${toolbarPosition.left}px`
        }}
      >
        <div className="loader-container">
          <img className="loader-icon" alt="button" src={telaIcon} />
          <div className="loader-text" onClick={handleClickOnThinkDiv}>
            Preparing your changes...
          </div>
        </div>
      </div>
    )
  }

  if (isTransformSelected) {
    return (
      <div
        className="floating-toolbar transform-view"
        style={{
          height: 43,
          top: `${toolbarPosition.top}px`,
          left: `${toolbarPosition.left}px`
        }}
        onMouseDown={(e) => {
          if (!(e.target instanceof HTMLInputElement)) {
            e.preventDefault()
          }
          setIsInteractingWithToolbar(true)
        }}
      >
        <input
          className="input"
          type="text"
          value={userTransformPrompt}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            e.stopPropagation()
            setIsInteractingWithToolbar(true)
          }}
          onFocus={() => setIsInteractingWithToolbar(true)}
          placeholder='Ex. "make it sound more interesting"'
          disabled={showLoader}
        />
        <div
          className="right-prompt-toolbar-btn"
          onClick={() => !showLoader && handleSubmitPromptToTransform(userTransformPrompt)}
          style={{ opacity: showLoader ? 0.5 : 1 }}
        >
          {showLoader ? (
            <div className="loading-spinner" />
          ) : (
            <img className="arrow-icon" alt="button" src={arrowIcon} />
          )}
        </div>
      </div>
    )
  }

  // Return null for standard view instead of rendering it
  // The standard view code is kept but not rendered
  return null
}

export default FloatingToolbar
