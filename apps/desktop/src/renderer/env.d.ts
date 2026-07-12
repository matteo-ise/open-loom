import type { OpenLoomAPI, OpenLoomInternal } from '@shared/types';

declare global {
  interface Window {
    openLoom: OpenLoomAPI;
    openLoomInternal: OpenLoomInternal;
  }
}

export {};
