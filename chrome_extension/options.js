// PersonaMirror options.js

document.addEventListener('DOMContentLoaded', () => {
  const autoInject = document.getElementById('autoInject');
  const saveBtn = document.getElementById('saveBtn');
  const saveStatus = document.getElementById('saveStatus');

  // 加载设置
  chrome.storage.sync.get(['autoInject'], (result) => {
    autoInject.checked = result.autoInject !== false;
  });

  // 保存设置
  saveBtn.onclick = () => {
    chrome.storage.sync.set({ autoInject: autoInject.checked }, () => {
      saveStatus.textContent = '设置已保存';
      setTimeout(() => { saveStatus.textContent = ''; }, 1500);
    });
  };
}); 