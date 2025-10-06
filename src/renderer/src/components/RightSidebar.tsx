import styled from 'styled-components'
import TelaButton from './TelaButton/TelaButton'

const StyledDiv = styled.div`
  display: flex;
  flex-direction: column;
  width: 22%;
  min-height: 100%;
  margin-top: 3%;
  margin-right: 12px;
  align-items: flex-end;
`

export default function RightSidebar(): JSX.Element {
  return (
    <StyledDiv>
      <TelaButton />
    </StyledDiv>
  )
}
