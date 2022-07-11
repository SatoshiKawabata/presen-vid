import { Presentation } from "../../types";
import {
  IPresentationRepository,
  PresentationListItem,
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
const PRESENTATION_DIR_PREFIX = "presentation_";
const JSON_FILE = "presentation.json";
const IMAGES_DIR = "images";
const AUDIOS_DIR = "audios";

export class LocalFileSystemAccessApiPresentationRepository
  implements IPresentationRepository
{
  // @ts-ignore
  private presenVidRootDirHandle: FileSystemDirectoryHandle;

  async getPresentationList(): Promise<PresentationListItem[]> {
    if (!this.presenVidRootDirHandle) {
      const dirHandle = await showDirectoryPicker();
      this.presenVidRootDirHandle = dirHandle;
    }
    const presentationList: PresentationListItem[] = [];
    for await (const key of this.presenVidRootDirHandle.keys()) {
      if (key.includes(PRESENTATION_DIR_PREFIX)) {
        // get title
        const idStr = key.split("_")[1] || "";
        const presentationId = parseInt(idStr);

        const presentationDirHandle =
          await this.presenVidRootDirHandle.getDirectoryHandle(key);
        const jsonFile = await getFile(presentationDirHandle, JSON_FILE);
        const jsonStr = await jsonFile.text();
        const presentation: Presentation = JSON.parse(jsonStr);
        const { title } = presentation;

        presentationList.push({
          id: presentationId,
          title,
        });
      }
    }
    return presentationList.sort((a, b) => {
      if (a.id > b.id) {
        return 1;
      } else if (a.id < b.id) {
        return -1;
      }
      return 0;
    });
  }

  async getPresentation(
    presentationId: Presentation["id"]
  ): Promise<Presentation> {
    if (!this.presenVidRootDirHandle) {
      this.presenVidRootDirHandle = await showDirectoryPicker();
    }
    const rootDirHandle = await this.presenVidRootDirHandle.getDirectoryHandle(
      `${PRESENTATION_DIR_PREFIX}${presentationId}`
    );
    const jsonFile = await getFile(rootDirHandle, JSON_FILE);
    const jsonStr = await jsonFile.text();
    const presentation: Presentation = JSON.parse(jsonStr);
    const imageDirHandle = await rootDirHandle.getDirectoryHandle(IMAGES_DIR);
    const audioDirHandle = await rootDirHandle.getDirectoryHandle(AUDIOS_DIR);
    for (const slide of presentation.slides) {
      slide.image = await getFile(imageDirHandle, `image_${slide.uid}`);
      for (const audio of slide.audios) {
        const fileName = `audio_${audio.uid}.wav`;
        audio.blob = await getFile(audioDirHandle, fileName);
      }
    }
    return presentation;
  }

  async savePresentation(presentation: Presentation): Promise<void> {
    if (!this.presenVidRootDirHandle) {
      this.presenVidRootDirHandle = await showDirectoryPicker();
    }
    await this.saveData(presentation, true);
  }

  async createPresentation(
    presentationWithoutId: PresentationWithoutId
  ): Promise<Presentation> {
    const id = Date.now();

    const presentation: Presentation = {
      ...presentationWithoutId,
      id,
    };
    await this.saveData(presentation, true);
    return presentation;
  }

  async deletePresentation(presentationId: Presentation["id"]): Promise<void> {
    if (!this.presenVidRootDirHandle) {
      this.presenVidRootDirHandle = await showDirectoryPicker();
    }
    await this.presenVidRootDirHandle.removeEntry(
      `${PRESENTATION_DIR_PREFIX}${presentationId}`,
      {
        recursive: true,
      }
    );
    return new Promise((res) => res(null as any));
  }

  private async saveData(
    presentation: Presentation,
    isCreate = false
  ): Promise<void> {
    if (!this.presenVidRootDirHandle) {
      this.presenVidRootDirHandle = await showDirectoryPicker();
    }
    const json = JSON.stringify(presentation);
    const rootDirHandle = await this.presenVidRootDirHandle.getDirectoryHandle(
      `presentation_${presentation.id}`,
      {
        create: isCreate,
      }
    );
    await saveFileToDirectory(rootDirHandle, json, JSON_FILE, true);

    const imageDirHandle = await rootDirHandle.getDirectoryHandle(IMAGES_DIR, {
      create: isCreate,
    });
    const audioDirHandle = await rootDirHandle.getDirectoryHandle(AUDIOS_DIR, {
      create: isCreate,
    });

    let allImageFileNames: string[] = [];
    let allAudioFileNames: string[] = [];
    for (const slide of presentation.slides) {
      const { image } = slide;
      const imageFileName = `image_${slide.uid}`;
      await saveFileToDirectory(imageDirHandle, image, imageFileName, false);
      allImageFileNames.push(imageFileName);
      // save files
      for (const audio of slide.audios) {
        const audioFileName = `audio_${audio.uid}.wav`;
        await saveFileToDirectory(
          audioDirHandle,
          audio.blob,
          audioFileName,
          false
        );
        allAudioFileNames.push(audioFileName);
      }
    }
    // delete unnecessary files
    for await (const fileName of imageDirHandle.keys()) {
      if (!allImageFileNames.includes(fileName)) {
        await imageDirHandle.removeEntry(fileName);
      }
    }
    for await (const fileName of audioDirHandle.keys()) {
      if (!allAudioFileNames.includes(fileName)) {
        await audioDirHandle.removeEntry(fileName);
      }
    }
  }
}

const exists = async (dirHandle: FileSystemDirectoryHandle, name: string) => {
  let isExisted = false;
  for await (const key of dirHandle.keys()) {
    if (name === key) {
      isExisted = true;
      break;
    }
  }
  return isExisted;
};

const saveFileToDirectory = async (
  dirHandle: FileSystemDirectoryHandle,
  content: string | Blob,
  fileName: string,
  isOverwrite = true
): Promise<void> => {
  try {
    const isExisted = await exists(dirHandle, fileName);
    if (!isOverwrite && isExisted) {
      return;
    }
    const fileHandle = await dirHandle.getFileHandle(fileName, {
      create: !isExisted,
    });
    const fileWritable = await fileHandle.createWritable();
    await fileWritable.write(content);
    await fileWritable.close();
  } catch (e) {
    throw new Error(
      `Failed to save file. fileName: ${fileName}, originalError: ${e}`
    );
  }
};

const getFile = async (
  dirHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<File> => {
  try {
    const imageFileHandle = await dirHandle.getFileHandle(fileName);
    const file = await imageFileHandle.getFile();
    return file;
  } catch (e) {
    throw new Error(
      `Failed to load file. fileName: ${fileName}, originalError: ${e}`
    );
  }
};
