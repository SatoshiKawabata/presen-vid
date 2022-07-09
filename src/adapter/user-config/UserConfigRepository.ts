import { PresentationRepositoryType } from "../../usecase/port/IPresentationRepository";
import { IUserConfigRepository } from "../../usecase/port/IUserConfigRepository";

enum LocalStorageKey {
  PRESENTATION_REPOSITORY_TYPE = "presentation-repository-type",
}
export class UserConfigRepository implements IUserConfigRepository {
  getPresentationRepositoryType(): PresentationRepositoryType {
    const type = localStorage.getItem(
      LocalStorageKey.PRESENTATION_REPOSITORY_TYPE
    ) as PresentationRepositoryType;
    return type || PresentationRepositoryType.INDEXED_DB;
  }
  setPresentationRepositoryType(type: PresentationRepositoryType): void {
    localStorage.setItem(LocalStorageKey.PRESENTATION_REPOSITORY_TYPE, type);
  }
}
