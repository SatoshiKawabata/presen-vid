import { useRouter } from "next/dist/client/router";
import React, { useEffect } from "react";

export default function Presentation() {
  const router = useRouter();
  useEffect(() => {
    if (!router.isReady) {
      return;
    }
    const { presentation_id } = router.query;
    router.replace(`/presentations/${presentation_id}/slides/0`);
  }, [router.query]);
  return <></>;
}
