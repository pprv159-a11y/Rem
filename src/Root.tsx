import React from "react";
import { Composition } from "remotion";
import { Main } from "./scenes/Main";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Main"
    component={Main}
    durationInFrames={4 * 60 * 30}
    fps={30}
    width={1080}
    height={1920}
  />
);
