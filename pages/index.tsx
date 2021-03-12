import Head from "next/head";
import { Montage } from "../components/Montage";
import { SlideShow } from "../components/SlideShow";

export default function Home() {
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Montage />
      <SlideShow />
    </>
  );
}
