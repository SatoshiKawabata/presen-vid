import { Slide } from "./Slide";

export interface Presentation {
    id: number;
    title: string;
    slides: Slide[];
    width: number;
    height: number;
}