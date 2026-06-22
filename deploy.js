const fs = require('fs');
const path = require('path');

// Target repo settings
const REPO_NAME = 'cosmic-bestie-sanctuary';
const FILES_TO_UPLOAD = [
  'index.html',
  'style.css',
  'app.js',
  'assets/photo_neutral.png',
  'assets/photo_glasses.png',
  'assets/photo_smile.png',
  'assets/photo_surprise.png'
];

async function deploy() {
  const token = process.argv[2] || process.env.GITHUB_TOKEN;
  
  if (!token || token === 'github_token') {
    console.error('Error: Please provide a valid GitHub Personal Access Token (classic) with repo scopes.');
    console.error('Usage: node deploy.js <YOUR_GITHUB_TOKEN>');
    process.exit(1);
  }

  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'Cosmic-Bestie-Deployer'
  };

  console.log('Step 1: Checking GitHub authentication...');
  let username = '';
  try {
    const userRes = await fetch('https://api.github.com/user', { headers });
    if (!userRes.ok) {
      throw new Error(`Authentication failed: ${userRes.status} ${userRes.statusText}`);
    }
    const userData = await userRes.json();
    username = userData.login;
    console.log(`Authenticated successfully as GitHub user: ${username}`);
  } catch (err) {
    console.error('Error validating GitHub Token:', err.message);
    process.exit(1);
  }

  console.log(`\nStep 2: Checking if repository "${REPO_NAME}" exists...`);
  let repoExists = false;
  try {
    const repoCheckRes = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}`, { headers });
    if (repoCheckRes.ok) {
      repoExists = true;
      console.log(`Repository "${REPO_NAME}" already exists. Updating existing repository.`);
    } else if (repoCheckRes.status === 404) {
      console.log(`Repository "${REPO_NAME}" not found. Creating a new repository...`);
    } else {
      throw new Error(`Unexpected repo check status: ${repoCheckRes.status}`);
    }
  } catch (err) {
    console.error('Error checking repository status:', err.message);
    process.exit(1);
  }

  if (!repoExists) {
    try {
      const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: REPO_NAME,
          description: '🔮 A mystical, fun, and girly sanctuary for my best friend! ✨',
          private: false,
          has_issues: true,
          has_projects: false,
          has_wiki: false
        })
      });
      
      if (!createRes.ok) {
        throw new Error(`Failed to create repository: ${createRes.status} ${createRes.statusText}`);
      }
      console.log(`Successfully created repository: ${username}/${REPO_NAME}`);
    } catch (err) {
      console.error('Error creating repository:', err.message);
      process.exit(1);
    }
  }

  console.log('\nStep 3: Uploading files to GitHub...');
  for (const relativePath of FILES_TO_UPLOAD) {
    const localPath = path.join(__dirname, relativePath);
    if (!fs.existsSync(localPath)) {
      console.warn(`Warning: Local file ${relativePath} not found. Skipping.`);
      continue;
    }

    const fileContent = fs.readFileSync(localPath);
    const base64Content = fileContent.toString('base64');
    
    // Check if the file already exists on GitHub to obtain its SHA (required for updating)
    let sha = null;
    try {
      const getFileRes = await fetch(
        `https://api.github.com/repos/${username}/${REPO_NAME}/contents/${relativePath}`,
        { headers }
      );
      if (getFileRes.ok) {
        const fileInfo = await getFileRes.json();
        sha = fileInfo.sha;
      }
    } catch (err) {
      // Ignore errors here, we assume file is new if we can't fetch it
    }

    console.log(`Uploading ${relativePath}... ${sha ? '(Updating)' : '(New File)'}`);
    try {
      const uploadRes = await fetch(
        `https://api.github.com/repos/${username}/${REPO_NAME}/contents/${relativePath}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `Deploy ${relativePath}`,
            content: base64Content,
            sha: sha || undefined,
            branch: 'main'
          })
        }
      );

      if (!uploadRes.ok) {
        const errBody = await uploadRes.text();
        throw new Error(`Upload failed for ${relativePath}: ${uploadRes.status} - ${errBody}`);
      }
    } catch (err) {
      console.error(`Error uploading ${relativePath}:`, err.message);
      process.exit(1);
    }
  }
  console.log('All files uploaded successfully!');

  // Wait briefly for GitHub to process commits before configuring Pages
  console.log('\nStep 4: Waiting for GitHub commits to process...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Step 5: Enabling GitHub Pages hosting on main branch...');
  try {
    const pagesCheckRes = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/pages`, { headers });
    if (pagesCheckRes.ok) {
      console.log('GitHub Pages is already configured for this repository.');
    } else {
      const enablePagesRes = await fetch(`https://api.github.com/repos/${username}/${REPO_NAME}/pages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source: {
            branch: 'main',
            path: '/'
          }
        })
      });
      
      if (enablePagesRes.ok || enablePagesRes.status === 201) {
        console.log('GitHub Pages has been successfully enabled.');
      } else {
        const errText = await enablePagesRes.text();
        console.warn(`Could not enable Pages immediately (status ${enablePagesRes.status}): ${errText}`);
        console.warn('You can enable Pages manually in Repo Settings > Pages > Source: Deploy from branch (main).');
      }
    }
  } catch (err) {
    console.error('Error enabling GitHub Pages:', err.message);
  }

  const liveUrl = `https://${username}.github.io/${REPO_NAME}/`;
  console.log('\n==================================================');
  console.log('🎉 DEPLOYMENT COMPLETE! 🎉');
  console.log(`Repository: https://github.com/` + `${username}/${REPO_NAME}`);
  console.log(`Live Website URL: ${liveUrl}`);
  console.log('==================================================');
  console.log('Note: GitHub Pages may take a minute or two to build and show the live site.');
}

deploy();
