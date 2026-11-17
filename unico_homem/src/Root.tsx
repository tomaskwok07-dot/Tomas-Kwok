import React from 'react';
import {Composition} from 'remotion';
import {Video, TOTAL} from './Video';

export const Root = () => <Composition id="Video" component={Video} width={1080} height={1920} fps={30} durationInFrames={TOTAL} />;
