import React from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { AppBar, IconButton, Toolbar, Typography } from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";

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
}

export const Header = (p: P) => {
  const classes = useStyles();
  return (
    <>
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
          <Typography variant="h6" className={classes.title}>
            Slideshow
          </Typography>
        </Toolbar>
      </AppBar>
    </>
  );
};
