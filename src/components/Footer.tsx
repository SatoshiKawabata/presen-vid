import React from "react";
import Copyright from "./Copyright";
import GitHubIcon from "@mui/icons-material/GitHub";
import TwitterIcon from "@mui/icons-material/Twitter";

export const Footer = () => {
  return (
    <div style={{ margin: "20px 0" }}>
      <div style={{ textAlign: "center" }}>
        <a
          href="https://github.com/SatoshiKawabata"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GitHubIcon />
        </a>
        <a
          href="https://twitter.com/kwbtsts"
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: 8 }}
        >
          <TwitterIcon />
        </a>
      </div>
      <div style={{ textAlign: "center" }}>
        <Copyright name="kwst.site" startYear={2021} />
      </div>
    </div>
  );
};
