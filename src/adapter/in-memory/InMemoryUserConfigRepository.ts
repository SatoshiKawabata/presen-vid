import { PresentationRepositoryType } from "../../usecase/port/IPresentationRepository";
import { IUserConfigRepository } from "../../usecase/port/IUserConfigRepository";

enum Key {
  PRESENTATION_REPOSITORY_TYPE = "presentation-repository-type",
}
const storage = {} as any;
export class InMemoryUserConfigRepository implements IUserConfigRepository {
  getPresentationRepositoryType(): PresentationRepositoryType {
    const type = storage[
      Key.PRESENTATION_REPOSITORY_TYPE
    ] as PresentationRepositoryType;
    return type || PresentationRepositoryType.INDEXED_DB;
  }
  setPresentationRepositoryType(type: PresentationRepositoryType): void {
    storage[Key.PRESENTATION_REPOSITORY_TYPE] = type;
  }
}
