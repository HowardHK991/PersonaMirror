// PersonaMirror db.js
const DB_NAME = 'PersonaMirrorDB';
const DB_VERSION = 1;
const RAWQA_STORE = 'RawQA';
const DELTA_STORE = 'PersonaDelta';
const SNAPSHOT_STORE = 'Snapshot';

function openDB() {
  return new Promise((resolve, reject) => {
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
    request.onerror = () => reject(request.error);
  });
}

export async function addRawQA(qa) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RAWQA_STORE, 'readwrite');
    tx.objectStore(RAWQA_STORE).add(qa).onsuccess = resolve;
    tx.onerror = reject;
  });
}

export async function getRawQACount() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RAWQA_STORE, 'readonly');
    const req = tx.objectStore(RAWQA_STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
}

export async function getAllRawQA() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RAWQA_STORE, 'readonly');
    const req = tx.objectStore(RAWQA_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
}

export async function saveSnapshot(snapshot) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SNAPSHOT_STORE, 'readwrite');
    tx.objectStore(SNAPSHOT_STORE).put(snapshot).onsuccess = resolve;
    tx.onerror = reject;
  });
}

export async function getLatestSnapshot() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SNAPSHOT_STORE, 'readonly');
    const store = tx.objectStore(SNAPSHOT_STORE);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result;
      if (all.length === 0) return resolve(null);
      all.sort((a, b) => (b.version || 0) - (a.version || 0));
      resolve(all[0]);
    };
    req.onerror = reject;
  });
} 