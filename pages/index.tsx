import Head from "next/head";
import { Montage } from "../components/Montage";

export default function Home() {
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Montage />
    </>
  );
}
