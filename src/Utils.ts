import { GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import getConfig from "next/config";

export const goto404 = (ctx: GetServerSidePropsContext<ParsedUrlQuery>) => {
  // go to 404
  redirect("/404", ctx);
  return { props: {} };
};

export const redirect = (
  path: string,
  ctx: GetServerSidePropsContext<ParsedUrlQuery>
) => {
  const { publicRuntimeConfig } = getConfig();
  ctx.res?.writeHead(302, {
    Location: publicRuntimeConfig.basePath + path,
  });
  ctx.res?.end();
};
