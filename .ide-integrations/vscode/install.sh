#!/bin/bash

# VS Code MCP Integration Installation Script
# This script sets up MCP tools integration for VS Code

echo "Installing MCP integration for VS Code..."

# Create .vscode directory if it doesn't exist
if [ ! -d ".vscode" ]; then
    mkdir .vscode
    echo "Created .vscode directory"
fi

# Copy tasks.json to .vscode directory
cp .ide-integrations/vscode/tasks.json .vscode/tasks.json
echo "Copied tasks.json to .vscode directory"

# Install required dependencies
if [ -f "package.json" ]; then
    echo "Installing Node.js dependencies..."
    npm install
else
    echo "No package.json found. Creating basic package.json..."
    cat > package.json << EOF
{
  "name": "mcp-tools",
  "version": "1.0.0",
  "description": "MCP Tools Integration",
  "main": "index.js",
  "scripts": {
    "verify-mcp": "node .trae/verify-mcp.js",
    "start-vision": "node tools/vision-gemini.js"
  },
  "dependencies": {
    "@google/generative-ai": "^0.1.3"
  }
}
EOF
    npm install
fi

echo "MCP integration for VS Code installed successfully!"
echo "You can now use Ctrl+Shift+P and search for 'Tasks: Run Task' to access MCP tools."