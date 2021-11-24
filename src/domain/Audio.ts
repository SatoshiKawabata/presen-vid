
export interface Audio {
    uid: string;
    title: string;
    blob: Blob;
    blobForPreview?: Blob;
    durationMillisec: number;
}