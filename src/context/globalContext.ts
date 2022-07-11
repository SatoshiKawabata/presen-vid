import React from "react";
import {
  IPresentationRepository,
  PresentationRepositoryType,
} from "../usecase/port/IPresentationRepository";

export interface SnackbarState {
  type: "success" | "info" | "warning" | "error";
  message: string;
  duration?: number; // default 6000
}

export interface BackdropState {
  message: string;
}

interface GlobalContextType {
  setSnackbarState: (state: SnackbarState | null) => void;
  setBackdropState: (state: BackdropState | null) => void;
  getPresentationRepositoryType(): PresentationRepositoryType;
  setPresentationRepositoryType(type: PresentationRepositoryType): void;
  setPresentationRepository(repository: IPresentationRepository): void;
  getPresentationRepository(): IPresentationRepository;
}

export const GlobalContext = React.createContext<GlobalContextType>({} as any);
