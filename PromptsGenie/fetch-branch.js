const https = require('https');
const fs = require('fs');

// GitHub API URLs
const REPO_OWNER = 'AIFUTURE10X';
const REPO_NAME = 'PromptsGenie';
const BRANCH_NAME = 'feat/image-analyze-2025-10-22';

const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
const BRANCH_URL = `${API_BASE}/git/trees/${BRANCH_NAME}?recursive=1`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH_NAME}`;

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
            resolve(data); // Return raw data if not JSON
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function fetchBranchContent() {
  try {
    console.log(`Fetching branch content for: ${BRANCH_NAME}`);
    console.log(`API URL: ${BRANCH_URL}`);
    
    const treeData = await makeRequest(BRANCH_URL);
    
    if (!treeData.tree) {
      console.error('No tree data found. Response:', treeData);
      return;
    }

    console.log(`\nFound ${treeData.tree.length} files in the branch:`);
    
    // Filter for relevant files (image analysis, gemini, etc.)
    const relevantFiles = treeData.tree.filter(item => 
      item.type === 'blob' && (
        item.path.includes('image') ||
        item.path.includes('gemini') ||
        item.path.includes('analyze') ||
        item.path.includes('vision') ||
        item.path.includes('ai') ||
        item.path.endsWith('.ts') ||
        item.path.endsWith('.tsx') ||
        item.path.endsWith('.js') ||
        item.path.endsWith('.jsx')
      )
    );

    console.log('\nRelevant files found:');
    relevantFiles.forEach(file => {
      console.log(`- ${file.path} (${file.size} bytes)`);
    });

    // Create a summary file
    const summary = {
      branch: BRANCH_NAME,
      totalFiles: treeData.tree.length,
      relevantFiles: relevantFiles.map(f => ({
        path: f.path,
        size: f.size,
        url: `${RAW_BASE}/${f.path}`
      })),
      fetchedAt: new Date().toISOString()
    };

    fs.writeFileSync('branch-analysis.json', JSON.stringify(summary, null, 2));
    console.log('\nBranch analysis saved to: branch-analysis.json');

    // Show key files that might contain image analysis functionality
    const keyFiles = relevantFiles.filter(f => 
      f.path.includes('gemini') || 
      f.path.includes('image') || 
      f.path.includes('analyze')
    );

    if (keyFiles.length > 0) {
      console.log('\nKey files for image analysis:');
      keyFiles.forEach(file => {
        console.log(`\n📁 ${file.path}`);
        console.log(`   Size: ${file.size} bytes`);
        console.log(`   Raw URL: ${RAW_BASE}/${file.path}`);
      });
    }

  } catch (error) {
    console.error('Error fetching branch content:', error.message);
    
    // Try alternative approach - check if branch exists
    try {
      console.log('\nTrying to fetch branch info...');
      const branchInfo = await makeRequest(`${API_BASE}/branches/${BRANCH_NAME}`);
      console.log('Branch exists! SHA:', branchInfo.commit.sha);
    } catch (branchError) {
      console.error('Branch not found or inaccessible:', branchError.message);
      console.log('\nTrying to list all branches...');
      
      try {
        const branches = await makeRequest(`${API_BASE}/branches`);
        console.log('Available branches:');
        branches.forEach(branch => console.log(`- ${branch.name}`));
      } catch (listError) {
        console.error('Could not list branches:', listError.message);
      }
    }
  }
}

// Run the script
fetchBranchContent();