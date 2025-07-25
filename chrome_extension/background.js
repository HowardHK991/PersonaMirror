// PersonaMirror background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('PersonaMirror 插件已安装');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'LOG') {
    console.log('[PersonaMirror]', message.data);
  }
  // 其他消息处理逻辑可在此扩展
  sendResponse({status: 'ok'});
}); 