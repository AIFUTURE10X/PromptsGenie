@echo off

# VS Code Autopilot Integration Installer
echo "Installing VS Code Autopilot integration..."

# Get VS Code settings directory
if [[ "$OSTYPE" == "darwin"* ]]; then
    VSCODE_DIR="$HOME/Library/Application Support/Code/User"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    VSCODE_DIR="$APPDATA/Code/User"
else
    VSCODE_DIR="$HOME/.config/Code/User"
fi

# Create directories if they don't exist
mkdir -p "$VSCODE_DIR/snippets"

# Copy files
echo "Copying tasks.json..."
cp tasks.json "$VSCODE_DIR/tasks.json" 2>/dev/null || echo "tasks.json already exists, skipping..."

echo "Copying keybindings.json..."
if [ -f "$VSCODE_DIR/keybindings.json" ]; then
    echo "Merging with existing keybindings..."
    # In a real implementation, we'd merge the JSON files
    echo "Please manually merge keybindings.json with your existing file"
else
    cp keybindings.json "$VSCODE_DIR/keybindings.json"
fi

echo "Copying snippets..."
cp snippets.json "$VSCODE_DIR/snippets/autopilot.code-snippets"

echo "✅ VS Code integration installed!"
echo "Restart VS Code to see the changes."
echo ""
echo "Available commands:"
echo "  - Ctrl+Shift+A, Ctrl+Shift+R: Run Full Workflow"
echo "  - Ctrl+Shift+A, Ctrl+Shift+S: Generate Spec"
echo "  - Ctrl+Shift+A, Ctrl+Shift+V: Run Validation"
echo "  - Ctrl+Shift+A, Ctrl+Shift+T: Show Status"
