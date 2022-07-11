import React, { useContext, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Header } from "../../src/components/Header";
import { Presentation } from "../../src/types";
import { ListItem, List, Typography, Button } from "@material-ui/core";
import Container from "@material-ui/core/Container";
import { useRouter } from "next/dist/client/router";
import { useLocale } from "../../src/hooks/useLocale";
import { importFile } from "../../src/Utils";
import JSZip from "jszip";
import { GlobalContext } from "../../src/context/globalContext";
import { GetServerSideProps } from "next";
import {
  PresentationListItem,
  PresentationRepositoryType,
  PresentationWithoutId,
} from "../../src/usecase/port/IPresentationRepository";
import { createPresentationWithoutIdData } from "../../src/utils/PresentationDataUtils";

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  ctx.res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  ctx.res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  return { props: {} };
};

export default function Presentations() {
  const router = useRouter();
  const [presentationList, setPresentationList] = useState<
    PresentationListItem[]
  >([]);
  const {
    setSnackbarState,
    setBackdropState,
    setPresentationRepositoryType,
    getPresentationRepository,
  } = useContext(GlobalContext);
  const repository = getPresentationRepository();

  useEffect(() => {
    (async () => {
      const presentationList = await repository.getPresentationList();
      setPresentationList(presentationList);
    })();
  }, [repository]);

  const locale = useLocale();

  if (!repository) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{locale.t.PRESENTATION_LIST}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Container>
        <Typography variant="h5" component="h1" style={{ marginTop: 40 }}>
          {locale.t.CREATE_NEW_PRESENTATION}
        </Typography>
        <Typography variant="body1" component="p" style={{ marginTop: 8 }}>
          {locale.t.CREATE_NEW_PRESENTATION_DESCRIPTION}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={async () => {
            try {
              const files = await importFile("image/*", true);
              const title = `New Presentation ${presentationList.length}`;
              const newPresentation = createPresentationWithoutIdData(
                title,
                files
              );
              const presentation = await repository.createPresentation(
                newPresentation
              );
              router.push(`/presentations/${presentation.id}`);
            } catch (e) {
              console.error(e);
              setSnackbarState({
                type: "error",
                message: locale.t.LOAD_SLIDE_ERROR,
              });
            }
          }}
        >
          {locale.t.IMPORT}
        </Button>

        {presentationList.length > 0 && (
          <>
            <Typography variant="h5" component="h2" style={{ marginTop: 32 }}>
              {locale.t.PRESENTATION_LIST}
            </Typography>
            <List>
              {presentationList.map(({ id, title }) => {
                return (
                  <ListItem key={id}>
                    <Link href={`/presentations/${id}/slides/0`}>{title}</Link>
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
        <Typography variant="h6" component="h2" style={{ marginTop: 40 }}>
          {locale.t.IMPORT_PRESENTATION_DATA}
        </Typography>
        <Typography variant="body1" component="p" style={{ marginTop: 8 }}>
          {locale.t.IMPORT_PRESENTATION_DATA_DESCRIPTION}
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={async () => {
            try {
              const files = await importFile();
              setBackdropState({ message: locale.t.LOADING_DATA });
              const file = files[0];
              if (file && file.name.endsWith(".pvm")) {
                const res = await JSZip.loadAsync(file);
                const fileNames = Object.keys(res.files);
                let obj: Presentation | undefined = undefined;
                const blobMap = new Map<string, Blob>();
                for (const fileName of fileNames) {
                  const file = res.files[fileName]!;
                  if (file.name.endsWith(".json")) {
                    const str = await file.async("string");
                    obj = JSON.parse(str);
                  } else {
                    const blob = await file.async("blob");
                    blobMap.set(fileName, blob);
                  }
                }
                if (!obj) {
                  setBackdropState(null);
                  return;
                }
                obj.slides.forEach((slide) => {
                  const blob = blobMap.get(slide.uid)!;
                  const image = new File([blob], slide.uid);
                  slide.image = image;
                  slide.audios.forEach((audio) => {
                    audio.blob = blobMap.get(audio.uid)!;
                  });
                });

                const newPresentationData: PresentationWithoutId = {
                  title: obj.title,
                  slides: obj.slides,
                  width: obj.width,
                  height: obj.height,
                };

                const presentation = await repository.createPresentation(
                  newPresentationData
                );
                router.push(`/presentations/${presentation.id}`);
              } else {
                setSnackbarState({
                  message: locale.t.INVALID_FILE_TYPE,
                  type: "error",
                });
              }
              setBackdropState(null);
            } catch (e) {
              setSnackbarState({
                type: "error",
                message: locale.t.IMPORT_PRESENTATION_DATA_ERROR,
              });
            }
          }}
        >
          {locale.t.IMPORT}
        </Button>
        <Typography variant="body1" component="p" style={{ marginTop: 8 }}>
          {locale.t.LOAD_PRESENTATION_DIRECTORY}
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={async () => {
            setPresentationRepositoryType(
              PresentationRepositoryType.LOCAL_FILE_SYSTEM_ACCESS_API
            );
            const list = await repository.getPresentationList();
            setPresentationList(list);
          }}
        >
          {locale.t.IMPORT}
        </Button>
      </Container>
    </>
  );
}
