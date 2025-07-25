// PersonaMirror content_script.js
(function() {
  console.log('PersonaMirror content script loaded');

  // 采集对话逻辑，使用MutationObserver提升性能
  function extractQA() {
    try {
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
    } catch (e) {
      console.error('PersonaMirror extractQA error:', e);
    }
  }

  // 使用MutationObserver监听对话区变化
  const chatContainer = document.querySelector('.chat-message')?.parentElement;
  if (chatContainer) {
    const observer = new MutationObserver(() => {
      extractQA();
    });
    observer.observe(chatContainer, { childList: true, subtree: true });
  } else {
    // 兜底：页面结构变化时重试
    setTimeout(() => location.reload(), 3000);
  }

  // 注入快照内容到输入框
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'INJECT_SNAPSHOT') {
      try {
        const input = document.querySelector('.chat-input, textarea, input[type="text"]');
        if (input) {
          input.value = message.data;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          sendResponse({ status: 'injected' });
        } else {
          sendResponse({ status: 'no_input' });
        }
      } catch (e) {
        console.error('PersonaMirror inject error:', e);
      }
    }
  });
})(); 