import { Presentation } from "../../types";
import {
  IPresentationRepository,
  PresentationWithoutId,
} from "../../usecase/port/IPresentationRepository";

/**

ディレクトリ構成
presentation_{presentation id}/
  presentation.json
  images/
    image_{slide uid}
  audios/
    audio_{audio uid}.wav

 */
const JSON_FILE = "presentation.json";
const IMAGES_DIR = "images";
const AUDIOS_DIR = "audios";

export class LocalFileSystemAccessApiPresentationRepository
  implements IPresentationRepository
{
  async getPresentations(): Promise<Presentation[]> {
    return new Promise((res) => res([]));
  }

  async getPresentation(
    presentationId: Presentation["id"]
  ): Promise<Presentation> {
    const dirHandle = await showDirectoryPicker();
    const rootDirHandle = await dirHandle.getDirectoryHandle(
      `presentation_${presentationId}`
    );
    const jsonFileHandle = await rootDirHandle.getFileHandle(JSON_FILE);
    const jsonFile = await jsonFileHandle.getFile();
    const jsonStr = await jsonFile.text();
    const presentation: Presentation = JSON.parse(jsonStr);
    const imageDirHandle = await rootDirHandle.getDirectoryHandle(IMAGES_DIR);
    const audioDirHandle = await rootDirHandle.getDirectoryHandle(AUDIOS_DIR);
    await Promise.all(
      presentation.slides.map(async (slide) => {
        const imageFileHandle = await imageDirHandle.getFileHandle(
          `image_${slide.uid}`
        );
        slide.image = await imageFileHandle.getFile();

        await Promise.all(
          slide.audios.map(async (audio) => {
            const audioFileHandle = await audioDirHandle.getFileHandle(
              `audio_${audio.uid}.wav`
            );
            audio.blob = await audioFileHandle.getFile();
          })
        );
      })
    );
    return presentation;
  }

  async savePresentation(presentation: Presentation): Promise<void> {}

  async createPresentation(
    presentationWithoutId: PresentationWithoutId
  ): Promise<Presentation> {
    const id = Date.now();

    const presentation: Presentation = {
      ...presentationWithoutId,
      id,
    };
    const json = JSON.stringify(presentation);
    const dirHandle = await showDirectoryPicker();
    const rootDirHandle = await dirHandle.getDirectoryHandle(
      `presentation_${presentation.id}`,
      {
        create: true,
      }
    );
    const jsonFileHandle = await rootDirHandle.getFileHandle(JSON_FILE, {
      create: true,
    });
    const jsonFileWritable = await jsonFileHandle.createWritable();
    await jsonFileWritable.write(json);
    await jsonFileWritable.close();
    const imageDirHandle = await rootDirHandle.getDirectoryHandle(IMAGES_DIR, {
      create: true,
    });
    const audioDirHandle = await rootDirHandle.getDirectoryHandle(AUDIOS_DIR, {
      create: true,
    });
    await Promise.all(
      presentation.slides.map(async (slide) => {
        const { image } = slide;
        const imageFileHandle = await imageDirHandle.getFileHandle(
          `image_${slide.uid}`,
          { create: true }
        );
        const imageFileWritable = await imageFileHandle.createWritable();
        await imageFileWritable.write(image);
        await imageFileWritable.close();
        await Promise.all(
          slide.audios.map(async (audio) => {
            const audioFileHandle = await audioDirHandle.getFileHandle(
              `audio_${audio.uid}.wav`,
              { create: true }
            );
            const audioFileWritable = await audioFileHandle.createWritable();
            await audioFileWritable.write(audio.blob);
            await audioFileWritable.close();
          })
        );
      })
    );

    return presentation;
  }

  async deletePresentation(presentationId: Presentation["id"]): Promise<void> {
    return new Promise((res) => res(null as any));
  }
}
