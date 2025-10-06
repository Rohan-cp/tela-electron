/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { useNavigate } from 'react-router-dom'
import LeftArrowIcon from '../../assets/LeftArrowIcon.svg'

export default function BackButton() {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div
      onClick={handleGoBack}
      style={{
        padding: 12
      }}
    >
      <img
        style={{
          width: 'auto',
          height: 12
        }}
        src={LeftArrowIcon}
        alt=" "
      />
    </div>
  )
}
