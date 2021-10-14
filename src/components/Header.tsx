import React, { ReactNode } from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { AppBar, IconButton, Toolbar, Typography } from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";
import Link from "next/link";
import { useLocale } from "../hooks/useLocale";
import LogoSvg from "../assets/logo.svg";

interface P {
  isShowMenu?: boolean;
  onClickMenu?: () => void;
  children?: ReactNode;
}

export const Header = (p: P) => {
  const { t } = useLocale();
  return (
    <AppBar position="static">
      <Toolbar>
        {p.isShowMenu && (
          <IconButton
            edge="start"
            style={{ marginRight: 16 }}
            color="inherit"
            aria-label="menu"
            onClick={p.onClickMenu}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Link href="/presentations">
          <Typography
            variant="h6"
            style={{ flexGrow: 1, display: "flex", alignItems: "center" }}
          >
            <LogoSvg style={{ fill: "white", marginRight: 8 }} />
            {t.APP_TITLE}
          </Typography>
        </Link>
        {p.children}
      </Toolbar>
    </AppBar>
  );
};
