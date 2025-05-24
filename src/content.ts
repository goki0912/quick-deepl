// ================== 定数 ==================
const STORAGE_KEY = 'deeplPanelState';   // x,y,w,h を保存
const MARGIN = 20;
const INIT_W = 200;
const INIT_H = 120; // 初期サイズ 

// ================== 変数 ==================
let panel: HTMLDivElement | null = null;

// ================== メッセージ受信 ==================
chrome.runtime.onMessage.addListener((msg) => {
  switch (msg.type) {
    case 'translated':
      showPanel(msg.translated);
      break;

    case 'toggle-panel':
      // 無ければ空で生成、あればトグル
      if (!panel) showPanel('');
      else {
        panel.style.display =
          panel.style.display === 'none' ? 'block' : 'none';
        if (panel.style.display === 'block') clampToViewport();
      }
      break;

    case 'start-translate': {
      const text = window.getSelection()?.toString().trim();
      if (text) chrome.runtime.sendMessage({ type: 'translate', text });
      break;
    }
  }
});

// ================== パネル表示 ==================
async function showPanel(text: string) {
  if (!panel) createPanel();
  panel!.querySelector('#body')!.textContent = text || '(no text)';
  panel!.style.display = 'block';
  clampToViewport();
}

// ------------------ パネル生成 ------------------
async function createPanel() {
  panel = document.createElement('div');
  panel.id = 'deepl-panel';
  panel.innerHTML = `
    <div id="header"
         style="cursor:grab;padding:6px 8px;background:#333;color:#fff;
                border-top-left-radius:8px;border-top-right-radius:8px">
      DeepL <button id="close" style="float:right">✖</button>
    </div>
    <div id="body"
         style="padding:8px;white-space:pre-wrap;background:#222;color:#fff;
                font-size:13px;line-height:1.4;min-height:40px"></div>`;

  Object.assign(panel.style, {
    position: 'fixed',
    zIndex: '2147483647',
    resize: 'both',
    overflow: 'auto',
    borderRadius: '8px',
    width: INIT_W + 'px',
    background: '#222',
  });

  // 位置・サイズを復元
  const saved = (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY];
  if (saved) {
    panel.style.left = saved.x + 'px';
    panel.style.top  = saved.y + 'px';
    panel.style.width  = saved.w + 'px';
    panel.style.height = saved.h + 'px';
  } else {
    centerInViewport();
  }

  document.body.appendChild(panel);

  // --- ドラッグ移動 ---
  const header = panel.querySelector<HTMLDivElement>('#header')!;
  let drag = false, offX = 0, offY = 0;
  header.addEventListener('pointerdown', e => {
    drag = true;
    offX = e.clientX - panel!.offsetLeft;
    offY = e.clientY - panel!.offsetTop;
    header.style.cursor = 'grabbing';
  });
  window.addEventListener('pointermove', e => {
    if (!drag) return;
    panel!.style.left = e.clientX - offX + 'px';
    panel!.style.top  = e.clientY - offY + 'px';
  });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    drag = false; header.style.cursor = 'grab';
    saveState();                      // 移動後に保存
  });

  // --- リサイズ保存 ---
  new ResizeObserver(saveState).observe(panel);

  // --- 閉じるボタン ---
  panel.querySelector('#close')!
       .addEventListener('click', () => (panel!.style.display = 'none'));
}

// ------------------ 位置補正 ------------------
function clampToViewport() {
  if (!panel) return;

  // 横方向: panel.offsetLeft を MARGIN〜(画面幅 − panel幅 − MARGIN) の範囲に収める
  const x = Math.min(
    Math.max(panel.offsetLeft, MARGIN),                         // 左にはみ出さない
    window.innerWidth - panel.offsetWidth - MARGIN              // 右にはみ出さない
  );

  // 縦方向: panel.offsetTop を MARGIN〜(画面高 − panel高 − MARGIN) の範囲に収める
  const y = Math.min(
    Math.max(panel.offsetTop, MARGIN),                          // 上にはみ出さない
    window.innerHeight - panel.offsetHeight - MARGIN            // 下にはみ出さない
  );

  // パネル位置を補正後の値で更新
  panel.style.left = x + 'px';
  panel.style.top  = y + 'px';
}


// ------------------ 真ん中初期配置 ------------------
function centerInViewport() {
  panel!.style.left = (window.innerWidth - INIT_W) / 2 + 'px';
  panel!.style.top  = (window.innerHeight - INIT_H) / 2 + 40 + 'px';
}


// ------------------ 位置とサイズを保存 ------------------
function saveState() {
  if (!panel) return;
  chrome.storage.local.set({
    [STORAGE_KEY]: {
      x: panel.offsetLeft,
      y: panel.offsetTop,
      w: panel.offsetWidth,
      h: panel.offsetHeight
    }
  });
}
