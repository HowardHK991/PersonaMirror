
// PersonaMirror db.js
// 本地数据库配置
const DB_NAME = 'PersonaMirrorDB';
const DB_VERSION = 1;
const RAWQA_STORE = 'RawQA';
const DELTA_STORE = 'PersonaDelta';
const SNAPSHOT_STORE = 'Snapshot';

// Toast 统一提示（需在 sidepanel.js 注入 window.showToast）
function showToast(msg) {
  if (typeof window.showToast === 'function') {
    window.showToast(msg);
  } else {
    // fallback
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'SHOW_TOAST', data: msg });
    } else {
      console.log('[PersonaMirror]', msg);
    }
  }
}

// 打开数据库，自动升级
function openDB() {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(RAWQA_STORE)) {
          db.createObjectStore(RAWQA_STORE, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(DELTA_STORE)) {
          db.createObjectStore(DELTA_STORE, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
          db.createObjectStore(SNAPSHOT_STORE, { keyPath: 'version' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        showToast('数据库打开失败');
        reject(request.error);
      };
    } catch (e) {
      showToast('数据库异常：' + e.message);
      reject(e);
    }
  });
}

// 新增一条原始对话，qa需为对象
async function addRawQA(qa) {
  if (!qa || typeof qa !== 'object') {
    showToast('对话数据格式错误');
    return Promise.reject('数据格式错误');
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RAWQA_STORE, 'readwrite');
    tx.objectStore(RAWQA_STORE).add(qa).onsuccess = resolve;
    tx.onerror = (e) => {
      showToast('对话保存失败：' + e.target.error);
      reject(e);
    };
  });
}

// 获取原始对话条数
async function getRawQACount() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RAWQA_STORE, 'readonly');
    const req = tx.objectStore(RAWQA_STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => {
      showToast('获取对话条数失败');
      reject(e);
    };
  });
}

// 获取全部原始对话
async function getAllRawQA() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RAWQA_STORE, 'readonly');
    const req = tx.objectStore(RAWQA_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => {
      showToast('获取全部对话失败');
      reject(e);
    };
  });
}

// 保存快照，内容结构化为JSON
async function saveSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || !snapshot.content || !snapshot.version) {
    showToast('快照内容为空，未保存！');
    return Promise.reject('快照内容为空');
  }
  // content 支持对象或字符串
  if (typeof snapshot.content !== 'string') {
    try {
      snapshot.content = JSON.stringify(snapshot.content);
    } catch (e) {
      showToast('快照内容序列化失败');
      return Promise.reject('快照内容序列化失败');
    }
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SNAPSHOT_STORE, 'readwrite');
    tx.objectStore(SNAPSHOT_STORE).put(snapshot).onsuccess = resolve;
    tx.onerror = (e) => {
      showToast('快照保存失败：' + e.target.error);
      reject(e);
    };
  });
}

// 获取最新快照
async function getLatestSnapshot() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SNAPSHOT_STORE, 'readonly');
    const store = tx.objectStore(SNAPSHOT_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result;
      if (!all || all.length === 0) {
        showToast('未找到任何快照，请先生成快照！');
        return resolve(null);
      }
      all.sort((a, b) => (b.version || 0) - (a.version || 0));
      resolve(all[0]);
    };
    req.onerror = (e) => {
      showToast('快照读取失败：' + e.target.error);
      reject(e);
    };
  });
}

// 导出全部快照
async function exportAllSnapshots() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SNAPSHOT_STORE, 'readonly');
    const store = tx.objectStore(SNAPSHOT_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => {
      showToast('导出全部快照失败');
      reject(e);
    };
  });
}

// 导出全部原始对话
async function exportAllRawQA() {
  return getAllRawQA();
}

// 挂载到window，兼容content_script和sidepanel直接调用
window.addRawQA = addRawQA;
window.getRawQACount = getRawQACount;
window.getAllRawQA = getAllRawQA;
window.saveSnapshot = saveSnapshot;
window.getLatestSnapshot = getLatestSnapshot;
window.exportAllSnapshots = exportAllSnapshots;
window.exportAllRawQA = exportAllRawQA;