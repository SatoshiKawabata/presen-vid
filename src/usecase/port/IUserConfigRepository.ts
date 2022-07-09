import { PresentationRepositoryType } from "./IPresentationRepository";

export interface IUserConfigRepository {
  getPresentationRepositoryType(): PresentationRepositoryType;
  setPresentationRepositoryType(type: PresentationRepositoryType): void;
}
