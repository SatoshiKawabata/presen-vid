import React from "react";

export interface SnackbarState {
  type: "success" | "info" | "warning" | "error";
  message: string;
  duration?: number; // default 6000
}

export interface BackdropState {
  message: string;
}

interface ContextType {
  setSnackbarState: (state: SnackbarState | null) => void;
  setBackdropState: (state: BackdropState | null) => void;
}

export const GlobalContext = React.createContext<ContextType>({
  setSnackbarState: () => {},
  setBackdropState: () => {},
});
