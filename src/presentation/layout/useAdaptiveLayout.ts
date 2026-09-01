import { useWindowDimensions } from 'react-native';

export type AdaptiveLayoutClass = 'compact' | 'regular' | 'wide';

export const adaptiveLayoutBreakpoints = {
  compactMax: 359,
  wideMin: 840,
} as const;

export const adaptiveLayoutMetrics = {
  wideStageMaxWidth: 1040,
  wideNavMaxWidth: 720,
} as const;

export function classifyAdaptiveLayout(width: number): AdaptiveLayoutClass {
  if (width <= adaptiveLayoutBreakpoints.compactMax) return 'compact';
  if (width >= adaptiveLayoutBreakpoints.wideMin) return 'wide';
  return 'regular';
}

export function useAdaptiveLayout() {
  const { width, height } = useWindowDimensions();
  const layoutClass = classifyAdaptiveLayout(width);

  return {
    width,
    height,
    layoutClass,
    isCompact: layoutClass === 'compact',
    isRegular: layoutClass === 'regular',
    isWide: layoutClass === 'wide',
    stageMaxWidth: adaptiveLayoutMetrics.wideStageMaxWidth,
    navMaxWidth: adaptiveLayoutMetrics.wideNavMaxWidth,
  } as const;
}
