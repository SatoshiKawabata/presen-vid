import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Header } from "../../src/components/Header";
import Dexie from "dexie";
import { Presentation } from "../../src/types";
import { ListItem, List, Typography } from "@material-ui/core";
import Container from "@material-ui/core/Container";
import { useRouter } from "next/dist/client/router";
import { v4 as uuidv4 } from "uuid";
import { useLocale } from "../../src/hooks/useLocale";

export default function Presentations() {
  const router = useRouter();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
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
      </Container>
    </>
  );
}
