// PersonaMirror sidepanel.js

document.getElementById('status').textContent = '欢迎使用 PersonaMirror！';

function showToast(msg) {
  let toast = document.getElementById('pm-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'pm-toast';
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#333';
    toast.style.color = '#fff';
    toast.style.padding = '8px 20px';
    toast.style.borderRadius = '4px';
    toast.style.zIndex = '9999';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => { toast.style.display = 'none'; }, 1800);
}

function saveToFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// 显示捕获的对话条数
async function updateCount() {
  if (window.getRawQACount) {
    const count = await window.getRawQACount();
    document.getElementById('main').textContent = `已捕获对话条数：${count}`;
  }
}
updateCount();

// 快照生成逻辑
async function generateSnapshot() {
  if (window.getAllRawQA && window.saveSnapshot) {
    const rawQAs = await window.getAllRawQA();
    const coreText = rawQAs.map(q => q.text).join('\n');
    const snapshot = {
      version: Date.now(),
      content: coreText.slice(0, 200 * 1024),
      created_at: new Date().toISOString()
    };
    await window.saveSnapshot(snapshot);
    return snapshot;
  }
}

// 显示快照内容
async function showSnapshot() {
  if (window.getLatestSnapshot) {
    const snap = await window.getLatestSnapshot();
    document.getElementById('snapshot').textContent = snap ? snap.content.slice(0, 500) + (snap.content.length > 500 ? '\n...（已截断）' : '') : '暂无快照';
  }
}

// 生成快照按钮
const genBtn = document.getElementById('genSnapshotBtn');
genBtn.onclick = async () => {
  genBtn.disabled = true;
  await generateSnapshot();
  await showSnapshot();
  showToast('快照已生成');
  genBtn.disabled = false;
};

// 注入快照按钮
const injectBtn = document.getElementById('injectBtn');
injectBtn.onclick = async () => {
  if (window.getLatestSnapshot) {
    const snap = await window.getLatestSnapshot();
    if (snap) {
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'INJECT_SNAPSHOT', data: snap.content }, (resp) => {
          if (resp && resp.status === 'injected') {
            showToast('快照已注入');
          } else {
            showToast('注入失败，请检查目标页面');
          }
        });
      });
    }
  }
};

// 导出快照按钮
const exportSnapshotBtn = document.getElementById('exportSnapshotBtn');
exportSnapshotBtn.onclick = async () => {
  if (window.getLatestSnapshot) {
    const snap = await window.getLatestSnapshot();
    if (snap) {
      const content = JSON.stringify(snap, null, 2);
      saveToFile(`PersonaMirror_snapshot_${snap.version}.json`, content);
      showToast('快照已导出');
    } else {
      showToast('暂无快照可导出');
    }
  }
};

// 导出日志按钮
const exportLogBtn = document.getElementById('exportLogBtn');
exportLogBtn.onclick = async () => {
  if (window.getLatestSnapshot) {
    const snap = await window.getLatestSnapshot();
    if (snap) {
      const log = `[${snap.created_at}] 快照已生成，长度：${snap.content.length} 字符\n`;
      saveToFile(`PersonaMirror_log_${snap.version}.txt`, log);
      showToast('日志已导出');
    } else {
      showToast('暂无快照日志可导出');
    }
  }
};

// 初始显示快照
showSnapshot(); 