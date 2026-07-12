import type { LoomForgeAPI, LoomForgeInternal } from '@shared/types';

declare global {
  interface Window {
    loomforge: LoomForgeAPI;
    loomforgeInternal: LoomForgeInternal;
  }
}

export {};
