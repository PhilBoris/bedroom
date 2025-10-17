import React from "react";
import PlayerFull from "./PlayerFull";
import PlayerFullMobile from "./PlayerFullMobile";

const isMobile = () => /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

export default function PlayerFullAuto(props) {
  return isMobile()
    ? <PlayerFullMobile {...props} />
    : <PlayerFull {...props} />;
}
