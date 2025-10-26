# MCP Protocols & Tools

This branch contains Multi-Cloud Protocols (MCP) configurations, tools, and IDE integrations extracted from the PromptsGenie project.

## 📁 Directory Structure

```
├── .trae/                    # MCP Configuration Files
│   ├── mcp.json             # Main MCP configuration
│   ├── filesystem-config.json # Filesystem protocol config
│   ├── git-config.json      # Git protocol configuration
│   ├── memory-config.json   # Memory management config
│   ├── verify-mcp.js        # MCP verification script
│   ├── README.md            # Trae AI setup documentation
│   ├── github-setup.md      # GitHub integration guide
│   └── typescript-mcp-setup.md # TypeScript MCP setup
│
├── tools/                   # MCP Tools
│   └── vision-gemini.js     # Vision analysis tool using Gemini API
│
└── .ide-integrations/       # IDE Integration Files
    ├── README.md            # IDE integration documentation
    ├── vscode/              # VS Code integration
    │   ├── tasks.json       # VS Code tasks for MCP
    │   ├── install.sh       # Unix installation script
    │   └── install.bat      # Windows installation script
    ├── vim/                 # Vim integration
    │   └── autopilot.vim    # Vim plugin for MCP
    ├── emacs/               # Emacs integration
    │   └── autopilot.el     # Emacs package for MCP
    ├── webstorm/            # WebStorm integration
    │   └── tools.xml        # External tools configuration
    └── sublime/             # Sublime Text (coming soon)
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Git
- Your preferred IDE (VS Code, Vim, Emacs, WebStorm)

### Installation

1. **Clone this branch:**
   ```bash
   git clone -b mcps-protocol-update https://github.com/AIFUTURE10X/PromptsGenie.git mcp-tools
   cd mcp-tools
   ```

2. **Install dependencies:**
   ```bash
   npm install @google/generative-ai
   ```

3. **Set up environment variables:**
   ```bash
   # Create .env file
   echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
   ```

4. **Verify MCP setup:**
   ```bash
   node .trae/verify-mcp.js
   ```

## 🛠️ Available Tools

### Vision Gemini Tool
- **File**: `tools/vision-gemini.js`
- **Purpose**: Image analysis using Google's Gemini Vision API
- **Features**:
  - Image description and analysis
  - Text extraction (OCR)
  - Prompt generation from images

### MCP Verification
- **File**: `.trae/verify-mcp.js`
- **Purpose**: Validate MCP configuration and setup
- **Usage**: `node .trae/verify-mcp.js`

## 🔧 IDE Integration

### VS Code
```bash
# Run the installation script
.ide-integrations/vscode/install.bat  # Windows
# or
.ide-integrations/vscode/install.sh   # Unix/Linux/macOS
```

### Vim
Add to your `.vimrc`:
```vim
source /path/to/mcp-tools/.ide-integrations/vim/autopilot.vim
```

### Emacs
Add to your Emacs configuration:
```elisp
(load-file "/path/to/mcp-tools/.ide-integrations/emacs/autopilot.el")
```

### WebStorm
1. Go to File → Settings → Tools → External Tools
2. Import the configuration from `.ide-integrations/webstorm/tools.xml`

## 📋 Configuration Files

### MCP Configuration (`.trae/mcp.json`)
Main configuration file defining available tools and protocols.

### Filesystem Configuration (`.trae/filesystem-config.json`)
Defines filesystem access patterns and permissions.

### Git Configuration (`.trae/git-config.json`)
Git integration settings for MCP workflows.

### Memory Configuration (`.trae/memory-config.json`)
Memory management and caching settings.

## 🔍 Usage Examples

### Using Vision Tool
```javascript
const visionTool = require('./tools/vision-gemini.js');

// Analyze an image
const result = await visionTool.callTool('analyze_image', {
  imagePath: './path/to/image.jpg',
  prompt: 'Describe this image in detail'
});

// Extract text from image
const text = await visionTool.callTool('extract_text', {
  imagePath: './path/to/document.png'
});
```

### IDE Commands

#### VS Code
- `Ctrl+Shift+P` → "Tasks: Run Task" → Select MCP task

#### Vim
- `:MCPVerify` - Verify configuration
- `:MCPVision` - Start vision tool
- `:MCPStatus` - Check status

#### Emacs
- `C-c m v` - Verify configuration
- `C-c m g` - Start vision tool
- `C-c m s` - Check status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `node .trae/verify-mcp.js`
5. Submit a pull request

## 📄 License

This project is part of the PromptsGenie ecosystem. See the main repository for license information.

## 🔗 Related Links

- [Main PromptsGenie Repository](https://github.com/AIFUTURE10X/PromptsGenie)
- [Trae AI Documentation](https://docs.trae.ai)
- [MCP Protocol Specification](https://spec.modelcontextprotocol.io)

---

**Note**: This branch contains only the MCP-related components extracted from the main PromptsGenie project for easier integration and distribution.