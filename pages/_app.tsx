import "../styles/global.css";
import { AppProps } from "next/app";
import { createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import { jaJP } from "@material-ui/core/locale";

export default function App({ Component, pageProps }: AppProps) {
  const theme = createMuiTheme(jaJP);
  return (
    <ThemeProvider theme={theme}>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
