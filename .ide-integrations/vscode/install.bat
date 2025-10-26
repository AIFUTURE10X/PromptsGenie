@echo off
REM VS Code MCP Integration Installation Script for Windows
REM This script sets up MCP tools integration for VS Code

echo Installing MCP integration for VS Code...

REM Create .vscode directory if it doesn't exist
if not exist ".vscode" (
    mkdir .vscode
    echo Created .vscode directory
)

REM Copy tasks.json to .vscode directory
copy ".ide-integrations\vscode\tasks.json" ".vscode\tasks.json"
echo Copied tasks.json to .vscode directory

REM Install required dependencies
if exist "package.json" (
    echo Installing Node.js dependencies...
    npm install
) else (
    echo No package.json found. Creating basic package.json...
    (
        echo {
        echo   "name": "mcp-tools",
        echo   "version": "1.0.0",
        echo   "description": "MCP Tools Integration",
        echo   "main": "index.js",
        echo   "scripts": {
        echo     "verify-mcp": "node .trae/verify-mcp.js",
        echo     "start-vision": "node tools/vision-gemini.js"
        echo   },
        echo   "dependencies": {
        echo     "@google/generative-ai": "^0.1.3"
        echo   }
        echo }
    ) > package.json
    npm install
)

echo MCP integration for VS Code installed successfully!
echo You can now use Ctrl+Shift+P and search for 'Tasks: Run Task' to access MCP tools.
pause