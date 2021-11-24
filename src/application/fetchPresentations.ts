import { usePresentationStorage } from "../services/presentationsAdapter";

export function useFetchPresentations() {
  const storage = usePresentationStorage();

  async function fetchPresentations() {
    const presentations = await storage.fetchPresentations();
    storage.updatePresentations(presentations);
  }

  return {
    presentations: storage.presentations,
    fetchPresentations
  }
}