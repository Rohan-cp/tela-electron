import styled from "styled-components";
import { useEffect, useCallback } from "react";
import { useAuthContext } from "@renderer/contexts/AuthContext";
import telaIconRound from "../assets/telaIconRound.svg";
import googleIcon from "../assets/google-icon.svg";
import authBackground from "../assets/auth-bg.png";

export default function AuthPage(): JSX.Element {
  const authenticated = false;
  const user = null;
  const ready = true;
  const disableLogin = !ready || (ready && authenticated);
  const { setIsUserAuthenticated, setUserEmail, setUserToken } =
    useAuthContext();

  useEffect(() => {
    window.api.notifyRouteChange("/");
  }, []);

  useEffect(() => {
    window.electron.webFrame.setZoomFactor(1);
  }, []);

  const handleAuthSuccess = useCallback(
    (
      _event: Electron.IpcRendererEvent,
      data: { email: string; token?: string },
    ) => {
      setUserEmail(data.email);
      setUserToken(data.token || null);
      setIsUserAuthenticated(true);

      setTimeout(() => {
        window.location.href = "/editor";
      }, 500);
    },
    [setUserEmail, setUserToken, setIsUserAuthenticated],
  );

  useEffect(() => {
    window.api.onAuthSuccess(handleAuthSuccess);

    return (): void => {
      window.api.removeAuthSuccessListener(handleAuthSuccess);
    };
  }, [handleAuthSuccess]);

  const handleGoogleLogin = useCallback(
    (e: React.MouseEvent): void => {
      e.preventDefault();

      if (!disableLogin) {
        window.api.initiateGoogleAuth();
      }
    },
    [disableLogin],
  );

  useEffect(() => {
    if (
      authenticated &&
      user &&
      typeof user === "object" &&
      "email" in user &&
      typeof user.email === "string"
    ) {
      setUserEmail(user.email);
      setIsUserAuthenticated(true);
      window.location.href = "/";
    }
  }, [authenticated, user, setUserEmail, setIsUserAuthenticated]);

  useEffect(() => {
    window.api.checkAuthStatus();
  }, []);

  return (
    <Wrapper>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 40,
          paddingLeft: 67,
          paddingRight: 67,
          backgroundColor: "rgba(39,39,39,0.6)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)", // For Safari support
          border: "1px solid #242424",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <img
            style={{
              width: "auto",
              height: 45,
            }}
            src={telaIconRound}
            alt=" "
          />

          <Title>Welcome to Tela</Title>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <SecondaryText>Begin by creating an account</SecondaryText>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignContent: "center",
            marginTop: 48,
          }}
        >
          <StyledAnchor
            href="#"
            onClick={handleGoogleLogin}
            active={!disableLogin}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                position: "relative",
                padding: 10,
                paddingLeft: 60,
                paddingRight: 60,
              }}
            >
              <img
                style={{
                  width: "auto",
                  height: 15,
                  position: "absolute",
                  left: 17,
                }}
                src={googleIcon}
                alt=" "
              />
              <div style={{ flex: 1, textAlign: "center" }}>
                Continue with Google
              </div>
            </div>
          </StyledAnchor>
        </div>
      </div>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
  background-image: url(${authBackground});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

const Title = styled.div`
  font-size: 30px;
  font-weight: 400;
  line-height: 1.2;
  font-family: Chiaroscura;
`;

const SecondaryText = styled.div`
  font-size: 12px;
  color: #a5a5a5;
  font-family: SfProRegular;
`;

const StyledAnchor = styled.a<{ active: boolean }>`
  display: flex;
  width: 100%;
  border-radius: 29px;
  min-height: 33px;
  justify-content: center;
  align-items: center;

  font-size: 14px;
  color: #1a1a1a;
  font-family: Geist;
  font-weight: 500;
  background-color: #e5e5e5;
  border: 1px solid #515151;
  text-decoration: none;
`;
