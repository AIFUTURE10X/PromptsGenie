#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * IDE Integration Manager
 * Creates integration files for popular IDEs and editors
 */
class IDEIntegration {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.ideDir = path.join(this.projectRoot, '.ide-integrations');
  }

  /**
   * Generate all IDE integrations
   */
  async generateAll() {
    console.log(chalk.blue.bold('🔧 Generating IDE Integrations'));
    console.log(chalk.gray('================================\n'));

    await fs.mkdir(this.ideDir, { recursive: true });

    const integrations = [
      { name: 'VS Code', generator: this.generateVSCodeIntegration.bind(this) },
      { name: 'WebStorm/IntelliJ', generator: this.generateWebStormIntegration.bind(this) },
      { name: 'Vim/Neovim', generator: this.generateVimIntegration.bind(this) },
      { name: 'Emacs', generator: this.generateEmacsIntegration.bind(this) },
      { name: 'Sublime Text', generator: this.generateSublimeIntegration.bind(this) }
    ];

    for (const integration of integrations) {
      try {
        console.log(chalk.cyan(`📝 Generating ${integration.name} integration...`));
        await integration.generator();
        console.log(chalk.green(`✅ ${integration.name} integration created`));
      } catch (error) {
        console.log(chalk.red(`❌ ${integration.name} integration failed: ${error.message}`));
      }
    }

    await this.generateInstallationGuide();
    console.log(chalk.green.bold('\n🎉 All IDE integrations generated!'));
    console.log(chalk.cyan(`📁 Files saved to: ${this.ideDir}`));
  }

  /**
   * Generate VS Code integration
   */
  async generateVSCodeIntegration() {
    const vscodeDir = path.join(this.ideDir, 'vscode');
    await fs.mkdir(vscodeDir, { recursive: true });

    // VS Code tasks
    const tasks = {
      version: '2.0.0',
      tasks: [
        {
          label: 'Autopilot: Run Full Workflow',
          type: 'shell',
          command: 'node',
          args: ['scripts/autopilot-cli.mjs', 'run', '--interactive'],
          group: 'build',
          presentation: {
            echo: true,
            reveal: 'always',
            focus: false,
            panel: 'new'
          },
          problemMatcher: []
        },
        {
          label: 'Autopilot: Generate Spec',
          type: 'shell',
          command: 'node',
          args: ['scripts/autopilot-cli.mjs', 'spec', '--feature', '${input:featureDescription}'],
          group: 'build',
          presentation: {
            echo: true,
            reveal: 'always',
            focus: false,
            panel: 'new'
          },
          problemMatcher: []
        },
        {
          label: 'Autopilot: Run Validation',
          type: 'shell',
          command: 'node',
          args: ['scripts/autopilot-cli.mjs', 'validate'],
          group: 'test',
          presentation: {
            echo: true,
            reveal: 'always',
            focus: false,
            panel: 'new'
          },
          problemMatcher: []
        },
        {
          label: 'Autopilot: Show Status',
          type: 'shell',
          command: 'node',
          args: ['scripts/autopilot-cli.mjs', 'status'],
          group: 'build',
          presentation: {
            echo: true,
            reveal: 'always',
            focus: false,
            panel: 'new'
          },
          problemMatcher: []
        }
      ],
      inputs: [
        {
          id: 'featureDescription',
          description: 'Feature Description',
          default: 'Add new feature',
          type: 'promptString'
        }
      ]
    };

    await fs.writeFile(
      path.join(vscodeDir, 'tasks.json'),
      JSON.stringify(tasks, null, 2)
    );

    // VS Code commands
    const commands = [
      {
        command: 'autopilot.runWorkflow',
        title: 'Run Autopilot Workflow',
        category: 'Autopilot'
      },
      {
        command: 'autopilot.generateSpec',
        title: 'Generate Specification',
        category: 'Autopilot'
      },
      {
        command: 'autopilot.runValidation',
        title: 'Run Validation',
        category: 'Autopilot'
      },
      {
        command: 'autopilot.showStatus',
        title: 'Show Status',
        category: 'Autopilot'
      }
    ];

    // VS Code keybindings
    const keybindings = [
      {
        key: 'ctrl+shift+a ctrl+shift+r',
        command: 'workbench.action.tasks.runTask',
        args: 'Autopilot: Run Full Workflow'
      },
      {
        key: 'ctrl+shift+a ctrl+shift+s',
        command: 'workbench.action.tasks.runTask',
        args: 'Autopilot: Generate Spec'
      },
      {
        key: 'ctrl+shift+a ctrl+shift+v',
        command: 'workbench.action.tasks.runTask',
        args: 'Autopilot: Run Validation'
      },
      {
        key: 'ctrl+shift+a ctrl+shift+t',
        command: 'workbench.action.tasks.runTask',
        args: 'Autopilot: Show Status'
      }
    ];

    await fs.writeFile(
      path.join(vscodeDir, 'keybindings.json'),
      JSON.stringify(keybindings, null, 2)
    );

    // VS Code snippets
    const snippets = {
      'Autopilot Feature Request': {
        prefix: 'autopilot-feature',
        body: [
          '/**',
          ' * Feature Request for Spec-to-Code Autopilot',
          ' * ',
          ' * Title: ${1:Feature Title}',
          ' * Type: ${2|feature,bugfix,refactor,api|}',
          ' * Priority: ${3|low,medium,high|}',
          ' * ',
          ' * Description:',
          ' * ${4:Detailed description of the feature}',
          ' * ',
          ' * Acceptance Criteria:',
          ' * - ${5:Given/When/Then criteria}',
          ' * - ${6:Additional criteria}',
          ' * ',
          ' * Requirements:',
          ' * - ${7:Functional requirements}',
          ' * - ${8:Non-functional requirements}',
          ' */',
          '$0'
        ],
        description: 'Template for autopilot feature requests'
      },
      'Autopilot CLI Command': {
        prefix: 'autopilot-cli',
        body: [
          'node scripts/autopilot-cli.mjs ${1|run,spec,plan,code,validate,pr,status|} ${2:--options}$0'
        ],
        description: 'Autopilot CLI command template'
      }
    };

    await fs.writeFile(
      path.join(vscodeDir, 'snippets.json'),
      JSON.stringify(snippets, null, 2)
    );

    // Installation script for VS Code
    const installScript = `#!/bin/bash

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
`;

    await fs.writeFile(path.join(vscodeDir, 'install.sh'), installScript);
    await fs.writeFile(path.join(vscodeDir, 'install.bat'), installScript.replace(/^#!\/bin\/bash/, '@echo off'));
  }

  /**
   * Generate WebStorm/IntelliJ integration
   */
  async generateWebStormIntegration() {
    const webstormDir = path.join(this.ideDir, 'webstorm');
    await fs.mkdir(webstormDir, { recursive: true });

    // External Tools configuration
    const externalTools = `
<application>
  <component name="ToolsProvider">
    <tools>
      <tool name="Autopilot: Run Workflow" description="Run complete Spec-to-Code workflow" showInMainMenu="true" showInEditor="true" showInProject="true" showInSearchPopup="true" disabled="false" useConsole="true" showConsoleOnStdOut="true" showConsoleOnStdErr="true" synchronizeAfterRun="true">
        <exec>
          <option name="COMMAND" value="node" />
          <option name="PARAMETERS" value="scripts/autopilot-cli.mjs run --interactive" />
          <option name="WORKING_DIRECTORY" value="$ProjectFileDir$" />
        </exec>
      </tool>
      <tool name="Autopilot: Generate Spec" description="Generate specification only" showInMainMenu="true" showInEditor="true" showInProject="true" showInSearchPopup="true" disabled="false" useConsole="true" showConsoleOnStdOut="true" showConsoleOnStdErr="true" synchronizeAfterRun="true">
        <exec>
          <option name="COMMAND" value="node" />
          <option name="PARAMETERS" value="scripts/autopilot-cli.mjs spec --feature '$Prompt$'" />
          <option name="WORKING_DIRECTORY" value="$ProjectFileDir$" />
        </exec>
      </tool>
      <tool name="Autopilot: Run Validation" description="Run validation pipeline" showInMainMenu="true" showInEditor="true" showInProject="true" showInSearchPopup="true" disabled="false" useConsole="true" showConsoleOnStdOut="true" showConsoleOnStdErr="true" synchronizeAfterRun="true">
        <exec>
          <option name="COMMAND" value="node" />
          <option name="PARAMETERS" value="scripts/autopilot-cli.mjs validate" />
          <option name="WORKING_DIRECTORY" value="$ProjectFileDir$" />
        </exec>
      </tool>
      <tool name="Autopilot: Show Status" description="Show autopilot status" showInMainMenu="true" showInEditor="true" showInProject="true" showInSearchPopup="true" disabled="false" useConsole="true" showConsoleOnStdOut="true" showConsoleOnStdErr="true" synchronizeAfterRun="true">
        <exec>
          <option name="COMMAND" value="node" />
          <option name="PARAMETERS" value="scripts/autopilot-cli.mjs status" />
          <option name="WORKING_DIRECTORY" value="$ProjectFileDir$" />
        </exec>
      </tool>
    </tools>
  </component>
</application>
`;

    await fs.writeFile(path.join(webstormDir, 'tools.xml'), externalTools);

    // Live Templates
    const liveTemplates = `
<templateSet group="Autopilot">
  <template name="autopilot-feature" value="/**&#10; * Feature Request for Spec-to-Code Autopilot&#10; * &#10; * Title: $TITLE$&#10; * Type: $TYPE$&#10; * Priority: $PRIORITY$&#10; * &#10; * Description:&#10; * $DESCRIPTION$&#10; * &#10; * Acceptance Criteria:&#10; * - $CRITERIA1$&#10; * - $CRITERIA2$&#10; * &#10; * Requirements:&#10; * - $REQ1$&#10; * - $REQ2$&#10; */" description="Autopilot feature request template" toReformat="false" toShortenFQNames="true">
    <variable name="TITLE" expression="" defaultValue="&quot;Feature Title&quot;" alwaysStopAt="true" />
    <variable name="TYPE" expression="" defaultValue="&quot;feature&quot;" alwaysStopAt="true" />
    <variable name="PRIORITY" expression="" defaultValue="&quot;medium&quot;" alwaysStopAt="true" />
    <variable name="DESCRIPTION" expression="" defaultValue="&quot;Detailed description&quot;" alwaysStopAt="true" />
    <variable name="CRITERIA1" expression="" defaultValue="&quot;Given/When/Then criteria&quot;" alwaysStopAt="true" />
    <variable name="CRITERIA2" expression="" defaultValue="&quot;Additional criteria&quot;" alwaysStopAt="true" />
    <variable name="REQ1" expression="" defaultValue="&quot;Functional requirement&quot;" alwaysStopAt="true" />
    <variable name="REQ2" expression="" defaultValue="&quot;Non-functional requirement&quot;" alwaysStopAt="true" />
    <context>
      <option name="JAVA_SCRIPT" value="true" />
      <option name="TypeScript" value="true" />
    </context>
  </template>
</templateSet>
`;

    await fs.writeFile(path.join(webstormDir, 'live-templates.xml'), liveTemplates);
  }

  /**
   * Generate Vim/Neovim integration
   */
  async generateVimIntegration() {
    const vimDir = path.join(this.ideDir, 'vim');
    await fs.mkdir(vimDir, { recursive: true });

    const vimScript = `
" Spec-to-Code Autopilot Integration for Vim/Neovim
" Add this to your .vimrc or init.vim

" Autopilot commands
command! -nargs=? AutopilotRun :call AutopilotRunWorkflow(<q-args>)
command! -nargs=1 AutopilotSpec :call AutopilotGenerateSpec(<q-args>)
command! AutopilotValidate :call AutopilotRunValidation()
command! AutopilotStatus :call AutopilotShowStatus()

" Autopilot functions
function! AutopilotRunWorkflow(args)
    let cmd = 'node scripts/autopilot-cli.mjs run'
    if a:args != ''
        let cmd .= ' --feature "' . a:args . '"'
    else
        let cmd .= ' --interactive'
    endif
    execute '!' . cmd
endfunction

function! AutopilotGenerateSpec(feature)
    let cmd = 'node scripts/autopilot-cli.mjs spec --feature "' . a:feature . '"'
    execute '!' . cmd
endfunction

function! AutopilotRunValidation()
    execute '!node scripts/autopilot-cli.mjs validate'
endfunction

function! AutopilotShowStatus()
    execute '!node scripts/autopilot-cli.mjs status'
endfunction

" Key mappings
nnoremap <leader>ar :AutopilotRun<CR>
nnoremap <leader>as :AutopilotSpec 
nnoremap <leader>av :AutopilotValidate<CR>
nnoremap <leader>at :AutopilotStatus<CR>

" Snippets (for UltiSnips)
" Create ~/.vim/UltiSnips/javascript.snippets or ~/.config/nvim/UltiSnips/javascript.snippets
" and add the following:

snippet autopilot-feature "Autopilot feature request template"
/**
 * Feature Request for Spec-to-Code Autopilot
 * 
 * Title: \${1:Feature Title}
 * Type: \${2:feature}
 * Priority: \${3:medium}
 * 
 * Description:
 * \${4:Detailed description of the feature}
 * 
 * Acceptance Criteria:
 * - \${5:Given/When/Then criteria}
 * - \${6:Additional criteria}
 * 
 * Requirements:
 * - \${7:Functional requirements}
 * - \${8:Non-functional requirements}
 */
\$0
endsnippet

echo "Autopilot integration loaded!"
echo "Commands: :AutopilotRun, :AutopilotSpec, :AutopilotValidate, :AutopilotStatus"
echo "Mappings: <leader>ar, <leader>as, <leader>av, <leader>at"
`;

    await fs.writeFile(path.join(vimDir, 'autopilot.vim'), vimScript);
  }

  /**
   * Generate Emacs integration
   */
  async generateEmacsIntegration() {
    const emacsDir = path.join(this.ideDir, 'emacs');
    await fs.mkdir(emacsDir, { recursive: true });

    const emacsLisp = `
;;; autopilot.el --- Spec-to-Code Autopilot integration for Emacs

;;; Commentary:
;; This package provides integration with the Spec-to-Code Autopilot system.
;; Add (require 'autopilot) to your init.el to use.

;;; Code:

(defgroup autopilot nil
  "Spec-to-Code Autopilot integration."
  :group 'tools)

(defcustom autopilot-script-path "scripts/autopilot-cli.mjs"
  "Path to the autopilot CLI script."
  :type 'string
  :group 'autopilot)

(defun autopilot-run-workflow (&optional feature)
  "Run the complete autopilot workflow.
If FEATURE is provided, use it as the feature description."
  (interactive "sFeature description (optional): ")
  (let ((cmd (concat "node " autopilot-script-path " run")))
    (if (and feature (not (string-empty-p feature)))
        (setq cmd (concat cmd " --feature \"" feature "\""))
      (setq cmd (concat cmd " --interactive")))
    (async-shell-command cmd "*Autopilot*")))

(defun autopilot-generate-spec (feature)
  "Generate specification for FEATURE."
  (interactive "sFeature description: ")
  (let ((cmd (concat "node " autopilot-script-path " spec --feature \"" feature "\"")))
    (async-shell-command cmd "*Autopilot Spec*")))

(defun autopilot-run-validation ()
  "Run the validation pipeline."
  (interactive)
  (let ((cmd (concat "node " autopilot-script-path " validate")))
    (async-shell-command cmd "*Autopilot Validation*")))

(defun autopilot-show-status ()
  "Show autopilot status."
  (interactive)
  (let ((cmd (concat "node " autopilot-script-path " status")))
    (async-shell-command cmd "*Autopilot Status*")))

;; Key bindings
(define-prefix-command 'autopilot-map)
(global-set-key (kbd "C-c a") 'autopilot-map)
(define-key autopilot-map (kbd "r") 'autopilot-run-workflow)
(define-key autopilot-map (kbd "s") 'autopilot-generate-spec)
(define-key autopilot-map (kbd "v") 'autopilot-run-validation)
(define-key autopilot-map (kbd "t") 'autopilot-show-status)

;; Menu
(define-key-after global-map [menu-bar tools autopilot]
  (cons "Autopilot" (make-sparse-keymap "Autopilot"))
  'tools)

(define-key global-map [menu-bar tools autopilot run]
  '("Run Workflow" . autopilot-run-workflow))
(define-key global-map [menu-bar tools autopilot spec]
  '("Generate Spec" . autopilot-generate-spec))
(define-key global-map [menu-bar tools autopilot validate]
  '("Run Validation" . autopilot-run-validation))
(define-key global-map [menu-bar tools autopilot status]
  '("Show Status" . autopilot-show-status))

;; Snippets (for yasnippet)
(defun autopilot-setup-snippets ()
  "Set up autopilot snippets."
  (when (featurep 'yasnippet)
    (yas-define-snippets
     'js-mode
     '(("autopilot-feature" "/**
 * Feature Request for Spec-to-Code Autopilot
 * 
 * Title: \${1:Feature Title}
 * Type: \${2:feature}
 * Priority: \${3:medium}
 * 
 * Description:
 * \${4:Detailed description of the feature}
 * 
 * Acceptance Criteria:
 * - \${5:Given/When/Then criteria}
 * - \${6:Additional criteria}
 * 
 * Requirements:
 * - \${7:Functional requirements}
 * - \${8:Non-functional requirements}
 */" "Autopilot feature request template")))))

(add-hook 'js-mode-hook 'autopilot-setup-snippets)
(add-hook 'typescript-mode-hook 'autopilot-setup-snippets)

(provide 'autopilot)

;;; autopilot.el ends here
`;

    await fs.writeFile(path.join(emacsDir, 'autopilot.el'), emacsLisp);
  }

  /**
   * Generate Sublime Text integration
   */
  async generateSublimeIntegration() {
    const sublimeDir = path.join(this.ideDir, 'sublime');
    await fs.mkdir(sublimeDir, { recursive: true });

    // Sublime Text commands
    const commands = [
      {
        caption: 'Autopilot: Run Workflow',
        command: 'exec',
        args: {
          cmd: ['node', 'scripts/autopilot-cli.mjs', 'run', '--interactive'],
          working_dir: '$project_path'
        }
      },
      {
        caption: 'Autopilot: Generate Spec',
        command: 'exec',
        args: {
          cmd: ['node', 'scripts/autopilot-cli.mjs', 'spec', '--feature', '$selection'],
          working_dir: '$project_path'
        }
      },
      {
        caption: 'Autopilot: Run Validation',
        command: 'exec',
        args: {
          cmd: ['node', 'scripts/autopilot-cli.mjs', 'validate'],
          working_dir: '$project_path'
        }
      },
      {
        caption: 'Autopilot: Show Status',
        command: 'exec',
        args: {
          cmd: ['node', 'scripts/autopilot-cli.mjs', 'status'],
          working_dir: '$project_path'
        }
      }
    ];

    await fs.writeFile(
      path.join(sublimeDir, 'Commands.sublime-commands'),
      JSON.stringify(commands, null, 2)
    );

    // Sublime Text key bindings
    const keyBindings = [
      {
        keys: ['ctrl+shift+a', 'ctrl+shift+r'],
        command: 'exec',
        args: {
          cmd: ['node', 'scripts/autopilot-cli.mjs', 'run', '--interactive'],
          working_dir: '$project_path'
        }
      },
      {
        keys: ['ctrl+shift+a', 'ctrl+shift+s'],
        command: 'exec',
        args: {
          cmd: ['node', 'scripts/autopilot-cli.mjs', 'spec', '--feature', '$selection'],
          working_dir: '$project_path'
        }
      },
      {
        keys: ['ctrl+shift+a', 'ctrl+shift+v'],
        command: 'exec',
        args: {
          cmd: ['node', 'scripts/autopilot-cli.mjs', 'validate'],
          working_dir: '$project_path'
        }
      }
    ];

    await fs.writeFile(
      path.join(sublimeDir, 'Default.sublime-keymap'),
      JSON.stringify(keyBindings, null, 2)
    );

    // Sublime Text snippets
    const snippet = `<snippet>
    <content><![CDATA[
/**
 * Feature Request for Spec-to-Code Autopilot
 * 
 * Title: \${1:Feature Title}
 * Type: \${2:feature}
 * Priority: \${3:medium}
 * 
 * Description:
 * \${4:Detailed description of the feature}
 * 
 * Acceptance Criteria:
 * - \${5:Given/When/Then criteria}
 * - \${6:Additional criteria}
 * 
 * Requirements:
 * - \${7:Functional requirements}
 * - \${8:Non-functional requirements}
 */
]]></content>
    <tabTrigger>autopilot-feature</tabTrigger>
    <scope>source.js, source.ts</scope>
    <description>Autopilot feature request template</description>
</snippet>`;

    await fs.writeFile(path.join(sublimeDir, 'autopilot-feature.sublime-snippet'), snippet);
  }

  /**
   * Generate installation guide
   */
  async generateInstallationGuide() {
    const guide = `# IDE Integration Installation Guide

This directory contains integration files for popular IDEs and editors to work with the Spec-to-Code Autopilot system.

## Available Integrations

### VS Code
- **Location**: \`vscode/\`
- **Features**: Tasks, keybindings, snippets, commands
- **Installation**: Run \`vscode/install.sh\` (Linux/Mac) or \`vscode/install.bat\` (Windows)
- **Manual**: Copy files to your VS Code user directory

**Keybindings:**
- \`Ctrl+Shift+A, Ctrl+Shift+R\`: Run Full Workflow
- \`Ctrl+Shift+A, Ctrl+Shift+S\`: Generate Spec
- \`Ctrl+Shift+A, Ctrl+Shift+V\`: Run Validation
- \`Ctrl+Shift+A, Ctrl+Shift+T\`: Show Status

### WebStorm/IntelliJ IDEA
- **Location**: \`webstorm/\`
- **Features**: External tools, live templates
- **Installation**: 
  1. Go to File → Settings → Tools → External Tools
  2. Import \`tools.xml\`
  3. Go to File → Settings → Editor → Live Templates
  4. Import \`live-templates.xml\`

### Vim/Neovim
- **Location**: \`vim/\`
- **Features**: Commands, key mappings, snippets
- **Installation**: Add \`source /path/to/autopilot.vim\` to your \`.vimrc\` or \`init.vim\`

**Commands:**
- \`:AutopilotRun [feature]\`: Run workflow
- \`:AutopilotSpec <feature>\`: Generate spec
- \`:AutopilotValidate\`: Run validation
- \`:AutopilotStatus\`: Show status

**Key Mappings:**
- \`<leader>ar\`: Run workflow
- \`<leader>as\`: Generate spec
- \`<leader>av\`: Run validation
- \`<leader>at\`: Show status

### Emacs
- **Location**: \`emacs/\`
- **Features**: Interactive functions, key bindings, menu, snippets
- **Installation**: Add \`(require 'autopilot)\` to your \`init.el\`

**Key Bindings:**
- \`C-c a r\`: Run workflow
- \`C-c a s\`: Generate spec
- \`C-c a v\`: Run validation
- \`C-c a t\`: Show status

### Sublime Text
- **Location**: \`sublime/\`
- **Features**: Commands, key bindings, snippets
- **Installation**: Copy files to your Sublime Text Packages/User directory

**Key Bindings:**
- \`Ctrl+Shift+A, Ctrl+Shift+R\`: Run workflow
- \`Ctrl+Shift+A, Ctrl+Shift+S\`: Generate spec
- \`Ctrl+Shift+A, Ctrl+Shift+V\`: Run validation

## Common Features

All integrations provide:

1. **Run Full Workflow**: Execute the complete Spec-to-PR pipeline
2. **Generate Specification**: Create specs from feature descriptions
3. **Run Validation**: Execute quality gates and checks
4. **Show Status**: Display recent runs and their status
5. **Feature Request Template**: Snippet for structured feature requests

## Prerequisites

- Node.js installed
- Autopilot CLI available at \`scripts/autopilot-cli.mjs\`
- Project root contains the autopilot scripts

## Troubleshooting

### Command Not Found
- Ensure Node.js is in your PATH
- Verify the script path is correct relative to your project root

### Permission Denied
- Make scripts executable: \`chmod +x scripts/autopilot-cli.mjs\`
- On Windows, ensure PowerShell execution policy allows scripts

### Integration Not Working
- Check IDE-specific installation instructions
- Verify file paths in configuration files
- Restart your IDE after installation

## Customization

You can customize the integrations by:

1. **Modifying Commands**: Update script paths and arguments
2. **Changing Key Bindings**: Edit keybinding files for your preferences
3. **Adding New Commands**: Extend with additional autopilot features
4. **Custom Snippets**: Add project-specific templates

## Support

For issues with IDE integrations:

1. Check the installation guide for your specific IDE
2. Verify autopilot CLI works from command line
3. Check IDE console/logs for error messages
4. Ensure all file paths are correct for your system

## Contributing

To add support for a new IDE:

1. Create a new directory under \`.ide-integrations/\`
2. Add configuration files for the IDE
3. Update this installation guide
4. Test the integration thoroughly

---

Generated by Spec-to-Code Autopilot IDE Integration Generator
`;

    await fs.writeFile(path.join(this.ideDir, 'README.md'), guide);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const integration = new IDEIntegration();

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node ide-integration.mjs [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h    Show this help message');
    console.log('');
    console.log('Generates IDE integration files for Spec-to-Code Autopilot');
    return;
  }

  try {
    await integration.generateAll();
  } catch (error) {
    console.error(chalk.red.bold('❌ IDE Integration Error:'), error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  main();
}

export { IDEIntegration };