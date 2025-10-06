/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { PropsWithChildren } from 'react'
import styled from 'styled-components'

type Props = PropsWithChildren<{
  onClick: () => void
  active?: boolean
}>

export default function Button({ children, onClick, active = true }: Props) {
  return (
    <StyledButton onClick={onClick} active={active}>
      {children}
    </StyledButton>
  )
}

const StyledButton = styled.div<{ active: boolean }>`
  display: flex;
  padding-left: 10px;
  padding-right: 10px;
  min-height: 33px;
  border-radius: 2px;
  color: #0e0e0e;
  background-color: ${({ active }) => (active ? '#FFFFFF' : '#393939')};
  max-width: 69px;
  justify-content: center;
  align-items: center;
  font-size: 14px;
  cursor: pointer;
`
