import React from "react";
import { Composition } from "remotion";
import { Episode, FullSeries } from "./scenes/Main";

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;
const ONE_MINUTE = FPS * 60;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Part1" component={Episode} durationInFrames={ONE_MINUTE} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ part: 1 }} />
    <Composition id="Part2" component={Episode} durationInFrames={ONE_MINUTE} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ part: 2 }} />
    <Composition id="Part3" component={Episode} durationInFrames={ONE_MINUTE} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ part: 3 }} />
    <Composition id="Part4" component={Episode} durationInFrames={ONE_MINUTE} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ part: 4 }} />
    <Composition id="Part5" component={Episode} durationInFrames={ONE_MINUTE} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{ part: 5 }} />
    <Composition id="FullSeries" component={FullSeries} durationInFrames={ONE_MINUTE * 5} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
