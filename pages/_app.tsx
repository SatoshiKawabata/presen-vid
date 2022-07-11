import "../styles/global.css";
import { AppProps } from "next/app";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import { jaJP } from "@material-ui/core/locale";
import {
  BackdropState,
  GlobalContext,
  SnackbarState,
} from "../src/context/globalContext";
import { useEffect, useState } from "react";
import MuiAlert from "@material-ui/lab/Alert";
import {
  Typography,
  Backdrop,
  CircularProgress,
  Snackbar,
} from "@material-ui/core";
import * as gtag from "../src/analytics/gatag";
import { useRouter } from "next/dist/client/router";
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import {
  IPresentationRepository,
  PresentationRepositoryType,
} from "../src/usecase/port/IPresentationRepository";
import { useUserConfigRepository } from "../src/adapter/useUserConfigRepository";
import { usePresentationRepository } from "../src/adapter/usePresentationRepository";

Sentry.init({
  dsn: "https://0ea293edf9e54442b84086875522c78d@o287052.ingest.sentry.io/5886212",
  integrations: [new Integrations.BrowserTracing()],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

export default function App({ Component, pageProps }: AppProps) {
  const theme = createMuiTheme(jaJP);
  const [snackbarState, setSnackbarState] = useState<SnackbarState | null>(
    null
  );
  const [backdropState, setBackdropState] = useState<BackdropState | null>(
    null
  );
  const [presentationRepository, setPresentationRepository] =
    useState<IPresentationRepository>(
      usePresentationRepository(PresentationRepositoryType.INDEXED_DB)
    );
  const [presentationRepositoryType, setPresentationRepositoryType] =
    useState<PresentationRepositoryType>(PresentationRepositoryType.INDEXED_DB);

  useEffect(() => {
    const repository = usePresentationRepository(presentationRepositoryType);
    setPresentationRepository(repository);
  }, [presentationRepositoryType]);

  useEffect(() => {
    const config = useUserConfigRepository();
    setPresentationRepositoryType(config.getPresentationRepositoryType());
  }, []);

  const router = useRouter();
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      gtag.pageview(url);
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);
  return (
    <ThemeProvider theme={theme}>
      <GlobalContext.Provider
        value={{
          setSnackbarState,
          setBackdropState,
          getPresentationRepositoryType: () => presentationRepositoryType,
          setPresentationRepositoryType: (type: PresentationRepositoryType) => {
            const config = useUserConfigRepository();
            config.setPresentationRepositoryType(type);
            setPresentationRepositoryType(type);
          },
          setPresentationRepository,
          getPresentationRepository: () => presentationRepository,
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
