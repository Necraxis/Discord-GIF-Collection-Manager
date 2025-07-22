# 🎨 Discord GIF Collection Manager

> A powerful web-based tool for managing your Discord GIF collections. Download, organize, edit, and replace your favorite GIFs with an intuitive interface.

## 🚀 How to Use

### 🔐 Option 1: Token Login (Online)
1. Click **TOKEN LOGIN** on the main screen
2. Paste your Discord token when prompted
3. Choose your action:
   - **📥 GET CURRENT** - Download your existing collection
   - **🔄 REPLACE** - Replace your collection with a new one
   - **➕ COMBINE** - Add GIFs to your existing collection
   - **🗑️ CLEAR ALL** - Remove all GIFs from Discord

### 💻 Option 2: Local Edit (Offline)
1. Click **LOCAL EDIT** on the main screen
2. Import your collection:
   - **📋 Paste from clipboard** - Base64 or JSON format
   - **📁 Import from file** - `.bin (Base64)` or `.json` files
3. Edit and organize your GIFs
4. Export when finished

### ✨ Organizing Collections
- 🖱️ **Drag and drop** GIFs to reorder them
- ❌ **Remove** unwanted GIFs with the delete button
- 📤 **Export** your organized collection as JSON or Base64


## ⚙️ How the Data Processing Works

Discord stores GIF collections using **Protocol Buffers (protobuf)** for data encryption. Here's how this application handles the data:

### 📖 Data Reading Process
```
Base64 Input → Binary Conversion → Protobuf Decoding → JSON Conversion → Application Processing
```

1. **🔢 Base64 Input**: Discord's GIF data starts as Base64 encoded strings
2. **🔄 Binary Conversion**: The Base64 data is decoded into binary format
3. **🔓 Protobuf Decoding**: Custom processor using protobuf.js decodes the binary data
4. **📋 JSON Conversion**: The decoded protobuf data is transformed into readable JSON format
5. **⚡ Application Processing**: JSON data is processed for editing, reordering, adding/removing GIFs

### 📝 Data Writing Process (Reverse)
```
Application Processing → JSON to Protobuf → Binary Encoding → Base64 Encoding → Discord API
```

1. **📋 JSON to Protobuf**: Edited JSON data is encoded back into protobuf format
2. **🔄 Binary Encoding**: Protobuf data is converted to binary
3. **🔢 Base64 Encoding**: Binary data is encoded back to Base64 format
4. **🚀 Discord API Integration**: If logged in with token, the **"Replace Discord Collection Automatically"** feature sends the Base64 data via Discord's API to update your collection

> This approach ensures full compatibility with Discord's native data format while providing a user-friendly editing interface.


## 🔑 Getting Your Discord Token

> **Never share your Discord token with anyone.** Only use it with trusted applications. If you do share this with anyone, **reset it urgently** by changing your Discord password. If you don't trust this app, **reset your token after using it** by changing your password.

### 📋 Step-by-Step Instructions:

| Step | Action | Details |
|------|--------|---------|
| **1** | **🌐 Open Discord** | Go to [discord.com](https://discord.com) in your web browser and log in |
| **2** | **🛠️ Developer Tools** | Press `F12` or Right-click → `Inspect Element` |
| **3** | **📱 Console Tab** | Click on the `Console` tab in Developer Tools |
| **4** | **📝 Paste Code** | Copy and paste the code below, then press `Enter` |
| **5** | **📋 Copy Token** | Copy the token from the alert popup that appears |

```javascript
location.reload(),alert(JSON.parse(document.body.appendChild(document.createElement("iframe")).contentWindow.localStorage.token));
```

> 🔐 Your Discord token gives **FULL ACCESS** to your account. This tool processes it locally in your browser and never stores or transmits it anywhere else.

## 📄 File Formats

| Format | Description |
|--------|-------------|
| **📋 JSON** | Human-readable format for editing |
| **🔢 BIN (Base64)** | Compressed format for easy sharing and Discord API compatibility |

## 🔒 Security

- ✅ All processing happens in your browser
- ✅ No server-side storage or logging
- ✅ Discord tokens are only used for API requests


## 📋 Requirements

- 🌐 Modern web browser
- 👤 Discord account (for token login and online features)
- 🔑 Valid Discord token (for online features)

<div align="center">

<br></br>
<br></br>

**<span style="font-size: 40px;">Made with ❤️ by <a href="https://github.com/Necraxis/Discord-GIF-Collection-Manager">Necraxis</a></span>**

**<span style="font-size: 20px;">Give this repo a ⭐ if you like this project!</span>**

</div>