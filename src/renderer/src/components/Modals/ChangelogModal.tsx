/* eslint-disable @typescript-eslint/explicit-function-return-type */

import styled from "styled-components";
import { HStack, VStack } from "../Spacer/Stack";

type Props = {
  onClose: () => void;
};

export default function ChangelogModal({ onClose }: Props) {
  const handleBgClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <StyledModalOverlay onClick={handleBgClick} data-modal>
      <StyledModal>
        <StyledContentWrapper>
          <VStack gap={16}>
            <TitleText>Changelog</TitleText>
            <ChangelogItem
              date="October 15th, 2024"
              changeItems={[
                "Autocomplete suggested word with tab",
                "Added feedback form",
              ]}
            />
          </VStack>

          <HStack style={{ marginTop: "5px" }} justify="center" align="center">
            <FooterText>Made with </FooterText>

            <FooterText
              style={{
                color: "red",
                fontSize: "24px",
                marginLeft: "3px",
                marginRight: "3px",
              }}
            >
              ❤️
            </FooterText>

            <FooterText> in Waterloo</FooterText>
          </HStack>
        </StyledContentWrapper>
      </StyledModal>
    </StyledModalOverlay>
  );
}

const FooterText = styled.span`
  font-size: 18px;
  font-family: 'SfProDisplayRegular'
  font-weight: 400;
  color: #3c3c3c;
`;

const TitleText = styled.span`
  font-size: 28px;
  font-family: Gambetta;
  font-weight: 400;
  color: #3c3c3c;
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
  width: 700px;
  background: #eae8e2;
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

type ChangelogItemProps = {
  changeItems: string[];
  date: string;
};

function ChangelogItem({ date, changeItems }: ChangelogItemProps) {
  return (
    <HStack gap={100}>
      <DateText>{date}</DateText>
      <VStack gap={8}>
        <HeaderText>Changes and Improvements</HeaderText>
        <VStack>
          {changeItems.map((item, index) => (
            <ChangeItemText key={index}>{`- ${item}`}</ChangeItemText>
          ))}
        </VStack>
      </VStack>
    </HStack>
  );
}

const DateText = styled.span`
  font-size: 16px;
  text-transform: uppercase;
  color: #2e2e2e;
`;

const ChangeItemText = styled.div`
  font-size: 15px;
  line-height: 1.4;
  color: #2e2e2e;
`;

const HeaderText = styled.div`
  font-size: 19px;
  font-family: "SfProDisplayMedium";
  color: #2e2e2e;
`;
