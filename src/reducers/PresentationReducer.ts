import { Audio, Presentation, Slide } from "../types";
import { v4 as uuidv4 } from "uuid";
import { setExportVideoType } from "../utils/LocalStorageUtils";
import { IPresentationRepository } from "../usecase/port/IPresentationRepository";

export interface PresentationState {
  recordingState: RecordingState;
  selectedSlideUid?: Slide["uid"];
  presentation?: Presentation;
  audioDeviceId: MediaTrackConstraintSet["deviceId"];
  exportVideoType: ExportVideoType;
}

export enum ExportVideoType {
  MP4 = "mp4",
  WEBM = "webm",
}

export const createInitialState = (): PresentationState => {
  return {
    recordingState: "inactive",
    audioDeviceId: "default",
    exportVideoType: ExportVideoType.WEBM,
  };
};

export enum PresentationActionType {
  SET_STATE,
  SET_RECORDING_STATE,
  ADD_AUDIO,
  SELECT_AUDIO,
  DND_SLIDE,
  ADD_SLIDE,
  ADD_SLIDE_DATA,
  SET_AUDIO_DEVICE,
  SET_PRESENTATION_TITLE,
  SET_PRESENTATION_SIZE,
  CHANGE_SLIDE,
  DELETE_SLIDE,
  SET_EXPORT_VIDEO_TYPE,
  DELETE_UNUSED_AUDIO_TRACKS,
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
      recordingState?: RecordingState;
      repository: IPresentationRepository;
    }
  | {
      type: PresentationActionType.SELECT_AUDIO;
      selectedSlideUid: Slide["uid"];
      selectedAudioUid: Audio["uid"];
      repository: IPresentationRepository;
    }
  | {
      type: PresentationActionType.DND_SLIDE;
      fromUid: Slide["uid"];
      toUid: Slide["uid"];
      repository: IPresentationRepository;
    }
  | {
      type: PresentationActionType.ADD_SLIDE;
      file: File;
      repository: IPresentationRepository;
    }
  | {
      type: PresentationActionType.ADD_SLIDE_DATA;
      slide: Slide;
      repository: IPresentationRepository;
    }
  | {
      type: PresentationActionType.SET_AUDIO_DEVICE;
      deviceId: MediaDeviceInfo["deviceId"];
    }
  | {
      type: PresentationActionType.SET_PRESENTATION_TITLE;
      title: Presentation["title"];
      repository: IPresentationRepository;
    }
  | {
      type: PresentationActionType.SET_PRESENTATION_SIZE;
      width: number;
      height: number;
      repository: IPresentationRepository;
    }
  | {
      type: PresentationActionType.CHANGE_SLIDE;
      slideUid: Slide["uid"];
      image: Slide["image"];
      repository: IPresentationRepository;
    }
  | {
      type: PresentationActionType.DELETE_SLIDE;
      slideUid: Slide["uid"];
      repository: IPresentationRepository;
    }
  | {
      type: PresentationActionType.SET_EXPORT_VIDEO_TYPE;
      exportVideoType: ExportVideoType;
    }
  | {
      type: PresentationActionType.DELETE_UNUSED_AUDIO_TRACKS;
      repository: IPresentationRepository;
    };

export const PresentationReducer = (
  state: PresentationState,
  action: PresentationAction
): PresentationState => {
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
        action.repository.savePresentation(presentation);
        return {
          ...state,
          presentation,
          recordingState: action.recordingState
            ? action.recordingState
            : state.recordingState,
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
        action.repository.savePresentation(presentation);
        return {
          ...state,
          presentation,
          selectedSlideUid: action.selectedSlideUid,
        };
      }
      return state;
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
        action.repository.savePresentation(presentation);
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
        action.repository.savePresentation(newPresentation);
        return {
          ...state,
          presentation: newPresentation,
        };
      }
      return state;
    case PresentationActionType.ADD_SLIDE_DATA:
      const { slide } = action;
      if (presentation) {
        const newPresentation = {
          ...presentation,
          slides: [...presentation.slides, slide],
        };
        action.repository.savePresentation(newPresentation);
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
        action.repository.savePresentation(newPresentation);
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
        action.repository.savePresentation(newPresentation);
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
        action.repository.savePresentation(newPresentation);
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
        action.repository.savePresentation(newPresentation);
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
    case PresentationActionType.SET_EXPORT_VIDEO_TYPE:
      setExportVideoType(action.exportVideoType);
      return {
        ...state,
        exportVideoType: action.exportVideoType,
      };
    case PresentationActionType.DELETE_UNUSED_AUDIO_TRACKS:
      if (presentation) {
        const newSlides = presentation.slides.map((slide) => {
          const selectedAudio = slide.audios.find(
            (audio) => audio.uid === slide.selectedAudioUid
          );
          if (selectedAudio) {
            return {
              ...slide,
              audios: [selectedAudio],
            };
          }
          return slide;
        });
        const newPresentation = updatePresentation(presentation, {
          slides: newSlides,
        });
        action.repository.savePresentation(newPresentation);
        return {
          ...state,
          presentation: newPresentation,
        };
      } else {
        return state;
      }
    default: {
      return state;
    }
  }
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
  return newPresentation;
};
