import { Presentation } from "../../domain/Presentation";

export interface IPresentationsServie {
  presentations: Presentation[];
  updatePresentations(presentations: Presentation[]): void;
  fetchPresentations(): Promise<Presentation[]>;
}