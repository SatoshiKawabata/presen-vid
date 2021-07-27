import React, { useContext, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Header } from "../../src/components/Header";
import Dexie from "dexie";
import { Presentation } from "../../src/types";
import { ListItem, List, Typography, Button } from "@material-ui/core";
import Container from "@material-ui/core/Container";
import { useRouter } from "next/dist/client/router";
import { v4 as uuidv4 } from "uuid";
import { useLocale } from "../../src/hooks/useLocale";
import { importFile } from "../../src/Utils";
import JSZip from "jszip";
import { GlobalContext } from "../../src/context/globalContext";

export default function Presentations() {
  const router = useRouter();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const { setSnackbarState, setBackdropState } = useContext(GlobalContext);

  useEffect(() => {
    (async () => {
      const db = new Dexie("montage");
      db.version(1).stores({
        presentations: "++id, title, slides",
      });
      const presentations = await db
        .table<Presentation>("presentations")
        .toArray();
      setPresentations(presentations);
    })();
  }, []);

  const locale = useLocale();

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
        <input
          style={{ marginTop: 8 }}
          type="file"
          multiple
          accept="image/*"
          onChange={async (e) => {
            if (e.target.files) {
              const db = new Dexie("montage");
              db.version(1).stores({
                presentations: "++id, title, slides",
              });
              const id = await db
                .table<Omit<Presentation, "id">>("presentations")
                .add({
                  title: `New Presentation ${presentations.length}`,
                  slides: Array.from(e.target.files).map((file) => {
                    return {
                      uid: uuidv4(),
                      title: file.name,
                      image: file,
                      audios: [],
                    };
                  }),
                  width: 0,
                  height: 0,
                });
              router.push(`/presentations/${id}`);
            }
          }}
        />

        {presentations.length > 0 && (
          <>
            <Typography variant="h5" component="h2" style={{ marginTop: 32 }}>
              {locale.t.PRESENTATION_LIST}
            </Typography>
            <List>
              {presentations.map((presentation) => {
                return (
                  <ListItem key={presentation.id}>
                    <Link href={`/presentations/${presentation.id}/slides/0`}>
                      {presentation.title}
                    </Link>
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
                  audio.blobForPreview = blobMap.get(`${audio.uid}.preview`)!;
                });
              });
              // Save to indexedDB
              const db = new Dexie("montage");
              db.version(1).stores({
                presentations: "++id, title, slides",
              });
              const newPresentationData: Omit<Presentation, "id"> = {
                title: obj.title,
                slides: obj.slides,
                width: obj.width,
                height: obj.height,
              };
              const id = await db
                .table<Omit<Presentation, "id">>("presentations")
                .add(newPresentationData);
              router.push(`/presentations/${id}`);
            } else {
              setSnackbarState({
                message: locale.t.INVALID_FILE_TYPE,
                type: "error",
              });
            }
            setBackdropState(null);
          }}
        >
          {locale.t.IMPORT}
        </Button>
      </Container>
    </>
  );
}
