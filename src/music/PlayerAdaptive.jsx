import React from "react";
import PlayerFull from "./PlayerFull";
import PlayerFullMobile from "./PlayerFullMobile";

export default function PlayerAdaptive(props) {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  return isMobile ? (
    <PlayerFullMobile {...props} />
  ) : (
    <PlayerFull {...props} />
  );
}
