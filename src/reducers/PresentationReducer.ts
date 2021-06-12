import { Audio, Presentation, Slide } from "../types";
import Dexie from "dexie";

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
        updatePresentation(presentation);
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
        updatePresentation(presentation);
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

    default: {
      return state;
    }
  }
};

const updatePresentation = async (presentation: Presentation) => {
  const db = new Dexie("montage");
  db.version(1).stores({
    presentations: "++id, title, slides",
  });

  await db
    .table<Omit<Presentation, "id">>("presentations")
    .update(presentation.id, presentation);
};
