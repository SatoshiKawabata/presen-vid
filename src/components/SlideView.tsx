import React, { Dispatch, useState } from "react";
import { Audio, Slide } from "../types";
import { Button, MenuItem, Select, Tooltip } from "@material-ui/core";
import {
  PresentationAction,
  PresentationActionType,
  PresentationState,
} from "../reducers/PresentationReducer";
import { v4 as uuidv4 } from "uuid";
import { useLocale } from "../hooks/useLocale";
import StopIcon from "@material-ui/icons/Stop";
import FiberManualRecordIcon from "@material-ui/icons/FiberManualRecord";
import { MoreButton } from "./MoreButton";

interface P {
  slide: Slide;
  dispatch: Dispatch<PresentationAction>;
  state: PresentationState;
}

enum MoreMenuItems {
  CHANGE_SLIDE = "change-slide",
}

export const SlideView = ({ slide, dispatch, state }: P) => {
  const [recorder, setRecorder] = useState<MediaRecorder | undefined>();

  const setRecortingState = (recordingState: RecordingState) => {
    dispatch({
      type: PresentationActionType.SET_RECORDING_STATE,
      recordingState,
    });
  };

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
                stream.getTracks().forEach((track) => track.stop());
                duration += Date.now() - prevTime;
                const blob = e.data;
                const audio: Audio = {
                  title: `${locale.t.NEW_AUDIO_NAME} ${
                    slide.audios.length + 1
                  }`,
                  blob,
                  durationMillisec: duration,
                  uid: uuidv4(),
                };
                dispatch({
                  type: PresentationActionType.ADD_AUDIO,
                  selectedSlideUid: slide.uid,
                  audio,
                  recordingState: _recorder.state,
                });
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
      {selectedAudio && (
        <div
          style={{
            display: "flex",
            padding: "16px",
          }}
        >
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
          <MoreButton
            items={[
              { label: locale.t.CHANGE_SLIDE, uid: MoreMenuItems.CHANGE_SLIDE },
            ]}
            onSelect={(item) => {
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
              }
            }}
          />
        </div>
      )}
    </>
  );
};
