import styled from "styled-components";
import whiteBar from "../assets/WhiteBar.svg";
import darkBar from "../assets/DarkBar.svg";

const Text = styled.div`
  font-size: 14;
  font-weight: 600;
  color: #656565;
`;

type Props = {
  scrollPercent: number;
};

export default function ScrollProgressBar({
  scrollPercent,
}: Props): JSX.Element {
  // manage threshold for each scrolling indicator
  const barColorThreshold = [
    { threshold: 10 },
    { threshold: 20 },
    { threshold: 30 },
    { threshold: 40 },
    { threshold: 50 },
    { threshold: 60 },
    { threshold: 70 },
    { threshold: 80 },
    { threshold: 90 },
    { threshold: 100 },
  ];
  return (
    <Wrapper>
      <BarWrapper>
        {barColorThreshold.map((bar, idx) => (
          <img
            key={idx}
            style={{
              width: "auto",
              height: 12,
            }}
            src={scrollPercent >= bar.threshold ? whiteBar : darkBar}
            alt=" "
          />
        ))}
      </BarWrapper>
      <Text>{scrollPercent.toFixed(2)}%</Text>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BarWrapper = styled.div`
  display: flex;
  gap: 6px;
`;
