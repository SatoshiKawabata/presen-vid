import Dexie from "dexie";
import { Presentation } from "../../types";
import {
  IPresentationRepository,
  PresentationWithoutId,
} from "../../usecase/port/IPresentationRepository";

export class IndexedDbPresentationRepository
  implements IPresentationRepository
{
  async getPresentations(): Promise<Presentation[]> {
    const db = new Dexie("montage");
    db.version(1).stores({
      presentations: "++id, title, slides",
    });
    const presentations = await db
      .table<Presentation>("presentations")
      .toArray();
    return presentations;
  }

  async getPresentation(
    presentationId: Presentation["id"]
  ): Promise<Presentation> {
    const db = new Dexie("montage");
    db.version(1).stores({
      presentations: "++id, title, slides",
    });

    const presentation = await db
      .table<Presentation>("presentations")
      .get(presentationId);

    if (!presentation) {
      throw new Error("No such presentation id: " + presentationId);
    }

    return presentation;
  }

  async savePresentation(presentation: Presentation): Promise<void> {
    const db = new Dexie("montage");
    db.version(1).stores({
      presentations: "++id, title, slides",
    });

    await db
      .table<Omit<Presentation, "id">>("presentations")
      .update(presentation.id, presentation);
  }

  async createPresentation(
    presentationWithoutId: PresentationWithoutId
  ): Promise<Presentation> {
    const db = new Dexie("montage");

    db.version(1).stores({
      presentations: "++id, title, slides",
    });

    const id = await db
      .table<PresentationWithoutId>("presentations")
      .add(presentationWithoutId);

    return {
      ...presentationWithoutId,
      id: id as number,
    };
  }

  async deletePresentation(presentationId: Presentation["id"]): Promise<void> {
    const db = new Dexie("montage");
    db.version(1).stores({
      presentations: "++id, title, slides",
    });

    await db
      .table<Omit<Presentation, "id">>("presentations")
      .delete(presentationId);
  }
}
