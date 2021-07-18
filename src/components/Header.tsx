import React, { ReactNode } from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { AppBar, IconButton, Toolbar, Typography } from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";
import Link from "next/link";
import { useLocale } from "../hooks/useLocale";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
  })
);

interface P {
  isShowMenu?: boolean;
  onClickMenu?: () => void;
  children?: ReactNode;
}

export const Header = (p: P) => {
  const classes = useStyles();
  const { t } = useLocale();
  return (
    <AppBar position="static">
      <Toolbar>
        {p.isShowMenu && (
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="menu"
            onClick={p.onClickMenu}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Link href="/presentations">
          <Typography variant="h6" className={classes.title}>
            {t.APP_TITLE}
          </Typography>
        </Link>
        {p.children}
      </Toolbar>
    </AppBar>
  );
};
