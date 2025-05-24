chrome.runtime.onMessage.addListener(
  async (msg, sender) => {
    if (msg.type !== 'translate') return;

    // DeepL API キーを取得
    const { apiKey } = await chrome.storage.local.get({ apiKey: '' });
    if (!apiKey) {
      chrome.tabs.sendMessage(sender.tab!.id!, { type: 'error', message: 'APIキー未設定' });
      return;
    }

    // DeepL へリクエスト
    try {
      const res = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          auth_key: apiKey,
          text: msg.text,
          target_lang: 'JA'
        })
      });
      const data = await res.json();
      const translated = data.translations?.[0]?.text ?? '(no result)';
      chrome.tabs.sendMessage(sender.tab!.id!, {
        type: 'translated',
        original: msg.text,
        translated
      });
    } catch (e) {
      chrome.tabs.sendMessage(sender.tab!.id!, { type: 'error', message: String(e) });
    }
  }
);

chrome.commands.onCommand.addListener(async (cmd) => {
  console.log('[SW] command:', cmd);
  switch (cmd) {
    case 'translate-selection': {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'start-translate' });
      }
      break;
    }

    case 'toggle-panel': {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'toggle-panel' });
      }
      break;
    }
  }
});