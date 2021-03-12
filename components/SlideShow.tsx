import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { useState } from "react";

const messageMap = new Map<string, string[]>();

const ffmpeg = createFFmpeg({
  logger: (msg) => {
    const { message, type } = msg;
    if (!messageMap.has(type)) {
      messageMap.set(type, []);
    }
    messageMap.get(type)?.push(message);
    if (message.toLowerCase().indexOf("error") > -1) {
      console.error("error", msg);
    } else {
      console.log("log", msg);
    }
  },
  progress: (progress) => {
    console.log("progress", progress);
  },
});

export const SlideShow = () => {
  const [src, setSrc] = useState("");
  return (
    <>
      <h1>複数の画像を連結して一つのビデオを作成するサンプル</h1>
      <video src={src} controls></video>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={async (e) => {
          const { files } = e.target;
          if (!files) {
            return;
          }

          await ffmpeg.load();

          //音声を読み込んでfile systemに乗せる
          ffmpeg.FS(
            "writeFile",
            "audio.ogg",
            await fetchFile("/assets/audio.ogg")
          );

          let fileList = "";
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file) {
              continue;
            }
            const { name } = file;
            // transcode
            const fetchedFile = await fetchFile(file);
            ffmpeg.FS("writeFile", name, fetchedFile);
            // 画像だけの動画を作る
            const tmpVideoName = `tmp_${name}.mp4`;
            await ffmpeg.run(
              "-framerate",
              "30",
              "-i",
              name,
              "-i",
              "audio.ogg", // audio
              "-t",
              "3", // 3秒の動画
              "-c:a",
              "copy",
              "-c:v",
              "libx264",
              // "-pix_fmt",
              // "yuv420p",
              tmpVideoName
            );
            fileList += `file '${tmpVideoName}'\n`;
          }
          console.log("fileList", fileList);
          // 画像のみの動画ファイルのリストのテキストファイルを作る
          ffmpeg.FS(
            "writeFile",
            "fileList.txt",
            new TextEncoder().encode(fileList)
          );
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
            "out.mp4"
          );
          const data = ffmpeg.FS("readFile", "out.mp4");
          setSrc(
            URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }))
          );

          // unlink file
          ffmpeg.FS("unlink", "audio.ogg");
          ffmpeg.FS("unlink", "fileList.txt");
          ffmpeg.FS("unlink", "out.mp4");
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file) {
              continue;
            }
            const { name } = file;
            ffmpeg.FS("unlink", name);
            const tmpVideoName = `tmp_${name}.mp4`;
            ffmpeg.FS("unlink", tmpVideoName);
          }
        }}
      />
    </>
  );
};
