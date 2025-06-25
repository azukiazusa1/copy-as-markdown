interface MessageResponse {
  success: boolean;
  content?: string;
  error?: string;
}

document.addEventListener("DOMContentLoaded", function (): void {
  const copyButton = document.getElementById("copyButton") as HTMLButtonElement;
  const statusDiv = document.getElementById("status") as HTMLDivElement;

  function showStatus(message: string, isError: boolean = false): void {
    statusDiv.textContent = message;
    statusDiv.className = `status ${isError ? "error" : "success"}`;
    statusDiv.classList.remove("hidden");

    function hideStatus(): void {
      statusDiv.classList.add("hidden");
    }
    setTimeout(hideStatus, 3000);
  }

  function updateButtonState(isLoading: boolean = false): void {
    const icon = copyButton.querySelector(".icon") as HTMLSpanElement;
    const text = copyButton.querySelector(".text") as HTMLSpanElement;

    if (isLoading) {
      copyButton.disabled = true;
      icon.textContent = "⏳";
      text.textContent = "処理中...";
    } else {
      copyButton.disabled = false;
      icon.textContent = "📋";
      text.textContent = "記事をコピー";
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