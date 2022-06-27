import React, { Dispatch, useContext, useState } from "react";
import { Slide } from "../types";
import {
  Button,
  MenuItem,
  Modal,
  Select,
  Tooltip,
  Typography,
} from "@material-ui/core";
import {
  PresentationAction,
  PresentationActionType,
  PresentationState,
} from "../reducers/PresentationReducer";
import { useLocale } from "../hooks/useLocale";
import StopIcon from "@material-ui/icons/Stop";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import { MoreButton } from "./MoreButton";
import { blob2audioData, download, importFile } from "../Utils";
import { GlobalContext } from "../context/globalContext";
import { useModalPaperStyles } from "./Settings";
import * as gtag from "../analytics/gatag";
import JSZip from "jszip";

interface P {
  slide: Slide;
  dispatch: Dispatch<PresentationAction>;
  state: PresentationState;
}

enum MoreMenuItems {
  CHANGE_SLIDE = "change-slide",
  DELETE_SLIDE = "delete-slide",
  EXPORT_SLIDE = "export-slide",
  UPLOAD_AUDIO = "upload-audio",
}

export const SlideView = ({ slide, dispatch, state }: P) => {
  const [recorder, setRecorder] = useState<MediaRecorder | undefined>();
  const { setBackdropState, setSnackbarState } = useContext(GlobalContext);
  const setRecortingState = (recordingState: RecordingState) => {
    dispatch({
      type: PresentationActionType.SET_RECORDING_STATE,
      recordingState,
    });
  };
  const [isOpenedDeleteSlideModal, setIsOpenedDeleteSlideModal] =
    useState(false);
  const classes = useModalPaperStyles();

  const selectedAudio = slide.audios.find(
    (audio) => audio.uid === slide.selectedAudioUid
  );

  const locale = useLocale();

  return (
    <>
      <style>{`
        @keyframes flash {
          0% {
            opacity: 1;
          }

          50% {
            opacity: 0.5;
          }

          100% {
            opacity: 1;
          }
        }
      `}</style>
      <div style={{ position: "relative", margin: "16px" }}>
        <img
          src={URL.createObjectURL(slide.image)}
          style={{
            width: "100%",
            filter: "drop-shadow(0px 0px 8px rgba(0,0,0,0.1))",
          }}
        />
        <Tooltip
          title={
            state.recordingState === "recording"
              ? locale.t.RECORDING
              : locale.t.RECORD_PRESENTATION
          }
          open={state.recordingState === "recording" ? false : undefined}
          placement="top"
        >
          <Button
            color="default"
            style={{
              position: "absolute",
              bottom: "8px",
              left: "8px",
              backgroundColor: "#f92929",
              color: "#fff",
              animation:
                state.recordingState === "recording"
                  ? "flash 1s linear infinite"
                  : "",
            }}
            onClick={async () => {
              if (state.recordingState === "recording" && recorder) {
                recorder.stop();
                return;
              }
              const stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: state.audioDeviceId },
                video: false,
              });
              const _recorder = new MediaRecorder(stream);
              setRecorder(_recorder);
              setRecortingState(_recorder.state);
              let prevTime = 0;
              let duration = 0;
              _recorder.onstart = () => {
                prevTime = Date.now();
                setRecortingState(_recorder.state);
              };
              _recorder.onpause = () => {
                duration += Date.now() - prevTime;
                setRecortingState(_recorder.state);
              };
              _recorder.onresume = () => {
                prevTime = Date.now();
                setRecortingState(_recorder.state);
              };
              _recorder.onstop = () => {
                setRecortingState(_recorder.state);
              };
              _recorder.ondataavailable = async (e) => {
                setBackdropState({ message: locale.t.SAVING_AUDIO });
                stream.getTracks().forEach((track) => track.stop());
                duration += Date.now() - prevTime;
                const blob = e.data;
                const audio = await blob2audioData(
                  blob,
                  duration,
                  `${locale.t.NEW_AUDIO_NAME} ${slide.audios.length + 1}`
                );
                dispatch({
                  type: PresentationActionType.ADD_AUDIO,
                  selectedSlideUid: slide.uid,
                  audio,
                  recordingState: _recorder.state,
                });
                gtag.event({
                  action: "record-audio",
                  category: "audio",
                  label: "",
                });
                setBackdropState(null);
              };
              _recorder.start();
            }}
          >
            {state.recordingState === "recording" ? (
              <StopIcon />
            ) : (
              <FiberManualRecordIcon />
            )}
            {state.recordingState === "recording"
              ? locale.t.RECORDING
              : locale.t.RECORD}
          </Button>
        </Tooltip>
      </div>
      <div
        style={{
          display: "flex",
          padding: "16px",
          justifyContent: "flex-end",
        }}
      >
        {selectedAudio && (
          <>
            <Select
              disabled={state.recordingState === "recording"}
              value={selectedAudio.uid}
              onChange={(e) => {
                const newSelectedAudio = slide.audios.find(
                  (audio) => audio.uid === e.target.value
                );
                newSelectedAudio &&
                  dispatch({
                    type: PresentationActionType.SELECT_AUDIO,
                    selectedSlideUid: slide.uid,
                    selectedAudioUid: newSelectedAudio.uid,
                  });
              }}
              style={{ margin: "0 4px", flexGrow: 0.1 }}
            >
              {slide.audios.map((audio) => {
                return (
                  <MenuItem
                    key={audio.uid}
                    value={audio.uid}
                    selected={audio.uid === selectedAudio.uid}
                  >
                    {audio.title}
                  </MenuItem>
                );
              })}
            </Select>
            {state.recordingState !== "recording" && (
              <audio
                src={URL.createObjectURL(selectedAudio.blob)}
                controls
                style={{ flexGrow: 1 }}
              />
            )}
          </>
        )}
        <MoreButton
          items={[
            { label: locale.t.CHANGE_SLIDE, uid: MoreMenuItems.CHANGE_SLIDE },
            {
              label: locale.t.DELETE_SLIDE,
              uid: MoreMenuItems.DELETE_SLIDE,
              disabled: state.presentation?.slides.length === 1,
            },
            { label: locale.t.EXPORT_SLIDE, uid: MoreMenuItems.EXPORT_SLIDE },
            { label: locale.t.UPLOAD_AUDIO, uid: MoreMenuItems.UPLOAD_AUDIO },
          ]}
          onSelect={async (item) => {
            if (item.uid === MoreMenuItems.CHANGE_SLIDE) {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = () => {
                if (input.files && input.files[0]) {
                  const file = input.files[0];
                  dispatch({
                    type: PresentationActionType.CHANGE_SLIDE,
                    slideUid: slide.uid,
                    image: file,
                  });
                }
              };
              input.click();
            } else if (item.uid === MoreMenuItems.DELETE_SLIDE) {
              setIsOpenedDeleteSlideModal(true);
            } else if (item.uid === MoreMenuItems.EXPORT_SLIDE) {
              setBackdropState({ message: locale.t.EXPORTING_SLIDE });
              const zip = new JSZip();
              zip.file(slide.uid, slide.image);
              slide.audios.forEach((audio) => {
                zip.file(audio.uid, audio.blob);
              });
              const json = JSON.stringify(slide);
              zip.file("slide.json", json);
              const blob = await zip.generateAsync({ type: "blob" });
              download(URL.createObjectURL(blob), `${slide.title}.slide`);
              setBackdropState(null);
            } else if (item.uid === MoreMenuItems.UPLOAD_AUDIO) {
              const files = await importFile("audio/*");
              const blob = files.item(0);
              if (!blob) {
                setSnackbarState({
                  message: locale.t.ERROR_UPLOAD_AUDIO,
                  type: "error",
                });
                return;
              }
              setBackdropState({ message: locale.t.UPLOADING_AUDIO });
              const audioTag = document.createElement("audio");
              audioTag.addEventListener("loadeddata", async () => {
                console.log(audioTag, audioTag.duration);
                const { duration } = audioTag;
                const audio = await blob2audioData(
                  blob,
                  duration * 1000,
                  `${locale.t.NEW_AUDIO_NAME} ${slide.audios.length + 1}`
                );
                dispatch({
                  type: PresentationActionType.ADD_AUDIO,
                  selectedSlideUid: slide.uid,
                  audio,
                });
                setBackdropState(null);
              });
              audioTag.src = URL.createObjectURL(blob);
            }
          }}
        />
      </div>
      <Modal
        open={isOpenedDeleteSlideModal}
        onClose={() => setIsOpenedDeleteSlideModal(false)}
        aria-labelledby={locale.t.DELETE_SLIDE_MODAL_TITLE}
      >
        <div className={classes.paper}>
          <Typography
            variant="subtitle2"
            component="h2"
            color="inherit"
            style={{ marginBottom: "24px" }}
          >
            {locale.t.DELETE_SLIDE_MODAL_TITLE}
          </Typography>
          <Button
            onClick={() => {
              setIsOpenedDeleteSlideModal(false);
            }}
            color="default"
          >
            {locale.t.NO}
          </Button>
          <Button
            onClick={() => {
              dispatch({
                type: PresentationActionType.DELETE_SLIDE,
                slideUid: slide.uid,
              });
              setSnackbarState({
                type: "success",
                message: locale.t.DELETED_SLIDE,
              });
              setIsOpenedDeleteSlideModal(false);
            }}
            color="primary"
          >
            {locale.t.YES}
          </Button>
        </div>
      </Modal>
    </>
  );
};
