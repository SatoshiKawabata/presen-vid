import React, { useEffect, useReducer, useState } from "react";
import Head from "next/head";
import { Header } from "../../src/components/Header";
import Dexie from "dexie";
import { Presentation } from "../../src/types";
import { useRouter } from "next/dist/client/router";
import { SlideView } from "../../src/components/SlideView";
import {
  createInitialState,
  PresentationActionType,
  PresentationReducer,
} from "../../src/reducers/PresentationReducer";
import {
  Backdrop,
  Button,
  CircularProgress,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Modal,
  Tooltip,
  Typography,
} from "@material-ui/core";
import GetAppIcon from "@material-ui/icons/GetApp";
import { createVideo, download, getImageSize } from "../../src/Utils";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import { useLocale } from "../../src/hooks/useLocale";
import SettingsIcon from "@material-ui/icons/Settings";
import { Settings } from "../../src/components/Settings";
import Link from "next/link";
import HomeIcon from "@material-ui/icons/Home";

export default function Presentations() {
  const router = useRouter();
  const [state, dispatch] = useReducer(
    PresentationReducer,
    createInitialState()
  );
  const { presentation, selectedSlideUid, isShowBackdrop } = state;
  const selectedSlide = presentation?.slides.find(
    (slide) => slide.uid === selectedSlideUid
  );

  const [isOpenedMenu, setIsOpenedMenu] = useState(false);
  const [isOpenedSettingModal, setIsOpenedSettingModal] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    const splited = location.pathname.split("/");
    const id = splited[splited.length - 1];
    if (id && typeof id === "string") {
      const parsedId = parseInt(id);

      (async () => {
        const db = new Dexie("montage");
        db.version(1).stores({
          presentations: "++id, title, slides",
        });

        const presentation = await db
          .table<Presentation>("presentations")
          .get(parsedId);

        if (!presentation) {
          router.replace("/404");
          return Promise.resolve();
        }
        dispatch({
          type: PresentationActionType.SET_STATE,
          state: {
            presentation,
            selectedSlideUid: presentation.slides[0]?.uid,
          },
        });

        const { slides } = presentation;
        const sizes = await Promise.all(
          slides.map((slide) => {
            return getImageSize(URL.createObjectURL(slide.image));
          })
        );
        const maxSize = { width: 0, height: 0 };
        for (const size of sizes) {
          if (size.width > maxSize.width) {
            maxSize.width = size.width;
            maxSize.height = size.height;
          }
        }
        dispatch({
          type: PresentationActionType.SET_PRESENTATION_SIZE,
          width: maxSize.width,
          height: maxSize.height,
        });
      })();
    } else {
      router.replace("/404");
    }
  }, []);

  const isReadyToExport = state.presentation?.slides.every(
    (slide) => slide.audios.length > 0
  );

  return (
    <>
      <Head>
        <title>{locale.t.PRESENTATION}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header
        isShowMenu={true}
        onClickMenu={() => setIsOpenedMenu(!isOpenedMenu)}
      />
      <Drawer
        anchor="left"
        open={isOpenedMenu}
        onClose={() => setIsOpenedMenu(false)}
      >
        <List>
          <Tooltip
            title={isReadyToExport ? "" : locale.t.UNREADY_EXPORT}
            placement="right"
          >
            <ListItem
              button
              disabled={!isReadyToExport}
              onClick={async () => {
                setIsOpenedMenu(false);
                if (state.presentation) {
                  dispatch({ type: PresentationActionType.SHOW_BACKDROP });
                  const audios: Blob[] = [];
                  const durations: number[] = [];
                  const imageFiles: File[] = [];
                  const size = {
                    width: state.presentation.width,
                    height: state.presentation.height,
                  };
                  for (const slide of state.presentation.slides) {
                    imageFiles.push(slide.image);
                    for (const audio of slide.audios) {
                      if (audio.uid === slide.selectedAudioUid) {
                        audios.push(audio.blob);
                        durations.push(audio.durationMillisec);
                        break;
                      }
                    }
                  }

                  try {
                    const videoBlob = await createVideo(
                      imageFiles,
                      audios,
                      durations,
                      size
                    );
                    const url = URL.createObjectURL(videoBlob);
                    download(url, `${locale.t.NEW_VIDEO_NAME}.webm`);
                  } catch (e) {
                    console.error(e);
                  }
                  dispatch({ type: PresentationActionType.HIDE_BACKDROP });
                }
              }}
            >
              <ListItemIcon>
                <GetAppIcon />
              </ListItemIcon>
              <ListItemText primary={locale.t.EXPORT_VIDEO} />
            </ListItem>
          </Tooltip>
          <ListItem button onClick={() => setIsOpenedSettingModal(true)}>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary={locale.t.OPEN_SETTINGS} />
          </ListItem>
          <Link href="/presentations">
            <ListItem button>
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary={locale.t.BACK_TO_TOP} />
            </ListItem>
          </Link>
        </List>
      </Drawer>
      {presentation && selectedSlide && (
        <div
          style={{
            display: "flex",
            height: "calc(100vh - 64px)",
          }}
        >
          <div
            style={{
              width: "240px",
              height: "100%",
              overflow: "auto",
              flexShrink: 0,
              flexBasis: "240px",
              borderRight: "1px solid #bbb",
            }}
          >
            {presentation.slides.map((slide) => {
              return (
                <div
                  key={slide.uid}
                  style={{
                    borderBottom: "1px solid #bbb",
                    margin: "8px 4px",
                    position: "relative",
                  }}
                >
                  <Button
                    type="button"
                    onClick={() => {
                      dispatch({
                        type: PresentationActionType.SET_STATE,
                        state: { selectedSlideUid: slide.uid },
                      });
                    }}
                    draggable={false}
                    disabled={state.recordingState === "recording"}
                  >
                    <div
                      draggable={true}
                      onDragStartCapture={(e) => {
                        e.dataTransfer.setData("text/plain", slide.uid);
                        e.stopPropagation();
                      }}
                      onDragOverCapture={(e) => {
                        e.preventDefault();
                      }}
                      onDragEnterCapture={(e) => {
                        e.preventDefault();
                      }}
                      onDropCapture={(e) => {
                        const fromUid = e.dataTransfer.getData("text/plain");
                        dispatch({
                          type: PresentationActionType.DND_SLIDE,
                          fromUid,
                          toUid: slide.uid,
                        });
                        e.stopPropagation();
                      }}
                    >
                      <img
                        src={URL.createObjectURL(slide.image)}
                        draggable={false}
                      />
                    </div>
                    {slide.selectedAudioUid && (
                      <Tooltip
                        title={locale.t.RECORDED}
                        placement="right"
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                        }}
                      >
                        <CheckCircleIcon color="secondary" />
                      </Tooltip>
                    )}
                  </Button>
                </div>
              );
            })}
            <Button
              variant="contained"
              color="primary"
              style={{
                width: "calc(100% - 16px)",
                margin: "8px",
              }}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = (e) => {
                  const files = input.files;
                  if (files && files.length > 0) {
                    const file = files[0]!;
                    dispatch({ type: PresentationActionType.ADD_SLIDE, file });
                  }
                };
                input.click();
              }}
            >
              {locale.t.ADD_SLIDE}
            </Button>
          </div>
          <div style={{ flexGrow: 1 }}>
            <SlideView
              slide={selectedSlide}
              dispatch={dispatch}
              state={state}
            />
          </div>
        </div>
      )}
      <Modal
        open={isOpenedSettingModal}
        onClose={() => setIsOpenedSettingModal(false)}
        aria-labelledby={locale.t.SETTINGS_TITLE}
      >
        <Settings dispatch={dispatch} state={state} />
      </Modal>
      <Backdrop open={isShowBackdrop} style={{ zIndex: 9999, color: "#fff" }}>
        <CircularProgress color="inherit" />
        <Typography variant="h5" component="h1" color="inherit">
          {locale.t.EXPORTING}
        </Typography>
      </Backdrop>
    </>
  );
}
