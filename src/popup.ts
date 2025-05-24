const keyEl = document.getElementById('key') as HTMLInputElement;

chrome.storage.local.get('apiKey').then(({ apiKey }) => {
  if (apiKey) keyEl.value = apiKey;
});

document.getElementById('save')!.addEventListener('click', async () => {
  await chrome.storage.local.set({ apiKey: keyEl.value.trim() });
  alert('Saved!');
});