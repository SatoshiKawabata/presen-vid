import { Audio } from "./Audio";

export interface Slide {
    uid: string;
    title: string;
    image: File;
    audios: Audio[];
    selectedAudioUid?: Audio["uid"];
}
