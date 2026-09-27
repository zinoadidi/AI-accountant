"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Single accent family (deep green = ledger/Estonia), ink text, paper white.
// Deliberately no purple/indigo, no gradients — trust reads as restraint.
export const theme = createTheme({
  palette: {
    primary: { main: "#0B6B3A", dark: "#084E2B", light: "#E6F3EB", contrastText: "#fff" },
    secondary: { main: "#1F2937" },
    background: { default: "#FFFFFF", paper: "#F4F6F4" },
    text: { primary: "#101812", secondary: "#3D4A41" },
  },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h1: { fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontWeight: 750, letterSpacing: "-0.015em" },
    h3: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, paddingLeft: 22, paddingRight: 22, paddingTop: 10, paddingBottom: 10 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 14, border: "1px solid #E2E8E2", boxShadow: "0 1px 2px rgba(16,24,18,0.06)" },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 8 } } },
  },
});

export function MuiTheme({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
