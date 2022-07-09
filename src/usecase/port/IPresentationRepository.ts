import { Presentation } from "../../types";

export type PresentationWithoutId = Omit<Presentation, "id">;

export interface IPresentationRepository {
  getPresentations: () => Promise<Presentation[]>;
  getPresentation: (
    presentationId: Presentation["id"]
  ) => Promise<Presentation>;
  savePresentation: (presentation: Presentation) => Promise<void>;
  createPresentation: (
    presentationWithoutId: PresentationWithoutId
  ) => Promise<Presentation>;
  deletePresentation: (presentationId: Presentation["id"]) => Promise<void>;
}

export enum PresentationRepositoryType {
  INDEXED_DB = "indexed-db",
  LOCAL_FILE_SYSTEM_ACCESS_API = "local-file-system-access-api",
}
