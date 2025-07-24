// PersonaMirror sidepanel.js
import { getRawQACount, getAllRawQA, saveSnapshot, getLatestSnapshot } from './db.js';

document.getElementById('status').textContent = '欢迎使用 PersonaMirror！';

// 显示捕获的对话条数
async function updateCount() {
  const count = await getRawQACount();
  document.getElementById('main').textContent = `已捕获对话条数：${count}`;
}
updateCount();

// 快照生成逻辑（简单压缩：只保留每条user/assistant的核心内容，合并为一段文本）
async function generateSnapshot() {
  const rawQAs = await getAllRawQA();
  // 简单压缩：只保留每条text，合并为一段
  const coreText = rawQAs.map(q => q.text).join('\n');
  const snapshot = {
    version: Date.now(),
    content: coreText.slice(0, 200 * 1024), // 限制200KB
    created_at: new Date().toISOString()
  };
  await saveSnapshot(snapshot);
  return snapshot;
}

// 显示快照内容
async function showSnapshot() {
  const snap = await getLatestSnapshot();
  document.getElementById('snapshot').textContent = snap ? snap.content.slice(0, 500) + (snap.content.length > 500 ? '\n...（已截断）' : '') : '暂无快照';
}

// 生成快照按钮
const genBtn = document.getElementById('genSnapshotBtn');
genBtn.onclick = async () => {
  genBtn.disabled = true;
  await generateSnapshot();
  await showSnapshot();
  genBtn.disabled = false;
};

// 注入快照按钮（预留接口，实际注入需content_script实现）
document.getElementById('injectBtn').onclick = async () => {
  const snap = await getLatestSnapshot();
  if (snap) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'INJECT_SNAPSHOT', data: snap.content });
    });
  }
};

// 初始显示快照
showSnapshot(); 