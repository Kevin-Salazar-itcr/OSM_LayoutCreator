const axios = require('axios');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const FORK_REPO = process.env.FORK_REPO;
const UPSTREAM_OWNER = process.env.UPSTREAM_OWNER;
const UPSTREAM_REPO = process.env.UPSTREAM_REPO;
const BASE_BRANCH = process.env.BASE_BRANCH;

const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `token ${GITHUB_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

function generateBranchName(rawName) {
  const cleaned = rawName
    .replace(/\s+/g, '-')                         
    .replace(/[\/~^:?*[\]{}\\@]+/g, '-')          
    .replace(/^-+|-+$/g, '')                      
    .replace(/--+/g, '-');                        

  const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
  return `layout-${cleaned}-${timestamp}`;
}

async function uploadZipToGitHub(zipPath) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();

  const firstLayout = entries.find(e =>
    e.entryName.split('/').length >= 2 &&
    !e.entryName.startsWith('metadata/') &&
    !e.isDirectory
  );
  if (!firstLayout) throw new Error('No layout folder found at root level.');

  const dispositionName = firstLayout.entryName.split('/')[0];
  const branchName = generateBranchName(dispositionName);

  // ✅ Validar que exista metadata/<layout>.xml
  const expectedMetadataPath = `metadata/${dispositionName}.xml`;
  const metadataEntry = entries.find(e =>
    e.entryName.replace(/^\/|\/$/g, '') === expectedMetadataPath && !e.isDirectory
  );

  if (!metadataEntry) {
    throw new Error(`Missing required metadata file: ${expectedMetadataPath}`);
  }

  // 1. Get base commit SHA
  const { data: refData } = await githubApi.get(`/repos/${GITHUB_USERNAME}/${FORK_REPO}/git/ref/heads/${BASE_BRANCH}`);
  const latestCommitSha = refData.object.sha;

  const { data: commitData } = await githubApi.get(`/repos/${GITHUB_USERNAME}/${FORK_REPO}/git/commits/${latestCommitSha}`);
  const baseTreeSha = commitData.tree.sha;

  // 2. Build treeItems
  const ALLOWED_EXTENSIONS = /\.(xml|md|png|jpe?g)$/i;
  const treeItems = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    if (!ALLOWED_EXTENSIONS.test(entry.entryName)) {
      console.log(`Ignored: ${entry.entryName}`);
      continue;
    }

    const buffer = entry.getData();
    const ext = path.extname(entry.entryName).toLowerCase();
    const isBinary = /\.(png|jpe?g)$/i.test(ext);

    let logicalPath = entry.entryName.replace(/^\/|\/$/g, '');
    if (logicalPath.startsWith('metadata/')) {
      logicalPath = `layouts/${logicalPath}`;
    } else {
      logicalPath = `layouts/${dispositionName}/${logicalPath.replace(`${dispositionName}/`, '')}`;
    }

    if (isBinary) {
      const { data: blob } = await githubApi.post(`/repos/${GITHUB_USERNAME}/${FORK_REPO}/git/blobs`, {
        content: buffer.toString('base64'),
        encoding: 'base64',
      });

      treeItems.push({
        path: logicalPath,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      });
    } else {
      treeItems.push({
        path: logicalPath,
        mode: '100644',
        type: 'blob',
        content: buffer.toString('utf8'),
      });
    }
  }

  // 3. Create tree
  const { data: newTree } = await githubApi.post(`/repos/${GITHUB_USERNAME}/${FORK_REPO}/git/trees`, {
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  // 4. Create commit
  const { data: newCommit } = await githubApi.post(`/repos/${GITHUB_USERNAME}/${FORK_REPO}/git/commits`, {
    message: `Upload layout ZIP: ${dispositionName}`,
    tree: newTree.sha,
    parents: [latestCommitSha],
  });

  // 5. Create new branch
  await githubApi.post(`/repos/${GITHUB_USERNAME}/${FORK_REPO}/git/refs`, {
    ref: `refs/heads/${branchName}`,
    sha: newCommit.sha,
  });

  return {
    message: `Branch '${branchName}' created and layout committed.`,
    branch: branchName,
  };
}


module.exports = {
  uploadZipToGitHub,
};
