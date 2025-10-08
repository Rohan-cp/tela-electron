// Theme colors - these should match the CSS custom properties in base.css
export const secondary = "#FFFFFF";
export const tertiary = "#888888";
export const telaGray = "#242424";

// Tela Theme Colors
export const theme = {
  // Background Colors
  bgPrimary: "#171717",
  bgSecondary: "#1a1a1a",
  bgTertiary: "#242424",
  bgQuaternary: "#2a2a2a",
  bgQuinary: "#2e2e2e",
  bgHover: "#3a3a3a",

  // Text Colors
  textPrimary: "#fafafa",
  textSecondary: "#b3b3b3",
  textTertiary: "#888888",
  textQuaternary: "#9e9e9e",
  textMuted: "#707070",
  textDisabled: "#666666",

  // Accent Colors
  accentPrimary: "#FCB827",
  accentSecondary: "#ffae00",
  accentHover: "#FFC342",
  accentOrange: "#FE5100",

  // Status Colors
  success: "#49de80",
  successBg: "#242c24",
  successBorder: "#062e16",
  error: "#d05959",
  errorBg: "#342424",
  errorBorder: "#853131",
  errorLight: "#f87171",
  warning: "#ffae00",
  info: "#63978c",

  // Border Colors
  borderPrimary: "#333333",
  borderSecondary: "#696969",
  borderLight: "rgba(255, 255, 255, 0.1)",
  borderMuted: "#888888",

  // Selection Colors
  selectionBg: "#070707",
  caretColor: "#FCB827",

  // Chat Assistant Colors
  chatBg: "#1e1e1e",
  chatUserBg: "#999999",
  chatUserText: "#000000",
  chatAssistantText: "#ffffff",

  // Toolbar Colors
  toolbarBg: "#242424",
  toolbarBorder: "#242424",
  buttonBg: "#2e2e2e",
  buttonHoverBg: "#3a3a3a",
  promptButtonBg: "#ffae00",
  promptButtonHoverBg: "#ffc342",

  // Diff Colors
  diffRemoveBg: "#342424",
  diffRemoveBorder: "#853131",
  diffRemoveIndicator: "#f87171",
  diffAddBg: "#242c24",
  diffAddBorder: "#062e16",
  diffAddIndicator: "#49de80",
} as const;
