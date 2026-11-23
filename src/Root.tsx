import React from "react";
import { Composition } from "remotion";
import { Main } from "./scenes/Main";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={180} fps={30} width={1920} height={1080} />
  </>
);
