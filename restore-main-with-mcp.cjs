const https = require('https');
const fs = require('fs');
const path = require('path');

// GitHub API URLs
const REPO_OWNER = 'AIFUTURE10X';
const REPO_NAME = 'PromptsGenie';
const BRANCH_NAME = 'main';

const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const BRANCH_URL = `${API_BASE}/git/trees/${BRANCH_NAME}?recursive=1`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH_NAME}`;

// Files/directories to preserve (MCP tools and related)
const PRESERVE_PATHS = [
  '.trae',
  'tools',
  '.env'
];

console.log('🚀 Starting restoration process...');
console.log('📋 Plan:');
console.log('   1. Backup current enhanced features');
console.log('   2. Restore main branch files');
console.log('   3. Preserve MCP tools and configuration');
console.log('');

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'PromptsGenie-Fetcher/1.0'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function backupCurrentFeatures() {
  console.log('🗂️  Creating backup of current enhanced features...');
  
  const backupDir = `enhanced-features-backup-${new Date().toISOString().slice(0, 10)}`;
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const itemsToBackup = [
    'image-analysis-v1',
    'python-prompt-generator', 
    'scripts',
    '.github',
    '.storybook',
    '.reports',
    'docs',
    '.test-workflow',
    '.autopilot-output',
    '.ide-integrations'
  ];

  for (const item of itemsToBackup) {
    if (fs.existsSync(item)) {
      console.log(`📦 Backing up: ${item}`);
      const backupPath = path.join(backupDir, item);
      
      try {
        if (fs.statSync(item).isDirectory()) {
          copyDir(item, backupPath);
        } else {
          const backupParentDir = path.dirname(backupPath);
          if (!fs.existsSync(backupParentDir)) {
            fs.mkdirSync(backupParentDir, { recursive: true });
          }
          fs.copyFileSync(item, backupPath);
        }
      } catch (error) {
        console.warn(`⚠️  Could not backup ${item}: ${error.message}`);
      }
    }
  }
  
  console.log(`✅ Backup created in: ${backupDir}`);
  return backupDir;
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function restoreMainBranch() {
  try {
    console.log('🔄 Fetching main branch from GitHub...');
    
    const treeData = await makeRequest(BRANCH_URL);
    
    if (!treeData.tree) {
      console.error('No tree data found. Response:', treeData);
      return;
    }

    console.log(`📁 Found ${treeData.tree.length} files in main branch`);
    
    // Filter for core files (exclude what we want to preserve)
    const coreFiles = treeData.tree.filter(item => 
      item.type === 'blob' && 
      !PRESERVE_PATHS.some(preserve => item.path.startsWith(preserve))
    );

    console.log(`📥 Downloading ${coreFiles.length} core files...`);
    
    let downloaded = 0;
    for (const file of coreFiles) {
      try {
        const fileUrl = `${RAW_BASE}/${file.path}`;
        await downloadFile(fileUrl, file.path);
        downloaded++;
        
        if (downloaded % 10 === 0) {
          console.log(`   Downloaded ${downloaded}/${coreFiles.length} files...`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to download ${file.path}: ${error.message}`);
      }
    }
    
    console.log(`✅ Successfully downloaded ${downloaded} files from main branch`);
    
  } catch (error) {
    console.error('❌ Error restoring main branch:', error.message);
  }
}

async function main() {
  try {
    // Step 1: Backup current features
    const backupDir = await backupCurrentFeatures();
    
    // Step 2: Restore main branch
    await restoreMainBranch();
    
    console.log('');
    console.log('🎉 Restoration complete!');
    console.log('');
    console.log('✅ Preserved:');
    PRESERVE_PATHS.forEach(path => console.log(`   - ${path}/`));
    console.log('');
    console.log('📦 Enhanced features backed up to:');
    console.log(`   - ${backupDir}/`);
    console.log('');
    console.log('🔄 Next steps:');
    console.log('   1. Run: npm install');
    console.log('   2. Test the restored version');
    console.log('   3. Enhanced features are safely backed up if needed');
    
  } catch (error) {
    console.error('❌ Error during restoration:', error.message);
  }
}

// Run the script
main();