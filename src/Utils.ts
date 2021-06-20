import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import getConfig from "next/config";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { v4 as uuidv4 } from "uuid";

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

export const createVideo = async (
  imageFiles: File[],
  audios: Blob[],
  audioDurations: number[],
  size: { width: number; height: number }
) => {
  let { width, height } = size;
  if (width % 2 === 1) {
    width++;
  }
  if (height % 2 === 1) {
    height++;
  }
  const ffmpeg = createFFmpegInstance();
  await ffmpeg.load();
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
    const tmpVideoName = `tmp_${imageName}.mp4`;
    await ffmpeg.run(
      "-framerate",
      "30",
      "-i",
      imageName,
      "-i",
      audioName,
      "-t",
      duration / 1000 + "",
      "-c:a",
      "copy",
      "-c:v",
      "libx264",
      "-s",
      `${width}x${height}`,
      // "-pix_fmt",
      // "yuv420p",
      tmpVideoName
    );
    fileList += `file '${tmpVideoName}'\n`;
  }
  console.log("fileList", fileList);
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
    "-vcodec",
    "libx264",
    "-c",
    "copy", // 再エンコードせずにコーデックをそのまま使う
    "result.mp4"
  );
  const data = ffmpeg.FS("readFile", "result.mp4");
  const result = new Blob([data.buffer], { type: "video/mp4" });

  // unlink file
  ffmpeg.FS("unlink", "fileList.txt");
  ffmpeg.FS("unlink", "result.mp4");
  for (const audioName of audioNames) {
    ffmpeg.FS("unlink", audioName);
  }
  for (const imageName of imageNames) {
    ffmpeg.FS("unlink", imageName);
    const tmpVideoName = `tmp_${imageName}.mp4`;
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

export const getImageSize = async (src: string) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
};
