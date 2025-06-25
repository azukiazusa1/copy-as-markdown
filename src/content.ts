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
    
    // Special handling for self-closing elements that don't have text content
    if (tagName === 'img') {
      const src = element.getAttribute('src');
      const alt = element.getAttribute('alt') || '';
      return src ? `![${alt}](${src})` : '';
    }
    
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

// Only add listener if not in test environment
if (typeof chrome !== 'undefined' && chrome.runtime) {
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
}

// In-source tests
if (import.meta.vitest) {
  const { describe, it, expect, beforeEach } = import.meta.vitest;

  describe('MarkdownConverter', () => {
    let converter: MarkdownConverter;

    beforeEach(() => {
      converter = new MarkdownConverter();
    });

    describe('convertElement', () => {
      it('should convert h1 elements', () => {
        const h1 = document.createElement('h1');
        h1.textContent = 'Main Title';
        const result = converter.convertElement(h1);
        expect(result).toBe('\n\n# Main Title\n\n');
      });

      it('should convert h2 elements', () => {
        const h2 = document.createElement('h2');
        h2.textContent = 'Subtitle';
        const result = converter.convertElement(h2);
        expect(result).toBe('\n\n## Subtitle\n\n');
      });

      it('should convert strong elements', () => {
        const strong = document.createElement('strong');
        strong.textContent = 'Bold text';
        const result = converter.convertElement(strong);
        expect(result).toBe('**Bold text**');
      });

      it('should convert em elements', () => {
        const em = document.createElement('em');
        em.textContent = 'Italic text';
        const result = converter.convertElement(em);
        expect(result).toBe('*Italic text*');
      });

      it('should convert code elements', () => {
        const code = document.createElement('code');
        code.textContent = 'console.log()';
        const result = converter.convertElement(code);
        expect(result).toBe('`console.log()`');
      });

      it('should convert a elements with href', () => {
        const a = document.createElement('a');
        a.textContent = 'Link text';
        a.setAttribute('href', 'https://example.com');
        const result = converter.convertElement(a);
        expect(result).toBe('[Link text](https://example.com)');
      });

      it('should convert a elements without href', () => {
        const a = document.createElement('a');
        a.textContent = 'Link text';
        const result = converter.convertElement(a);
        expect(result).toBe('Link text');
      });

      it('should convert img elements', () => {
        const img = document.createElement('img');
        img.setAttribute('src', 'image.png');
        img.setAttribute('alt', 'Alt text');
        // img elements don't have textContent, so we need to mock it or change the test
        const result = converter.convertElement(img);
        expect(result).toBe('![Alt text](image.png)');
      });

      it('should return empty string for elements without text', () => {
        const div = document.createElement('div');
        const result = converter.convertElement(div);
        expect(result).toBe('');
      });
    });

    describe('convertList', () => {
      it('should convert unordered lists', () => {
        const ul = document.createElement('ul');
        const li1 = document.createElement('li');
        li1.textContent = 'Item 1';
        const li2 = document.createElement('li');
        li2.textContent = 'Item 2';
        ul.appendChild(li1);
        ul.appendChild(li2);

        const result = converter.convertList(ul, '-');
        expect(result).toBe('- Item 1\n- Item 2');
      });

      it('should convert ordered lists', () => {
        const ol = document.createElement('ol');
        const li1 = document.createElement('li');
        li1.textContent = 'First item';
        const li2 = document.createElement('li');
        li2.textContent = 'Second item';
        ol.appendChild(li1);
        ol.appendChild(li2);

        const result = converter.convertList(ol, '1.');
        expect(result).toBe('1. First item\n2. Second item');
      });
    });

    describe('convertHtmlToMarkdown', () => {
      it('should return empty string for null element', () => {
        const result = converter.convertHtmlToMarkdown(null);
        expect(result).toBe('');
      });

      it('should convert mixed content', () => {
        const div = document.createElement('div');
        div.innerHTML = '<h1>Title</h1><p>Some <strong>bold</strong> text.</p>';
        
        const result = converter.convertHtmlToMarkdown(div);
        expect(result).toContain('# Title');
        expect(result).toContain('**bold**');
      });
    });
  });

  describe('extractArticleContent', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('should extract content from article element', () => {
      document.body.innerHTML = `
        <article>
          <h1>Article Title</h1>
          <p>Article content</p>
        </article>
      `;

      const result = extractArticleContent();
      expect(result).toContain('# Article Title');
      expect(result).toContain('Article content');
    });

    it('should fallback to main element', () => {
      document.body.innerHTML = `
        <main>
          <h1>Main Title</h1>
          <p>Main content</p>
        </main>
      `;

      const result = extractArticleContent();
      expect(result).toContain('# Main Title');
      expect(result).toContain('Main content');
    });

    it('should fallback to content selectors', () => {
      document.body.innerHTML = `
        <div class="content">
          <h1>Content Title</h1>
          <p>Content text</p>
        </div>
      `;

      const result = extractArticleContent();
      expect(result).toContain('# Content Title');
      expect(result).toContain('Content text');
    });

    it('should fallback to body element', () => {
      document.body.innerHTML = `
        <h1>Body Title</h1>
        <p>Body content</p>
      `;

      const result = extractArticleContent();
      expect(result).toContain('# Body Title');
      expect(result).toContain('Body content');
    });
  });
}