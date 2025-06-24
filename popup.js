document.addEventListener('DOMContentLoaded', function() {
  const copyButton = document.getElementById('copyButton');
  const statusDiv = document.getElementById('status');
  
  function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${isError ? 'error' : 'success'}`;
    statusDiv.classList.remove('hidden');
    
    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, 3000);
  }
  
  function updateButtonState(isLoading = false) {
    const icon = copyButton.querySelector('.icon');
    const text = copyButton.querySelector('.text');
    
    if (isLoading) {
      copyButton.disabled = true;
      icon.textContent = '⏳';
      text.textContent = '処理中...';
    } else {
      copyButton.disabled = false;
      icon.textContent = '📋';
      text.textContent = '記事をコピー';
    }
  }
  
  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        return true;
      } catch (fallbackError) {
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }
  
  copyButton.addEventListener('click', async function() {
    updateButtonState(true);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await chrome.tabs.sendMessage(tab.id, { 
        action: 'extractContent' 
      });
      
      if (response.success) {
        const success = await copyToClipboard(response.content);
        
        if (success) {
          showStatus('マークダウンをクリップボードにコピーしました！');
          
          setTimeout(() => {
            window.close();
          }, 1500);
        } else {
          showStatus('クリップボードへのコピーに失敗しました', true);
        }
      } else {
        showStatus(`エラー: ${response.error}`, true);
      }
    } catch (error) {
      console.error('Copy failed:', error);
      showStatus('記事の抽出に失敗しました', true);
    } finally {
      updateButtonState(false);
    }
  });
});