interface MessageResponse {
  success: boolean;
  content?: string;
  error?: string;
}

// Define functions at module level for testing
function showStatus(message: string, isError: boolean = false): void {
  const statusDiv = document.getElementById("status") as HTMLDivElement;
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${isError ? "error" : "success"}`;
    statusDiv.classList.remove("hidden");

    function hideStatus(): void {
      statusDiv.classList.add("hidden");
    }
    setTimeout(hideStatus, 3000);
  }
}

function updateButtonState(isLoading: boolean = false): void {
  const copyButton = document.getElementById("copyButton") as HTMLButtonElement;
  if (copyButton) {
    const icon = copyButton.querySelector(".icon") as HTMLSpanElement;
    const text = copyButton.querySelector(".text") as HTMLSpanElement;

    if (isLoading) {
      copyButton.disabled = true;
      if (icon) icon.textContent = "⏳";
      if (text) text.textContent = "処理中...";
    } else {
      copyButton.disabled = false;
      if (icon) icon.textContent = "📋";
      if (text) text.textContent = "記事をコピー";
    }
  }
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand("copy");
      return true;
    } catch (fallbackError) {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

document.addEventListener("DOMContentLoaded", function (): void {
  const copyButton = document.getElementById("copyButton") as HTMLButtonElement;
  if (!copyButton) return;

  copyButton.addEventListener("click", async function (): Promise<void> {
    updateButtonState(true);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.id) {
        throw new Error("タブIDが見つかりません");
      }

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["dist/content.js"],
      });

      const response: MessageResponse = await chrome.tabs.sendMessage(tab.id, {
        action: "extractContent",
      });

      if (response.success && response.content) {
        const success = await copyToClipboard(response.content);

        if (success) {
          showStatus("マークダウンをクリップボードにコピーしました！");

          function closeWindow(): void {
            window.close();
          }
          setTimeout(closeWindow, 1500);
        } else {
          showStatus("クリップボードへのコピーに失敗しました", true);
        }
      } else {
        showStatus(`エラー: ${response.error || "不明なエラー"}`, true);
      }
    } catch (error) {
      console.error("Error during content extraction:", error);
      const errorMessage = error instanceof Error ? error.message : "不明なエラーが発生しました";
      showStatus(errorMessage, true);
    } finally {
      updateButtonState(false);
    }
  });
});

// In-source tests
if (import.meta.vitest) {
  const { describe, it, expect, beforeEach, vi } = import.meta.vitest;

  // Mock Chrome APIs for testing
  global.chrome = {
    runtime: {
      onMessage: {
        addListener: vi.fn(),
      },
      sendMessage: vi.fn(),
    },
    tabs: {
      query: vi.fn(),
      sendMessage: vi.fn(),
    },
    scripting: {
      executeScript: vi.fn(),
    },
  } as any;

  // Mock navigator.clipboard
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn(),
    },
    writable: true,
  });

  // Mock document.execCommand
  document.execCommand = vi.fn();

  describe('Popup functionality', () => {
    let copyButton: HTMLButtonElement;
    let statusDiv: HTMLDivElement;

    beforeEach(() => {
      document.body.innerHTML = `
        <div class="container">
          <div class="content">
            <button id="copyButton" class="copy-btn">
              <span class="icon">📋</span>
              <span class="text">記事をコピー</span>
            </button>
            <div id="status" class="status hidden"></div>
          </div>
        </div>
      `;

      copyButton = document.getElementById("copyButton") as HTMLButtonElement;
      statusDiv = document.getElementById("status") as HTMLDivElement;

      // Reset mocks
      vi.clearAllMocks();
    });

    describe('copyToClipboard', () => {
      it('should copy text using navigator.clipboard.writeText', async () => {
        const mockWriteText = vi.fn().mockResolvedValue(undefined);
        navigator.clipboard.writeText = mockWriteText;

        const result = await copyToClipboard('test text');

        expect(mockWriteText).toHaveBeenCalledWith('test text');
        expect(result).toBe(true);
      });

      it('should fallback to document.execCommand when clipboard API fails', async () => {
        const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard not available'));
        const mockExecCommand = vi.fn().mockReturnValue(true);
        navigator.clipboard.writeText = mockWriteText;
        document.execCommand = mockExecCommand;

        const result = await copyToClipboard('test text');

        expect(mockWriteText).toHaveBeenCalledWith('test text');
        expect(mockExecCommand).toHaveBeenCalledWith('copy');
        expect(result).toBe(true);
      });

      it('should return false when both methods fail', async () => {
        const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard not available'));
        const mockExecCommand = vi.fn().mockImplementation(() => {
          throw new Error('execCommand failed');
        });
        navigator.clipboard.writeText = mockWriteText;
        document.execCommand = mockExecCommand;

        const result = await copyToClipboard('test text');

        expect(result).toBe(false);
      });
    });

    describe('showStatus', () => {
      it('should show success status', () => {
        showStatus('Success message', false);

        expect(statusDiv.textContent).toBe('Success message');
        expect(statusDiv.className).toBe('status success');
        expect(statusDiv.classList.contains('hidden')).toBe(false);
      });

      it('should show error status', () => {
        showStatus('Error message', true);

        expect(statusDiv.textContent).toBe('Error message');
        expect(statusDiv.className).toBe('status error');
        expect(statusDiv.classList.contains('hidden')).toBe(false);
      });
    });

    describe('updateButtonState', () => {
      it('should set loading state', () => {
        updateButtonState(true);

        expect(copyButton.disabled).toBe(true);
        
        const icon = copyButton.querySelector('.icon');
        const text = copyButton.querySelector('.text');
        
        expect(icon?.textContent).toBe('⏳');
        expect(text?.textContent).toBe('処理中...');
      });

      it('should set normal state', () => {
        updateButtonState(false);

        expect(copyButton.disabled).toBe(false);
        
        const icon = copyButton.querySelector('.icon');
        const text = copyButton.querySelector('.text');
        
        expect(icon?.textContent).toBe('📋');
        expect(text?.textContent).toBe('記事をコピー');
      });
    });

    describe('DOM elements', () => {
      it('should find copy button element', () => {
        expect(copyButton).toBeTruthy();
        expect(copyButton.id).toBe('copyButton');
      });

      it('should find status div element', () => {
        expect(statusDiv).toBeTruthy();
        expect(statusDiv.id).toBe('status');
      });

      it('should have correct initial button structure', () => {
        const icon = copyButton.querySelector('.icon');
        const text = copyButton.querySelector('.text');

        expect(icon).toBeTruthy();
        expect(text).toBeTruthy();
        expect(icon?.textContent).toBe('📋');
        expect(text?.textContent).toBe('記事をコピー');
      });
    });
  });
}