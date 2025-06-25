interface MessageRequest {
  action: string;
}

interface MessageResponse {
  success: boolean;
  content?: string;
  error?: string;
}

class MarkdownConverter {
  convertHtmlToMarkdown(element: Element | null): string {
    if (!element) return '';
    
    let markdown = '';
    
    for (const node of Array.from(element.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        markdown += (node.textContent || '').trim();
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        markdown += this.convertElement(node as Element);
      }
    }
    
    return markdown.replace(/\n{3,}/g, '\n\n').trim();
  }
  
  convertElement(element: Element): string {
    const tagName = element.tagName.toLowerCase();
    const text = (element.textContent || '').trim();
    
    if (!text) return '';
    
    switch (tagName) {
      case 'h1':
        return `\n\n# ${text}\n\n`;
      case 'h2':
        return `\n\n## ${text}\n\n`;
      case 'h3':
        return `\n\n### ${text}\n\n`;
      case 'h4':
        return `\n\n#### ${text}\n\n`;
      case 'h5':
        return `\n\n##### ${text}\n\n`;
      case 'h6':
        return `\n\n###### ${text}\n\n`;
      case 'p':
        return `\n\n${this.convertHtmlToMarkdown(element)}\n\n`;
      case 'br':
        return '\n';
      case 'strong':
      case 'b':
        return `**${text}**`;
      case 'em':
      case 'i':
        return `*${text}*`;
      case 'code':
        return `\`${text}\``;
      case 'pre':
        const codeContent = element.querySelector('code');
        return `\n\n\`\`\`\n${codeContent ? codeContent.textContent : text}\n\`\`\`\n\n`;
      case 'blockquote':
        return `\n\n> ${this.convertHtmlToMarkdown(element).replace(/\n/g, '\n> ')}\n\n`;
      case 'a':
        const href = element.getAttribute('href');
        return href ? `[${text}](${href})` : text;
      case 'img':
        const src = element.getAttribute('src');
        const alt = element.getAttribute('alt') || '';
        return src ? `![${alt}](${src})` : '';
      case 'ul':
        return `\n\n${this.convertList(element, '-')}\n\n`;
      case 'ol':
        return `\n\n${this.convertList(element, '1.')}\n\n`;
      case 'li':
        return this.convertHtmlToMarkdown(element);
      default:
        return this.convertHtmlToMarkdown(element);
    }
  }
  
  convertList(listElement: Element, marker: string): string {
    const items = Array.from(listElement.querySelectorAll('li'));
    return items.map((item, index) => {
      const listMarker = marker === '1.' ? `${index + 1}.` : marker;
      const content = this.convertHtmlToMarkdown(item);
      return `${listMarker} ${content}`;
    }).join('\n');
  }
}

function extractArticleContent(): string {
  let articleElement: Element | null = document.querySelector('article');
  
  if (!articleElement) {
    articleElement = document.querySelector('main');
  }
  
  if (!articleElement) {
    const contentSelectors = [
      '[role="main"]',
      '.content',
      '.article',
      '.post',
      '#content',
      '#main'
    ];
    
    for (const selector of contentSelectors) {
      articleElement = document.querySelector(selector);
      if (articleElement) break;
    }
  }
  
  if (!articleElement) {
    articleElement = document.body;
  }
  
  const converter = new MarkdownConverter();
  return converter.convertHtmlToMarkdown(articleElement);
}

chrome.runtime.onMessage.addListener((
  request: MessageRequest,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: MessageResponse) => void
): void => {
  if (request.action === 'extractContent') {
    try {
      const markdown = extractArticleContent();
      sendResponse({ success: true, content: markdown });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      sendResponse({ success: false, error: errorMessage });
    }
  }
});