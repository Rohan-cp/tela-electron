import { useNavigate } from "react-router-dom";
import LeftArrowIcon from "../../assets/LeftArrowIcon.svg";

export default function BackButton(): JSX.Element {
  const navigate = useNavigate();

  const handleGoBack = (): void => {
    navigate(-1);
  };

  return (
    <div
      onClick={handleGoBack}
      style={{
        padding: 12,
      }}
    >
      <img
        style={{
          width: "auto",
          height: 12,
        }}
        src={LeftArrowIcon}
        alt=" "
      />
    </div>
  );
}
