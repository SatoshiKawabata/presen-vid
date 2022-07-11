import { v4 as uuidv4 } from "uuid";
import { Presentation, Slide } from "../types";
import { PresentationWithoutId } from "../usecase/port/IPresentationRepository";

export function createSlidesData(imageFiles: FileList): Slide[] {
  return Array.from(imageFiles).map((file) => {
    return {
      uid: uuidv4(),
      title: file.name,
      image: file,
      audios: [],
    };
  });
}

export function createPresentationWithoutIdData(
  title: Presentation["title"],
  imageFiles: FileList
): PresentationWithoutId {
  return {
    title,
    slides: Array.from(imageFiles).map((file) => {
      return {
        uid: uuidv4(),
        title: file.name,
        image: file,
        audios: [],
      };
    }),
    width: 0,
    height: 0,
  };
}
