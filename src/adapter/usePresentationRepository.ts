import {
  IPresentationRepository,
  PresentationRepositoryType,
} from "../usecase/port/IPresentationRepository";
import { IndexedDbPresentationRepository } from "./indexed-db/IndexedDbPresentationRepository";
import { LocalFileSystemAccessApiPresentationRepository } from "./local-file-system-access-api/LocalFileSystemAccessApiPresentationRepository";

export function usePresentationRepository(
  type: PresentationRepositoryType
): IPresentationRepository {
  switch (type) {
    case PresentationRepositoryType.INDEXED_DB:
      return new IndexedDbPresentationRepository();
    case PresentationRepositoryType.LOCAL_FILE_SYSTEM_ACCESS_API:
      return new LocalFileSystemAccessApiPresentationRepository();
    default:
      throw new Error("Invalid Repository type: " + type);
  }
}
