import { IUserConfigRepository } from "../usecase/port/IUserConfigRepository";
import { UserConfigRepository } from "./user-config/UserConfigRepository";

export function useUserConfigRepository(): IUserConfigRepository {
  return new UserConfigRepository();
}
