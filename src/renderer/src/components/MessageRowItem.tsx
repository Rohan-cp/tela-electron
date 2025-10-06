import { MessageStyle } from '@renderer/types/types'
import './MessageRowItem.css'

type MessageRowItemProps = {
  id: string
  style: string
  content: any
}

export default function MessageRowItem({ id, style, content }: MessageRowItemProps) {
  const handleApplyChange = () => {}

  switch (style) {
    case MessageStyle.SuggestChangeMessage:
      return (
        <div key={id} className={style}>
          <div className="suggestion-container">
            <div className="suggestion-title">{content.title}</div>
            <div className="suggestion-diff-container">
              <div className="suggest-remove-text-container">
                <div className="remove-red-left-border" />
                <div className="suggest-remove-text">{content.value.current}</div>
              </div>
              <div className="suggest-add-text-container">
                <div className="add-green-left-border" />
                <div className="suggest-add-text">{content.value.suggestedChange}</div>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end'
                }}
              >
                <div onClick={handleApplyChange} className="apply-change-btn">
                  Apply this change
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    case MessageStyle.AssistantMessage:
    case MessageStyle.UserMessage:
    default:
      return (
        <div key={id} className={style}>
          <div className="message-text">{content as string}</div>
        </div>
      )
  }
}
