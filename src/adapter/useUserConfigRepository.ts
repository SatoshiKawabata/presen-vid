import { IUserConfigRepository } from "../usecase/port/IUserConfigRepository";
import { InMemoryUserConfigRepository } from "./in-memory/InMemoryUserConfigRepository";

export function useUserConfigRepository(): IUserConfigRepository {
  return new InMemoryUserConfigRepository();
}
