# Discord GIF Collection Manager

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/badge/Discord-7289DA?logo=discord&logoColor=white)](https://discord.com)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org)

> **A powerful, secure command-line tool for managing your Discord GIF collection with backup, restore, and sharing capabilities.**

## ✨ Features

### 🧹 **Collection Management**
- **Clear Collection**: Complete collection reset with confirmation
- **Replace Collection**: Swap your entire collection with new GIFs from Base64 codes
- **Combine Collection**: Add new GIFs to your existing collection (automatically includes current collection)

### 💾 **Backup & Export**
- **JSON Export**: Full metadata backup saved as `gif_collection_[date]_[timestamp].json`
- **Base64 Export**: Lightweight, shareable format saved as `gif_backup_[date]_[timestamp].txt`
- **Manual Backup**: Save before making changes (user initiated)

### 🔒 **Security**
- **100% Local Processing**: Your Discord token never leaves your device (Technically it does get sent to discord but... Yeah!)
- **Validation**: Input validation and error handling
- **No External Dependencies**: Runs entirely offline

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- Active Discord account (Who would've thought?)

### Installation
1. Clone or download the repository
2. Install dependencies:
```bash
npm install
```
3. Run the application:
```bash
node .
```

---

## 📖 Usage Guide

### Starting the Application
1. Run `node index.js`
2. Enter your Discord token when prompted (input is masked)
3. Select from the main menu options

### Main Menu Options

#### 🗑️ Clear Collection
- Completely removes all GIFs from your Discord favorites
- Includes confirmation prompt to prevent accidents

#### 🔄 Replace Collection
- **Step 1**: Select "Replace Collection" from main menu
- **Step 2**: Choose "Copy from clipboard" to add Base64 codes
- **Step 3**: Paste Base64 codes from clipboard (automatically detects and validates)
- **Step 4**: Select "Continue" to replace your collection
- **Warning**: Selecting no collections will clear your entire collection

#### ➕ Combine Collection
- **Step 1**: Select "Combine Collection" from main menu
- **Step 2**: Your current collection is automatically added to the combine list
- **Step 3**: Add additional Base64 codes via clipboard
- **Step 4**: Select "Continue" to merge collections
- **Result**: New GIFs are added to your existing collection

### Backup & Export Options

#### 📄 JSON Export (Developer Use)
- Saves complete collection with full metadata
- File format: `gif_collection_[date]_[timestamp].json`
- Includes version info, favorites array, and Discord metadata

#### 📝 Base64 Export (Sharing Use)
- Saves collection in shareable Base64 format
- File format: `gif_backup_[date]_[timestamp].txt`
- Perfect for sharing with friends or backing up

### Collection Management Interface

#### Interactive Table Display
When adding collections, you'll see:
- **Index**: Collection number
- **Token Preview**: First 15 characters of Base64 code
- **GIF Count**: Number of GIFs in each collection

#### Clipboard Integration
- Paste Base64 codes directly from clipboard
- Automatic validation and duplicate detection
- Invalid codes are rejected with error messages

---

## 🔧 Technical Details

### File Structure
```
├── Main.js           # Main application file (The terminal UI)
├── Handler.js        # Discord API operations
├── Processor.js      # Base64/JSON conversion
├── Sharing/          # Export directory
│   ├── gif_collection_*.json
│   └── gif_backup_*.txt
└── package.json      # Dependencies
```

### Data Flow
1. **Token Input**: Secure password-masked input
2. **API Communication**: Direct Discord API calls via Handler.js
3. **Data Processing**: Base64 ↔ JSON conversion via Processor.js
4. **Collection Operations**: Clear/Replace/Combine operations
5. **File Export**: JSON/Base64 saves to Sharing/ directory

### Discord API Integration
- Uses official Discord `/users/@me/settings` endpoint
- Maintains Discord's protobuf structure
- Preserves metadata and version information

---

## 🛡️ Security & Privacy

### Local-Only Processing
- Your token and data never leave your device
- No external API calls except to Discord
- All operations performed locally

### Token Security
- Input is masked with asterisks during entry
- Token validation before API calls
- No token storage or logging

### Best Practices
- **Never share your Discord token**
- **Back up before making changes**

---

## 🔐 Obtaining Your Discord Token

> ⚠️ **Important**: Never share your Discord token with anyone!

### Browser Console Method
1. Open Discord in your browser
2. Press `F12` → `Console` tab
3. Paste and run:
```javascript
location.reload(),alert(JSON.parse(document.body.appendChild(document.createElement("iframe")).contentWindow.localStorage.token));
```

### Security Notes
- Tokens expire periodically and need renewal
- Never paste your token in public channels
- Log out and back in to generate a new token
- Keep your token private and secure

---

## 📚 FAQ

**Q: Is this tool safe to use?**  
A: Yes! The tool runs entirely locally and uses official Discord APIs. Your token never leaves your device.

**Q: Can Discord detect this tool?**  
A: No. The tool uses the same API calls that Discord's client uses when you add or remove GIFs manually.

**Q: Will my Discord account be banned?**  
A: No. This tool doesn't violate Discord's Terms of Service as it only uses official API endpoints normally.

**Q: How do I share my GIF collection?**  
A: Use "Save Current Collection to Base64", then share the generated `.txt` file. Others can import it using "Replace Collection".

**Q: What happens if I accidentally delete my collection?**  
A: If you have a backup file, you can restore it using "Replace Collection". Always backup before making changes!

**Q: Why does the combine feature automatically add my current collection?**  
A: This ensures you don't lose your existing GIFs when combining. Your current collection is preserved and new ones are added.

**Q: What's the difference between JSON and Base64 export?**  
A: JSON includes full metadata for developers, while Base64 is a compressed format perfect for sharing and backups.

**Q: Can I run this on mobile?**  
A: This is a Node.js command-line application designed for desktop use. Mobile isn't supported.

---

## 🎥 Tutorial

[![Discord GIF Manager Tutorial](https://img.youtube.com/vi/aQJf9I9Wd6U/0.jpg)](https://youtu.be/aQJf9I9Wd6U)

Complete walkthrough of installation, setup, and all features.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Discord GIF Manager Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

### Made with ❤️ by Necraxis

**Star ⭐ this repository if you find it useful!**

</div>