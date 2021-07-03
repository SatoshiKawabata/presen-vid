import "../styles/global.css";
import { AppProps } from "next/app";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import { jaJP } from "@material-ui/core/locale";
import {
  BackdropState,
  GlobalContext,
  SnackbarState,
} from "../src/context/globalContext";
import { useState } from "react";
import MuiAlert from "@material-ui/lab/Alert";
import {
  Typography,
  Backdrop,
  CircularProgress,
  Snackbar,
} from "@material-ui/core";

export default function App({ Component, pageProps }: AppProps) {
  const theme = createMuiTheme(jaJP);
  const [snackbarState, setSnackbarState] =
    useState<SnackbarState | null>(null);
  const [backdropState, setBackdropState] =
    useState<BackdropState | null>(null);
  return (
    <ThemeProvider theme={theme}>
      <GlobalContext.Provider
        value={{
          setSnackbarState,
          setBackdropState,
        }}
      >
        <Component {...pageProps} />
      </GlobalContext.Provider>

      <Backdrop open={!!backdropState} style={{ zIndex: 9999, color: "#fff" }}>
        <CircularProgress color="inherit" />
        <Typography variant="h5" component="h1" color="inherit">
          {backdropState?.message}
        </Typography>
      </Backdrop>

      <Snackbar
        open={!!snackbarState}
        onClose={() => {
          setSnackbarState(null);
        }}
        autoHideDuration={snackbarState?.duration || 6000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <MuiAlert elevation={6} variant="filled" severity={snackbarState?.type}>
          {snackbarState?.message}
        </MuiAlert>
      </Snackbar>
    </ThemeProvider>
  );
}
