import Dexie from "dexie";
import React, { useContext, useState } from "react";
import { IPresentationsServie } from "../application/ports/IPresentationsService";
import { Presentation } from "../domain/Presentation";

const StoreContext = React.createContext<IPresentationsServie>({ presentations: [], updatePresentations: () => { }, fetchPresentations: () => Promise.resolve([]) });
const useStore = () => useContext(StoreContext);

export const PresentationsProvider: React.FC = ({ children }) => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);

  async function fetchPresentations() {
    const db = new Dexie("montage");
    db.version(1).stores({
      presentations: "++id, title, slides",
    });
    const presentations = await db
      .table<Presentation>("presentations")
      .toArray();
    return presentations;
  }

  const initialValue = {
    presentations,
    updatePresentations: setPresentations,
    fetchPresentations
  };

  return (
    <StoreContext.Provider value={initialValue}>{children}</StoreContext.Provider>
  );
};

export function usePresentationStorage() {
  return useStore();
}
