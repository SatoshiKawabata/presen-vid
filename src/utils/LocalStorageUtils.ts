import { ExportVideoType } from "../reducers/PresentationReducer";

enum LocalStorageKey {
  EXPORT_VIDEO_TYPE = "export-video-type",
}

export const getExportVideoType = () => {
  if (!localStorage) {
    return undefined;
  }
  const val = localStorage.getItem(LocalStorageKey.EXPORT_VIDEO_TYPE);
  if (val === ExportVideoType.MP4 || val === ExportVideoType.WEBM) {
    return val;
  }
  return ExportVideoType.MP4;
};

export const setExportVideoType = (type: ExportVideoType) => {
  localStorage && localStorage.setItem(LocalStorageKey.EXPORT_VIDEO_TYPE, type);
};
