// PersonaMirror content_script.js
(function() {
  console.log('PersonaMirror content script loaded');

  // 监听KIMI/DeepSeek页面的对话（简化示例，后续可根据实际DOM结构完善）
  function extractQA() {
    // 假设页面有class为'chat-message'的元素，区分user/assistant
    const messages = Array.from(document.querySelectorAll('.chat-message'));
    const qaPairs = [];
    let lastUser = null;
    messages.forEach(msg => {
      const role = msg.classList.contains('user') ? 'user' : (msg.classList.contains('assistant') ? 'assistant' : 'unknown');
      const text = msg.innerText.trim();
      if (role === 'user') {
        lastUser = { ts: Date.now(), role, text };
      } else if (role === 'assistant' && lastUser) {
        qaPairs.push({
          ts: lastUser.ts,
          url: location.href,
          role: 'user',
          text: lastUser.text
        });
        qaPairs.push({
          ts: Date.now(),
          role: 'assistant',
          text
        });
        lastUser = null;
      }
    });
    if (qaPairs.length > 0) {
      chrome.runtime.sendMessage({ type: 'NEW_QA', data: qaPairs });
    }
  }

  // 定时扫描页面（可优化为事件驱动）
  setInterval(extractQA, 5000);

  // 注入快照内容到输入框
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'INJECT_SNAPSHOT') {
      // 简化：假设输入框有class为'chat-input'，实际需根据目标页面调整
      const input = document.querySelector('.chat-input, textarea, input[type="text"]');
      if (input) {
        input.value = message.data;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        sendResponse({ status: 'injected' });
      } else {
        sendResponse({ status: 'no_input' });
      }
    }
  });
})(); 