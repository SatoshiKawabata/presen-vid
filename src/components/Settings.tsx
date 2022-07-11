import {
  Button,
  createStyles,
  InputLabel,
  makeStyles,
  MenuItem,
  Modal,
  Select,
  TextField,
  Theme,
  Typography,
} from "@material-ui/core";
import { useRouter } from "next/dist/client/router";
import React, { Dispatch, useContext, useEffect, useState } from "react";
import { GlobalContext } from "../context/globalContext";
import { useLocale } from "../hooks/useLocale";
import {
  ExportVideoType,
  PresentationAction,
  PresentationActionType,
  PresentationState,
} from "../reducers/PresentationReducer";

interface P {
  dispatch: Dispatch<PresentationAction>;
  state: PresentationState;
}

export const Settings = ({ dispatch, state }: P) => {
  const { audioDeviceId, exportVideoType, presentation } = state;
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const router = useRouter();
  const { setSnackbarState, getPresentationRepository } =
    useContext(GlobalContext);
  const repository = getPresentationRepository();
  useEffect(() => {
    (async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(
        (device) => device.kind === "audioinput"
      );
      setDevices(audioDevices);
      console.log("audioDevices", audioDevices);
      if (audioDevices.length > 0) {
        dispatch({
          type: PresentationActionType.SET_AUDIO_DEVICE,
          deviceId: audioDevices[0]!.deviceId,
        });
      }
    })();
  }, []);

  const deleteUnusedAudioData = async () => {
    dispatch({
      type: PresentationActionType.DELETE_UNUSED_AUDIO_TRACKS,
      repository,
    });
  };

  const hasUnusedAudioTracks = state.presentation?.slides.some(
    (slide) => slide.audios.length > 1
  );

  const [isOpenedDeletePresentationModal, setIsOpenedDeletePresentationModal] =
    useState(false);

  const classes = useModalPaperStyles();
  const { t } = useLocale();

  return (
    <>
      <div className={classes.paper}>
        <Typography
          variant="subtitle2"
          component="h2"
          color="inherit"
          style={{ marginBottom: "24px" }}
        >
          {t.SETTINGS_TITLE}
        </Typography>
        <TextField
          label={t.PRESENTATION_TITLE}
          style={{ width: "100%", marginBottom: "24px" }}
          value={state.presentation?.title}
          onChange={(e) => {
            e.target.value;
            dispatch({
              type: PresentationActionType.SET_PRESENTATION_TITLE,
              title: e.target.value,
              repository,
            });
          }}
        />
        <InputLabel
          id="audio-device-select-label"
          style={{ marginBottom: "8px" }}
        >
          {t.AUDIO_DEVICE_SELECT}
        </InputLabel>
        <Select
          labelId="audio-device-select-label"
          value={audioDeviceId}
          onChange={(e) => {
            dispatch({
              type: PresentationActionType.SET_AUDIO_DEVICE,
              deviceId: e.target.value as string,
            });
          }}
          style={{ marginBottom: "24px", width: "100%" }}
        >
          {devices.map((device) => {
            return (
              <MenuItem
                key={device.deviceId}
                value={device.deviceId}
                selected={device.deviceId === audioDeviceId}
              >
                {device.label}
              </MenuItem>
            );
          })}
        </Select>
        <InputLabel
          id="audio-device-select-label"
          style={{ marginBottom: "8px" }}
        >
          {t.EXPORT_VIDEO_TYPE}
        </InputLabel>
        <Select
          labelId="audio-device-select-label"
          value={exportVideoType}
          onChange={(e) => {
            dispatch({
              type: PresentationActionType.SET_EXPORT_VIDEO_TYPE,
              exportVideoType: e.target.value as ExportVideoType,
            });
          }}
          style={{ marginBottom: "24px", width: "100%" }}
        >
          <MenuItem
            value={ExportVideoType.MP4}
            selected={exportVideoType === exportVideoType}
          >
            {ExportVideoType.MP4}
          </MenuItem>
          <MenuItem
            value={ExportVideoType.WEBM}
            selected={exportVideoType === exportVideoType}
          >
            {ExportVideoType.WEBM}
          </MenuItem>
        </Select>
        <InputLabel
          id="audio-device-select-label"
          style={{ marginBottom: "8px" }}
        >
          {t.DISK_SPACE}
        </InputLabel>
        <Button
          disabled={!hasUnusedAudioTracks}
          size="small"
          color="secondary"
          variant="contained"
          onClick={deleteUnusedAudioData}
          style={{ marginBottom: 16 }}
        >
          {t.DELETE_AUDIO_TRACKS}
        </Button>
        <Button
          disabled={!presentation}
          size="small"
          color="secondary"
          variant="text"
          onClick={() => setIsOpenedDeletePresentationModal(true)}
        >
          {t.DELETE_PRESENTATION}
        </Button>
      </div>
      <Modal
        open={isOpenedDeletePresentationModal}
        onClose={() => setIsOpenedDeletePresentationModal(false)}
        aria-labelledby={t.DELETE_PRESENTATION_MODAL_TITLE}
      >
        <div className={classes.paper}>
          <Typography
            variant="subtitle2"
            component="h2"
            color="inherit"
            style={{ marginBottom: "24px" }}
          >
            {t.DELETE_PRESENTATION_MODAL_TITLE}
          </Typography>
          <Button
            onClick={() => {
              setIsOpenedDeletePresentationModal(false);
            }}
            color="default"
          >
            {t.NO}
          </Button>
          <Button
            onClick={async () => {
              if (presentation) {
                await repository.deletePresentation(presentation.id);
                setSnackbarState({
                  type: "success",
                  message: t.DELETED_PRESENTATION,
                });
                router.push(`/presentations`);
              }
              setIsOpenedDeletePresentationModal(false);
            }}
            color="primary"
          >
            {t.YES}
          </Button>
        </div>
      </Modal>
    </>
  );
};

export const useModalPaperStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      position: "absolute",
      width: 500,
      backgroundColor: theme.palette.background.paper,
      border: "2px solid #000",
      boxShadow: theme.shadows[5],
      padding: theme.spacing(2, 4, 3),
      top: `50%`,
      left: `50%`,
      transform: `translate(-50%, -50%)`,
    },
  })
);
