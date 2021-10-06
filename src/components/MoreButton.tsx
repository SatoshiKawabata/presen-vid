import React from "react";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import MoreVertIcon from "@material-ui/icons/MoreVert";

interface Item {
  uid: string;
  label: string;
  disabled?: boolean;
}

interface P {
  onSelect: (item: Item) => void;
  items: Item[];
}

const ITEM_HEIGHT = 48;

export const MoreButton = ({ items, onSelect }: P) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        aria-label="more"
        aria-controls="long-menu"
        aria-haspopup="true"
        onClick={openMenu}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5,
          },
        }}
      >
        {items.map((item) => (
          <MenuItem
            key={item.uid}
            onClick={() => {
              handleClose();
              onSelect(item);
            }}
            disabled={item.disabled}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
