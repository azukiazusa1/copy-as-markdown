# Copy as Markdown

A Chrome extension that extracts article content from web pages and copies it to the clipboard in Markdown format.

## Features

- **Smart Content Detection**: Automatically detects and extracts content from `<article>` tags, falling back to `<main>` tags or other content containers
- **Rich Markdown Conversion**: Converts HTML elements to proper Markdown syntax including:
  - Headings (H1-H6)
  - Bold and italic text
  - Links and images
  - Lists (ordered and unordered)
  - Code blocks and inline code
  - Blockquotes
- **One-Click Copy**: Simple popup interface with instant clipboard copying
- **Japanese UI**: User-friendly interface in Japanese
- **Fallback Support**: Works on pages without semantic HTML structure

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your Chrome toolbar

## Usage

1. Navigate to any web page with article content
2. Click the "Copy as Markdown" extension icon in the toolbar
3. Click the "記事をコピー" (Copy Article) button
4. The article content will be copied to your clipboard in Markdown format
5. Paste the content wherever you need it

## How It Works

The extension uses a content script to:

1. Search for content in this order of priority:
   - `<article>` tag
   - `<main>` tag
   - Elements with `role="main"`
   - Common content selectors (`.content`, `.article`, `.post`, etc.)
   - Falls back to `<body>` if no semantic containers are found

2. Convert HTML elements to Markdown using a custom converter that handles:
   - Semantic HTML structure
   - Nested elements
   - Text formatting
   - Links and media

3. Copy the converted Markdown to the clipboard using the Clipboard API

## File Structure

```
copy-as-markdown/
├── manifest.json          # Extension configuration (Manifest V3)
├── content.js            # Content script for HTML extraction and conversion
├── popup.html            # Extension popup interface
├── popup.js              # Popup logic and clipboard handling
├── styles.css            # Popup styling
└── README.md             # This file
```

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: 
  - `activeTab`: Access to current tab content
  - `clipboardWrite`: Write to clipboard
- **Content Scripts**: Runs on all URLs to enable content extraction
- **Popup**: Clean, responsive interface with status feedback

## Browser Compatibility

- Chrome 88+ (Manifest V3 support required)
- Other Chromium-based browsers with Manifest V3 support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the extension thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Troubleshooting

**Extension not working on some pages?**
- Some sites may have strict Content Security Policies
- Try refreshing the page after installing the extension

**Markdown formatting looks wrong?**
- The converter handles most common HTML structures
- Complex nested elements may need manual adjustment

**Copy button not responding?**
- Check that the extension has the required permissions
- Ensure the page has loaded completely before copying