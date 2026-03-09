import { settings } from '~/utils/storage';

const root = document.getElementById('root');

if (root) {
  mountPopup(root);
}

async function mountPopup(container: HTMLElement) {
  const state = {
    filenameTemplate: await settings.filenameTemplate.getValue(),
    hoverOverlayEnabled: await settings.hoverOverlayEnabled.getValue(),
    batchSubfolder: await settings.batchSubfolder.getValue(),
    saved: false,
  };

  container.replaceChildren();

  const app = document.createElement('div');
  Object.assign(app.style, {
    width: '320px',
    padding: '16px',
    background: '#fff',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  });

  const title = document.createElement('h1');
  title.textContent = 'ImageGrab';
  Object.assign(title.style, {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
  });

  const form = document.createElement('div');
  Object.assign(form.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  });

  const templateWrap = document.createElement('div');
  const templateLabel = document.createElement('label');
  templateLabel.textContent = 'Filename Template';
  Object.assign(templateLabel.style, {
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  });

  const templateInput = document.createElement('input');
  templateInput.type = 'text';
  templateInput.value = state.filenameTemplate;
  templateInput.placeholder = '${domain}_${timestamp}_${index}.${ext}';
  Object.assign(templateInput.style, {
    width: '100%',
    boxSizing: 'border-box',
    padding: '8px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13px',
  });
  templateInput.addEventListener('input', () => {
    state.filenameTemplate = templateInput.value;
  });

  const templateHelp = document.createElement('p');
  templateHelp.textContent = 'Variables: ${original_name}, ${ext}, ${domain}, ${timestamp}, ${index}';
  Object.assign(templateHelp.style, {
    margin: '4px 0 0 0',
    fontSize: '12px',
    color: '#6b7280',
  });

  templateWrap.append(templateLabel, templateInput, templateHelp);

  const hoverRow = createToggleRow('Show hover overlay on images', state.hoverOverlayEnabled, (value) => {
    state.hoverOverlayEnabled = value;
  });

  const subfolderRow = createToggleRow('Create subfolder for batch downloads', state.batchSubfolder, (value) => {
    state.batchSubfolder = value;
  });

  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save Settings';
  Object.assign(saveButton.style, buttonStyle('#2563eb'));
  saveButton.addEventListener('click', async () => {
    await settings.filenameTemplate.setValue(state.filenameTemplate);
    await settings.hoverOverlayEnabled.setValue(state.hoverOverlayEnabled);
    await settings.batchSubfolder.setValue(state.batchSubfolder);

    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id) {
      await browser.tabs.sendMessage(tabs[0].id, { type: 'settings-updated' });
    }

    state.saved = true;
    saveButton.textContent = 'Saved!';
    window.setTimeout(() => {
      state.saved = false;
      saveButton.textContent = 'Save Settings';
    }, 2000);
  });

  const batchButton = document.createElement('button');
  batchButton.textContent = 'Open Batch Downloader';
  Object.assign(batchButton.style, buttonStyle('#0f172a'));

  const statusText = document.createElement('p');
  statusText.textContent = '';
  Object.assign(statusText.style, {
    margin: '0',
    minHeight: '16px',
    fontSize: '12px',
    color: '#dc2626',
  });

  batchButton.addEventListener('click', async () => {
    statusText.textContent = '';
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      statusText.textContent = 'No active tab found.';
      return;
    }

    try {
      await browser.runtime.sendMessage({ type: 'open-batch-modal', tabId: tab.id });
      window.close();
    } catch {
      statusText.textContent = 'Batch downloader is unavailable on this page.';
    }
  });

  form.append(templateWrap, hoverRow, subfolderRow, saveButton, batchButton, statusText);
  app.append(title, form);
  container.appendChild(app);
}

function createToggleRow(label: string, initial: boolean, onChange: (value: boolean) => void) {
  let value = initial;

  const row = document.createElement('div');
  Object.assign(row.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  });

  const text = document.createElement('label');
  text.textContent = label;
  Object.assign(text.style, {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  });

  const button = document.createElement('button');
  Object.assign(button.style, {
    position: 'relative',
    height: '24px',
    width: '44px',
    border: '0',
    borderRadius: '999px',
    cursor: 'pointer',
    padding: '0',
    transition: 'background-color 150ms ease',
  });

  const knob = document.createElement('span');
  Object.assign(knob.style, {
    position: 'absolute',
    top: '4px',
    left: '4px',
    height: '16px',
    width: '16px',
    borderRadius: '999px',
    background: '#fff',
    transition: 'transform 150ms ease',
  });

  const paint = () => {
    button.style.background = value ? '#2563eb' : '#d1d5db';
    knob.style.transform = value ? 'translateX(20px)' : 'translateX(0px)';
  };

  button.addEventListener('click', () => {
    value = !value;
    onChange(value);
    paint();
  });

  paint();
  button.appendChild(knob);
  row.append(text, button);
  return row;
}

function buttonStyle(background: string): Partial<CSSStyleDeclaration> {
  return {
    width: '100%',
    padding: '8px 12px',
    border: '0',
    borderRadius: '6px',
    color: '#fff',
    background,
    fontWeight: '600',
    cursor: 'pointer',
  };
}
