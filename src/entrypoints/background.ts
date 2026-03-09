import { settings } from '~/utils/storage';
import {
  formatFilename,
  getTimestamp,
  extractDomain,
  getFileExtension,
  getOriginalName,
} from '~/utils/filename';

export default defineBackground(() => {
  browser.contextMenus.create({
    id: 'fast-save-image',
    title: 'ImageGrab: Save Image',
    contexts: ['image'],
  });

  browser.contextMenus.create({
    id: 'fast-save-image-batch',
    title: 'ImageGrab: Save Page Images',
    contexts: ['page'],
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'fast-save-image' && info.srcUrl) {
      await downloadImage(info.srcUrl);
      return;
    }

    if (info.menuItemId === 'fast-save-image-batch' && tab?.id) {
      await openBatchModalOnTab(tab.id);
    }
  });

  browser.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'download-image') {
      await downloadImage(message.src);
    } else if (message.type === 'download-batch') {
      await downloadBatch(message.images);
    } else if (message.type === 'open-batch-modal' && typeof message.tabId === 'number') {
      await openBatchModalOnTab(message.tabId);
      return { ok: true };
    } else if (message.type === 'get-settings') {
      return {
        filenameTemplate: await settings.filenameTemplate.getValue(),
        hoverOverlayEnabled: await settings.hoverOverlayEnabled.getValue(),
        batchSubfolder: await settings.batchSubfolder.getValue(),
      };
    }
  });
});

async function downloadImage(src: string): Promise<void> {
  const template = await settings.filenameTemplate.getValue();
  const domain = extractDomain(src);
  const timestamp = getTimestamp();
  const ext = getFileExtension(src);
  const originalName = getOriginalName(src);

  const filename = formatFilename(template, {
    originalName,
    ext,
    domain,
    timestamp,
    index: 0,
  });

  await browser.downloads.download({
    url: src,
    filename,
    saveAs: false,
  });
}

async function downloadBatch(images: { src: string }[]): Promise<void> {
  if (!images.length) {
    return;
  }

  const batchSubfolder = await settings.batchSubfolder.getValue();
  const domain = extractDomain(images[0]?.src || '');
  const timestamp = getTimestamp();

  const folderPrefix = batchSubfolder ? `ImageGrab/${domain}/${timestamp}/` : '';
  
  for (let i = 0; i < images.length; i++) {
    const src = images[i].src;
    const ext = getFileExtension(src);
    const filename = batchSubfolder 
      ? `${folderPrefix}${i}.${ext}`
      : `${domain}_${timestamp}_${i}.${ext}`;

    await browser.downloads.download({
      url: src,
      filename,
      saveAs: false,
    });
  }
}

async function openBatchModalOnTab(tabId: number): Promise<void> {
  try {
    await browser.tabs.sendMessage(tabId, { type: 'open-batch-modal' });
    return;
  } catch {
    // Content script may not be loaded on tabs opened before install/update.
  }

  await browser.scripting.executeScript({
    target: { tabId },
    files: ['content-scripts/image-scraper.js'],
  });

  await browser.tabs.sendMessage(tabId, { type: 'open-batch-modal' });
}
