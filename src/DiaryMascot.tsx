import React from 'react';
import {MutantDropMascot, type MascotProps} from './MutantDropMascot';
import {SproutMascot} from './SproutMascot';
import {PanelitoMascot} from './PanelitoMascot';
import type {DiaryMascotId} from './data/mascotStorage';

export function DiaryMascot({mascotId, ...props}: MascotProps & {mascotId: DiaryMascotId}) {
  if (mascotId === 'mudinha') return <SproutMascot {...props} />;
  if (mascotId === 'panelito') return <PanelitoMascot {...props} />;
  return <MutantDropMascot {...props} />;
}
