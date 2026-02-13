import { useState, useEffect } from 'react';
import { settings } from '~/utils/storage';

export default function Popup() {
  const [filenameTemplate, setFilenameTemplate] = useState('${domain}_${timestamp}_${index}.${ext}');
  const [hoverOverlayEnabled, setHoverOverlayEnabled] = useState(true);
  const [batchSubfolder, setBatchSubfolder] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    settings.filenameTemplate.getValue().then(setFilenameTemplate);
    settings.hoverOverlayEnabled.getValue().then(setHoverOverlayEnabled);
    settings.batchSubfolder.getValue().then(setBatchSubfolder);
  }, []);

  const handleSave = async () => {
    await settings.filenameTemplate.setValue(filenameTemplate);
    await settings.hoverOverlayEnabled.setValue(hoverOverlayEnabled);
    await settings.batchSubfolder.setValue(batchSubfolder);
    
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      browser.tabs.sendMessage(tabs[0].id, { type: 'settings-updated' });
    }
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const openBatchDownloader = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await browser.tabs.sendMessage(tab.id, { type: 'open-batch-modal' });
      window.close();
    }
  };

  return (
    <div className="w-[320px] p-4 bg-white">
      <h1 className="text-lg font-bold mb-4 text-gray-800">Fast Save Image</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filename Template
          </label>
          <input
            type="text"
            value={filenameTemplate}
            onChange={(e) => setFilenameTemplate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="${domain}_${timestamp}_${index}.${ext}"
          />
          <p className="text-xs text-gray-500 mt-1">
            Variables: {'${original_name}'}, {'${ext}'}, {'${domain}'}, {'${timestamp}'}, {'${index}'}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Show hover overlay on images
          </label>
          <button
            onClick={() => setHoverOverlayEnabled(!hoverOverlayEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              hoverOverlayEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                hoverOverlayEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Create subfolder for batch downloads
          </label>
          <button
            onClick={() => setBatchSubfolder(!batchSubfolder)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              batchSubfolder ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                batchSubfolder ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </button>

        <button
          onClick={openBatchDownloader}
          className="w-full py-2 px-4 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 transition-colors"
        >
          Open Batch Downloader
        </button>
      </div>
    </div>
  );
}
