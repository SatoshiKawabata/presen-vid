import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import getConfig from "next/config";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { v4 as uuidv4 } from "uuid";
import { ExportVideoType } from "./reducers/PresentationReducer";
import { Audio, Presentation } from "./types";
import JSZip from "jszip";

export const goto404 = (ctx: GetServerSidePropsContext<ParsedUrlQuery>) => {
  // go to 404
  redirect("/404", ctx);
  return { props: {} };
};

export const redirect = (
  path: string,
  ctx: GetServerSidePropsContext<ParsedUrlQuery>
) => {
  const { publicRuntimeConfig } = getConfig();
  ctx.res?.writeHead(302, {
    Location: publicRuntimeConfig.basePath + path,
  });
  ctx.res?.end();
};

const createFFmpegInstance = () => {
  const ERROR_LIST = ["Operation not permitted", "Conversion failed"].map(
    (msg) => msg.toLowerCase()
  );
  const messageMap = new Map<string, string[]>();
  const ffmpeg = createFFmpeg({
    logger: (msg) => {
      const { message, type } = msg;
      if (!messageMap.has(type)) {
        messageMap.set(type, []);
      }
      messageMap.get(type)?.push(message);
      if (
        ERROR_LIST.some((errMsg) => message.toLowerCase().indexOf(errMsg) > -1)
      ) {
        console.error("error", msg);
      } else {
        console.log("log", msg);
      }
    },
    progress: (progress) => {
      console.log("progress", progress);
    },
  });
  return ffmpeg;
};

const ffmpeg = createFFmpegInstance();

export const createVideo = async (
  imageFiles: File[],
  audios: Blob[],
  audioDurations: number[],
  size: { width: number; height: number },
  exportVideoType: ExportVideoType
) => {
  let { width, height } = size;
  if (width % 2 === 1) {
    width++;
  }
  if (height % 2 === 1) {
    height++;
  }
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }
  let fileList = "";
  const imageNames: string[] = [];
  const audioNames: string[] = [];
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const audio = audios[i];
    const duration = audioDurations[i];
    if (!file || !audio || !duration) {
      continue;
    }
    // transcode
    const fetchedImage = await fetchFile(file);
    const imageName = uuidv4();
    ffmpeg.FS("writeFile", imageName, fetchedImage);
    imageNames.push(imageName);
    const audioName = uuidv4();
    audioNames.push(audioName);
    const fetchedAudio = await fetchFile(audio);
    ffmpeg.FS("writeFile", audioName, fetchedAudio);
    // 画像だけの動画を作る
    const tmpVideoName = `tmp_${imageName}.${exportVideoType}`;
    await ffmpeg.run(
      "-framerate",
      "30",
      "-i",
      imageName,
      "-i",
      audioName,
      "-t",
      duration / 1000 + "",
      "-ar",
      "48000",
      "-c:a",
      getAudioCodec(exportVideoType),
      "-c:v",
      getVideoCodec(exportVideoType),
      "-s",
      `${width}x${height}`,
      // "-pix_fmt",
      // "yuv420p",
      tmpVideoName
    );
    fileList += `file '${tmpVideoName}'\n`;
    // 最後に無音を追加する(https://github.com/SatoshiKawabata/montage/issues/33)
    if (i === imageFiles.length - 1) {
      console.log("無音動画");
      const tmpVideoName = `tmp_${imageName}_last.${exportVideoType}`;
      await ffmpeg.run(
        "-framerate",
        "30",
        "-loop", // 1枚の画像をループさせる
        "1",
        "-i",
        imageName,
        "-t",
        "5", // 5秒の無音の動画
        "-c:a",
        getAudioCodec(exportVideoType),
        "-c:v",
        getVideoCodec(exportVideoType),
        "-s",
        `${width}x${height}`,
        tmpVideoName
      );
      fileList += `file '${tmpVideoName}'\n`;
    }
  }
  // 画像のみの動画ファイルのリストのテキストファイルを作る
  ffmpeg.FS("writeFile", "fileList.txt", new TextEncoder().encode(fileList));
  // 動画を連結する
  console.log("動画を連結する");
  await ffmpeg.run(
    "-f",
    "concat",
    "-i",
    "fileList.txt",
    "-framerate",
    "30",
    "-c",
    "copy", // 再エンコードせずにコーデックをそのまま使う
    `result.${exportVideoType}`
  );
  const data = ffmpeg.FS("readFile", `result.${exportVideoType}`);
  const result = new Blob([data.buffer], { type: `video/${exportVideoType}` });

  // unlink file
  ffmpeg.FS("unlink", "fileList.txt");
  ffmpeg.FS("unlink", `result.${exportVideoType}`);
  for (const audioName of audioNames) {
    ffmpeg.FS("unlink", audioName);
  }
  for (const imageName of imageNames) {
    ffmpeg.FS("unlink", imageName);
    const tmpVideoName = `tmp_${imageName}.${exportVideoType}`;
    ffmpeg.FS("unlink", tmpVideoName);
  }
  return result;
};

export const download = (href: string, name: string) => {
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.click();
};

export const importFile = (accept?: string, multiple: boolean = false) => {
  return new Promise<FileList>((res, rej) => {
    const input = document.createElement("input");
    input.type = "file";
    if (accept) {
      input.accept = accept;
    }
    input.multiple = multiple;
    input.onchange = () => {
      const files = input.files;
      if (files) {
        res(files);
      } else {
        rej();
      }
    };
    input.click();
  });
};

export const getImageSize = async (src: string) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
};

export const transcodeWebm2Wav = async (audio: Blob) => {
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }

  const audioInputName = `${uuidv4()}.webm`;
  const audioOutputName = `${uuidv4()}.wav`;
  const fetchedAudio = await fetchFile(audio);
  ffmpeg.FS("writeFile", audioInputName, fetchedAudio);
  // サンプルレート48kHzでwavファイルに変換
  await ffmpeg.run(
    "-i",
    audioInputName,
    "-ac",
    "2",
    "-ar",
    "48000",
    audioOutputName
  );
  const data = ffmpeg.FS("readFile", audioOutputName);
  const result = new Blob([data.buffer], { type: "audio/wav" });
  ffmpeg.FS("unlink", audioInputName);
  ffmpeg.FS("unlink", audioOutputName);
  return result;
};

export const blob2audioData = async (
  blob: Blob,
  durationMillisec: number,
  title: string
) => {
  const blobForPreview = await transcodeWebm2Wav(blob);
  const audio: Audio = {
    title,
    blob: blobForPreview,
    durationMillisec,
    uid: uuidv4(),
  };
  return audio;
};

const getVideoCodec = (exportVideoType: ExportVideoType) => {
  if (exportVideoType === ExportVideoType.WEBM) {
    return "libvpx";
  } else {
    return "libx264";
  }
};

const getAudioCodec = (exportVideoType: ExportVideoType) => {
  if (exportVideoType === ExportVideoType.WEBM) {
    return "copy";
  } else {
    return "aac";
  }
};

export const downloadPresentation = async (presentation: Presentation) => {
  const zip = new JSZip();
  presentation.slides.map((slide) => {
    zip.file(slide.uid, slide.image);
    slide.audios.forEach((audio) => {
      zip.file(audio.uid, audio.blob);
    });
  });
  const json = JSON.stringify(presentation);
  zip.file("presentation.json", json);
  const blob = await zip.generateAsync({ type: "blob" }, (metadata) =>
    console.log("onUpdate", metadata)
  );
  download(URL.createObjectURL(blob), `${presentation.title}.pvm`);
};
