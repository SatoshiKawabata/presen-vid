import { useLocale } from "../hooks/useLocale";

export const Seo = () => {
  const locale = useLocale();

  return (
    <>
      <meta name="viewport" content="width=device-width,initial-scale=1.0" />
      <meta property="og:url" content="https://presen-vid.com" />
      <meta property="og:title" content={locale.t.HEAD_TITLE} />
      <meta property="og:site_name" content={locale.t.HEAD_TITLE} />
      <meta property="og:description" content={locale.t.HEAD_DESCRIPTION} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="ogp.png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <link rel="preconnect" href="https://fonts.gstatic.com" />
      <link
        href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900&amp;display=swap"
        rel="stylesheet"
      />
      <link rel="canonical" href="https://presen-vid.com" />
    </>
  );
};
