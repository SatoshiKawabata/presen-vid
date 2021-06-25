import { Audio, Presentation, Slide } from "../types";
import Dexie from "dexie";
import { v4 as uuidv4 } from "uuid";

export interface PresentationState {
  recordingState: RecordingState;
  selectedSlideUid?: Slide["uid"];
  presentation?: Presentation;
  isShowBackdrop: boolean;
  audioDeviceId: MediaTrackConstraintSet["deviceId"];
}

export const createInitialState = (): PresentationState => {
  return {
    recordingState: "inactive",
    isShowBackdrop: false,
    audioDeviceId: "default",
  };
};

export enum PresentationActionType {
  SET_STATE,
  SET_RECORDING_STATE,
  ADD_AUDIO,
  SELECT_AUDIO,
  SHOW_BACKDROP,
  HIDE_BACKDROP,
  DND_SLIDE,
  ADD_SLIDE,
  SET_AUDIO_DEVICE,
  SET_PRESENTATION_TITLE,
  SET_PRESENTATION_SIZE,
  CHANGE_SLIDE,
  DELETE_SLIDE,
}

export type PresentationAction =
  | {
      type: PresentationActionType.SET_STATE;
      state: Partial<PresentationState>;
    }
  | {
      type: PresentationActionType.SET_RECORDING_STATE;
      recordingState: RecordingState;
    }
  | {
      type: PresentationActionType.ADD_AUDIO;
      audio: Audio;
      selectedSlideUid: Slide["uid"];
      recordingState: RecordingState;
    }
  | {
      type: PresentationActionType.SELECT_AUDIO;
      selectedSlideUid: Slide["uid"];
      selectedAudioUid: Audio["uid"];
    }
  | {
      type: PresentationActionType.SHOW_BACKDROP;
    }
  | {
      type: PresentationActionType.HIDE_BACKDROP;
    }
  | {
      type: PresentationActionType.DND_SLIDE;
      fromUid: Slide["uid"];
      toUid: Slide["uid"];
    }
  | {
      type: PresentationActionType.ADD_SLIDE;
      file: File;
    }
  | {
      type: PresentationActionType.SET_AUDIO_DEVICE;
      deviceId: MediaDeviceInfo["deviceId"];
    }
  | {
      type: PresentationActionType.SET_PRESENTATION_TITLE;
      title: Presentation["title"];
    }
  | {
      type: PresentationActionType.SET_PRESENTATION_SIZE;
      width: number;
      height: number;
    }
  | {
      type: PresentationActionType.CHANGE_SLIDE;
      slideUid: Slide["uid"];
      image: Slide["image"];
    }
  | {
      type: PresentationActionType.DELETE_SLIDE;
      slideUid: Slide["uid"];
    };

export const PresentationReducer = (
  state: PresentationState,
  action: PresentationAction
): PresentationState => {
  console.log("reduce", state, action);
  const { presentation } = state;
  switch (action.type) {
    case PresentationActionType.SET_STATE:
      return {
        ...state,
        ...action.state,
      };
    case PresentationActionType.SET_RECORDING_STATE:
      return {
        ...state,
        recordingState: action.recordingState,
      };
    case PresentationActionType.ADD_AUDIO:
      if (state.presentation) {
        const presentation: Presentation = {
          ...state.presentation,
          slides: state.presentation.slides.map((slide) => {
            if (slide.uid === action.selectedSlideUid) {
              return {
                ...slide,
                audios: [...slide.audios, action.audio],
                selectedAudioUid: action.audio.uid,
              };
            }
            return slide;
          }),
        };
        savePresentation(presentation);
        return {
          ...state,
          presentation,
          recordingState: action.recordingState,
        };
      }
      return state;
    case PresentationActionType.SELECT_AUDIO:
      if (state.presentation) {
        const presentation: Presentation = {
          ...state.presentation,
          slides: state.presentation.slides.map((slide) => {
            if (slide.uid === action.selectedSlideUid) {
              return {
                ...slide,
                selectedAudioUid: action.selectedAudioUid,
              };
            }
            return slide;
          }),
        };
        savePresentation(presentation);
        return {
          ...state,
          presentation,
          selectedSlideUid: action.selectedSlideUid,
        };
      }
      return state;
    case PresentationActionType.SHOW_BACKDROP:
      return {
        ...state,
        isShowBackdrop: true,
      };
    case PresentationActionType.HIDE_BACKDROP:
      return {
        ...state,
        isShowBackdrop: false,
      };
    case PresentationActionType.DND_SLIDE:
      if (state.presentation) {
        const { slides } = state.presentation;
        const fromIdx = slides.findIndex(
          (slide) => slide.uid === action.fromUid
        );
        const toIdx = slides.findIndex((slide) => slide.uid === action.toUid);
        const newSlides = [...slides];
        newSlides[fromIdx] = slides[toIdx]!;
        newSlides[toIdx] = slides[fromIdx]!;
        const presentation = {
          ...state.presentation,
          slides: newSlides,
        };
        savePresentation(presentation);
        return {
          ...state,
          presentation,
        };
      }
      return state;
    case PresentationActionType.ADD_SLIDE:
      const { file } = action;
      if (presentation) {
        const newPresentation = {
          ...presentation,
          slides: [
            ...presentation.slides,
            {
              uid: uuidv4(),

              title: file.name,
              image: file,
              audios: [],
            },
          ],
        };
        savePresentation(newPresentation);
        return {
          ...state,
          presentation: newPresentation,
        };
      }
      return state;
    case PresentationActionType.SET_AUDIO_DEVICE:
      return {
        ...state,
        audioDeviceId: action.deviceId,
      };
    case PresentationActionType.SET_PRESENTATION_TITLE:
      if (presentation) {
        const newPresentation = {
          ...presentation,
          title: action.title,
        };
        savePresentation(newPresentation);
        return {
          ...state,
          presentation: newPresentation,
        };
      }
      return state;
    case PresentationActionType.SET_PRESENTATION_SIZE:
      if (presentation) {
        const newPresentation = updatePresentation(presentation, {
          width: action.width,
          height: action.height,
        });
        return {
          ...state,
          presentation: newPresentation,
        };
      }
      return state;
    case PresentationActionType.CHANGE_SLIDE:
      if (presentation) {
        const newPresentation = updatePresentation(presentation, {
          slides: updateSlide(presentation.slides, action.slideUid, {
            image: action.image,
          }),
        });
        return {
          ...state,
          presentation: newPresentation,
        };
      }
      return state;
    case PresentationActionType.DELETE_SLIDE:
      if (presentation) {
        let deletedSlideIndex: number = 0;
        const newPresentation = updatePresentation(presentation, {
          slides: presentation.slides.filter((slide, index) => {
            deletedSlideIndex = index;
            return slide.uid !== action.slideUid;
          }),
        });
        const nextSelectedSlideIndex =
          deletedSlideIndex >= newPresentation.slides.length
            ? newPresentation.slides.length - 1
            : deletedSlideIndex;
        return {
          ...state,
          presentation: newPresentation,
          selectedSlideUid: newPresentation.slides[nextSelectedSlideIndex]?.uid,
        };
      }
      return state;
    default: {
      return state;
    }
  }
};

const savePresentation = async (presentation: Presentation) => {
  const db = new Dexie("montage");
  db.version(1).stores({
    presentations: "++id, title, slides",
  });

  await db
    .table<Omit<Presentation, "id">>("presentations")
    .update(presentation.id, presentation);
};

const updateSlide = (
  slides: Slide[],
  uid: Slide["uid"],
  properties: Partial<Slide>
) => {
  return slides.map((slide) => {
    if (slide.uid === uid) {
      return {
        ...slide,
        ...properties,
      };
    }
    return slide;
  });
};

const updatePresentation = (
  presentation: Presentation,
  properties: Partial<Presentation>
) => {
  const newPresentation = {
    ...presentation,
    ...properties,
  };
  savePresentation(newPresentation);
  return newPresentation;
};
