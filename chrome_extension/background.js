// PersonaMirror background.js
importScripts('db.js');

chrome.runtime.onInstalled.addListener(() => {
  console.log('PersonaMirror 插件已安装');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOG') {
    console.log('[PersonaMirror]', message.data);
  }
  if (message.type === 'NEW_QA') {
    // 存储每条QA
    message.data.forEach(qa => {
      addRawQA(qa);
    });
    console.log('[PersonaMirror] 已捕获新对话', message.data.length);
  }
  if (message.type === 'SYNC_GIT') {
    // 预留：同步到云端Git仓库
    // syncToGit(message.data)
    console.log('[PersonaMirror] 预留Git同步接口', message.data);
  }
  sendResponse({status: 'ok'});
});

// 预留Git同步伪函数
function syncToGit(data) {
  // TODO: 实现与云端Git仓库的同步逻辑
} 