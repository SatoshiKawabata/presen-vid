import {
  createStyles,
  InputLabel,
  makeStyles,
  MenuItem,
  Select,
  Theme,
  Typography,
} from "@material-ui/core";
import React, { Dispatch, useEffect, useState } from "react";
import { useLocale } from "../hooks/useLocale";
import {
  PresentationAction,
  PresentationActionType,
  PresentationState,
} from "../reducers/PresentationReducer";

interface P {
  dispatch: Dispatch<PresentationAction>;
  state: PresentationState;
}

export const Settings = ({ dispatch, state }: P) => {
  const { audioDeviceId } = state;
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
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

  const classes = useStyles();
  const { t } = useLocale();

  console.log(
    "audioDeviceId",
    audioDeviceId,
    devices,
    devices.find((device) => device.deviceId === audioDeviceId)?.label
  );

  return (
    <div className={classes.paper}>
      <Typography variant="h6" component="h2" color="inherit">
        {t.SETTINGS_TITLE}
      </Typography>
      <InputLabel id="audio-device-select-label">
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
    </div>
  );
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      position: "absolute",
      width: 400,
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
