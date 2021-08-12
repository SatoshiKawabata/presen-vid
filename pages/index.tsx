import React from "react";
import Head from "next/head";
import Link from "next/link";
import { Header } from "../src/components/Header";
import { useLocale } from "../src/hooks/useLocale";
import { Button, Container, CssBaseline, Typography } from "@material-ui/core";
import SlidesSvg from "../src/assets/slides.svg";
import RecordSvg from "../src/assets/record.svg";
import ExportVideoSvg from "../src/assets/export_video.svg";
import BalloonCloudSvg from "../src/assets/balloon_cloud.svg";
import BalloonCircleSvg from "../src/assets/balloon_circle.svg";
import BalloonGizaSvg from "../src/assets/balloon_giza.svg";
import { Footer } from "../src/components/Footer";
import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  ctx.res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  ctx.res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  return { props: {} };
};

export default function Home() {
  const locale = useLocale();
  return (
    <>
      <Head>
        <title>{locale.t.HEAD_TITLE}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <CssBaseline />

      <Container fixed>
        <div style={{ textAlign: "center" }}>
          <Typography
            component="h1"
            variant="h3"
            style={{ fontWeight: "bold", margin: "200px 0 32px" }}
          >
            {locale.t.LP_H1}
          </Typography>
          <Typography
            component="p"
            variant="body1"
            style={{ marginBottom: 40 }}
          >
            {locale.t.LP_SUB}
          </Typography>
          <div style={{ marginBottom: 80 }}>
            <Link href={`/presentations/`}>
              <Button
                type="button"
                variant="contained"
                color="primary"
                size="large"
              >
                {locale.t.LP_MAIN_BUTTON}
              </Button>
            </Link>
          </div>
          <div style={{ marginBottom: 160 }}>
            <iframe
              width="560"
              height="315"
              src="https://www.youtube.com/embed/eE-Rq1a-6Ng"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <div style={{ marginBottom: 200 }}>
            <Typography
              component="h2"
              variant="h6"
              style={{ marginBottom: 80 }}
            >
              {locale.t.LP_STEP_TITLE}
            </Typography>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 160,
              }}
            >
              <Typography
                component="p"
                variant="h5"
                style={{ marginBottom: 40, marginRight: 40 }}
              >
                {locale.t.LP_STEP_1}
              </Typography>
              <SlidesSvg />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 160,
              }}
            >
              <Typography
                component="p"
                variant="h5"
                style={{ marginBottom: 40, marginRight: 40 }}
              >
                {locale.t.LP_STEP_2}
              </Typography>
              <RecordSvg />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                component="p"
                variant="h5"
                style={{ marginBottom: 40, marginRight: 40 }}
              >
                {locale.t.LP_STEP_3}
              </Typography>
              <ExportVideoSvg />
            </div>
          </div>
          <div style={{ marginBottom: 200 }}>
            <Typography
              component="h2"
              variant="h6"
              style={{ marginBottom: 40 }}
            >
              {locale.t.LP_USECASE_TITLE}
            </Typography>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                marginBottom: 80,
              }}
            >
              <div style={{ position: "relative", marginRight: 40 }}>
                <BalloonCloudSvg />
                <Typography
                  component="p"
                  variant="body1"
                  style={{
                    marginBottom: 40,
                    position: "absolute",
                    top: 66,
                    left: 81,
                    width: 200,
                    fontWeight: "bold",
                  }}
                >
                  {locale.t.LP_USECASE_1_BALLOON}
                </Typography>
              </div>
              <Typography
                component="p"
                variant="h5"
                style={{
                  marginBottom: 40,
                }}
              >
                {locale.t.LP_USECASE_1}
              </Typography>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                marginBottom: 80,
              }}
            >
              <Typography component="p" variant="h5">
                {locale.t.LP_USECASE_2}
              </Typography>
              <div style={{ position: "relative", marginLeft: 4 }}>
                <BalloonCircleSvg style={{ marginBottom: 20 }} />
                <Typography
                  component="p"
                  variant="body1"
                  style={{
                    marginBottom: 40,
                    position: "absolute",
                    top: 31,
                    left: 28,
                    width: 200,
                    fontWeight: "bold",
                  }}
                >
                  {locale.t.LP_USECASE_2_BALLOON}
                </Typography>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-end",
                marginBottom: 80,
              }}
            >
              <div style={{ position: "relative", marginRight: 4 }}>
                <BalloonGizaSvg />
                <Typography
                  component="p"
                  variant="body1"
                  style={{
                    marginBottom: 40,
                    position: "absolute",
                    top: 92,
                    left: 75,
                    width: 200,
                    fontSize: 21,
                    fontWeight: "bold",
                  }}
                >
                  {locale.t.LP_USECASE_3_BALLOON}
                </Typography>
              </div>
              <Typography component="p" variant="h5">
                {locale.t.LP_USECASE_3}
              </Typography>
            </div>
          </div>
          <div style={{ marginBottom: 200 }}>
            <Link href={`/presentations/`}>
              <Button
                type="button"
                variant="contained"
                color="primary"
                size="large"
              >
                {locale.t.LP_MAIN_BUTTON}
              </Button>
            </Link>
          </div>
        </div>
      </Container>
      <Footer />
    </>
  );
}
