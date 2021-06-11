export interface Presentation {
  id: number;
  title: string;
  slides: Slide[];
}

export interface Slide {
  uid: string;
  title: string;
  image: File;
  audios: Audio[];
  selectedAudioUid?: Audio["uid"];
}

export interface Audio {
  uid: string;
  title: string;
  blob: Blob;
  durationMillisec: number;
}
