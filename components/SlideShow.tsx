import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { useEffect, useState } from "react";

const messageMap = new Map<string, string[]>();
const ERROR_LIST = ["Operation not permitted", "Conversion failed"].map((msg) =>
  msg.toLowerCase()
);

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

export const SlideShow = () => {
  const [src, setSrc] = useState("");
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recorderState, setRecorderState] = useState<RecordingState | null>(
    null
  );
  const [audioReady, setAudioReady] = useState(false);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [durationMillisec, setDurationMillisec] = useState(0);
  useEffect(() => {
    (async () => {
      await ffmpeg.load();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });
      const recorder = new MediaRecorder(stream);
      setRecorder(recorder);
      setRecorderState(recorder.state);
      let prevTime = 0;
      let duration = 0;
      recorder.onstart = () => {
        prevTime = Date.now();
        setRecorderState(recorder.state);
      };
      recorder.onpause = () => {
        duration += Date.now() - prevTime;
        setRecorderState(recorder.state);
      };
      recorder.onresume = () => {
        prevTime = Date.now();
        setRecorderState(recorder.state);
      };
      recorder.onstop = () => {
        duration += Date.now() - prevTime;
        setDurationMillisec(duration);
        setRecorderState(recorder.state);
      };
      recorder.ondataavailable = async (e) => {
        const fetchedFile = await fetchFile(e.data);
        ffmpeg.FS("writeFile", "audio", fetchedFile);
        setAudioReady(true);
      };
    })();
  }, []);
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
          setImageFiles(files);
        }}
      />
      {recorder && (
        <>
          <h2>録音</h2>
          {recorderState === "inactive" && (
            <button
              type="button"
              onClick={() => {
                if (recorder) {
                  recorder.start();
                }
              }}
            >
              録音開始
            </button>
          )}
          {recorderState === "recording" && (
            <button
              type="button"
              onClick={() => {
                if (recorder) {
                  recorder.stop();
                  recorder.stream.getTracks().forEach((track) => track.stop());
                }
              }}
            >
              録音終了
            </button>
          )}
        </>
      )}
      {audioReady && imageFiles && imageFiles.length > 0 && (
        <button
          type="button"
          onClick={async () => {
            const files = imageFiles;
            //音声を読み込んでfile systemに乗せる
            // ffmpeg.FS(
            //   "writeFile",
            //   "audio.ogg",
            //   await fetchFile("/assets/audio.ogg")
            // );

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
                "audio", // audio
                "-t",
                durationMillisec / 1000 + "", // 3秒の動画
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
              URL.createObjectURL(
                new Blob([data.buffer], { type: "video/mp4" })
              )
            );

            // unlink file
            ffmpeg.FS("unlink", "audio");
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
        >
          動画作成
        </button>
      )}
    </>
  );
};
