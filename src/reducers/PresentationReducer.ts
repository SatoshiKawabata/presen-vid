import { Audio, Presentation, Slide } from "../types";
import Dexie from "dexie";
import { v4 as uuidv4 } from "uuid";

export interface PresentationState {
  recordingState: RecordingState;
  selectedSlideUid?: Slide["uid"];
  presentation?: Presentation;
  isShowBackdrop: boolean;
}

export const createInitialState = (): PresentationState => {
  return {
    recordingState: "inactive",
    isShowBackdrop: false,
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
    };

export const PresentationReducer = (
  state: PresentationState,
  action: PresentationAction
): PresentationState => {
  console.log("reduce", state, action);
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
      const { presentation } = state;
      if (presentation) {
        return {
          ...state,
          presentation: {
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
          },
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