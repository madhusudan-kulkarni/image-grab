import { storage } from 'wxt/utils/storage';

export const settings = {
  filenameTemplate: storage.defineItem<string>('local:filenameTemplate', {
    fallback: '${domain}_${timestamp}_${index}.${ext}',
  }),
  hoverOverlayEnabled: storage.defineItem<boolean>('local:hoverOverlayEnabled', {
    fallback: true,
  }),
  batchSubfolder: storage.defineItem<boolean>('local:batchSubfolder', {
    fallback: true,
  }),
};

export interface ImageInfo {
  src: string;
  originalName: string;
  ext: string;
  width: number;
  height: number;
}
