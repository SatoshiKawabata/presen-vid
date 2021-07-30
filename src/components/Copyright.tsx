import React, { FC } from "react";

interface Props {
  name: string;
  startYear: number;
}

const Copyright: FC<Props> = ({ name, startYear }) => {
  const currentYear = new Date().getFullYear();
  return (
    <small>
      &copy; {startYear}
      {currentYear > startYear ? `-${currentYear}` : ""}{" "}
      <a href="https://kwst.site" target="_blank" rel="noopener noreferrer">
        {name}
      </a>
      .
    </small>
  );
};

export default Copyright;
