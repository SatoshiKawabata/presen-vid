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

  return (
    <>
      <Head>
        <title>Presentation List</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Container>
        <Typography variant="h6" component="h1">
          Upload new slides
        </Typography>
        <input
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
                  title: "New Presentation",
                  slides: Array.from(e.target.files).map((file) => {
                    return {
                      uid: uuidv4(),
                      title: file.name,
                      image: file,
                      audios: [],
                    };
                  }),
                });
              router.push(`/presentations/${id}`);
            }
          }}
        />
        <List>
          {presentations.map((presentation) => {
            return (
              <ListItem>
                <Link href={`/presentations/${presentation.id}`}>
                  {presentation.title}
                </Link>
              </ListItem>
            );
          })}
        </List>
      </Container>
    </>
  );
}
