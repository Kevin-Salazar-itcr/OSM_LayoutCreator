const axios = require('axios');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const {
  GITHUB_USERNAME,
  FORK_REPO,
  GITHUB_TOKEN,
  BASE_BRANCH
} = process.env;

const githubApi = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3.raw'
  }
});

/**
 * Descarga recursivamente archivos desde un path GitHub
 */
async function fetchFilesRecursively(zip, repo, owner, branch, path, zipPrefix) {
  const { data: items } = await githubApi.get(
    `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
  );

  for (const item of items) {
    if (item.type === 'dir') {
      await fetchFilesRecursively(zip, repo, owner, branch, item.path, `${zipPrefix}/${item.name}`);
    } else if (item.type === 'file' && item.download_url) {
      const fileData = await axios.get(item.download_url, { responseType: 'arraybuffer' });
      zip.addFile(`${zipPrefix}/${item.name}`, Buffer.from(fileData.data));
    }
  }
}

/**
 * @param {{
 *   mode: 'default' | 'custom',
 *   name: string,
 *   repo?: string,
 *   owner?: string,
 *   branch?: string
 * }} params
 */
async function getLayoutZipBuffer(params) {
  const isDefault = params.mode === 'default';

  const repo = isDefault ? FORK_REPO : params.repo;
  const owner = isDefault ? GITHUB_USERNAME : params.owner;
  const branch = isDefault ? BASE_BRANCH : params.branch;
  const name = params.name;

  const layoutPath = `layouts/${name}`;
  const metadataPath = `layouts/metadata/${name}.xml`;

  try {
    const zip = new AdmZip();

    await fetchFilesRecursively(zip, repo, owner, branch, layoutPath, name);

    const { data: metadataFile } = await githubApi.get(
      `/repos/${owner}/${repo}/contents/${metadataPath}?ref=${branch}`
    );

    zip.addFile(`metadata/${name}.xml`, Buffer.from(metadataFile, 'utf8'));

    const uploadsPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath);

    const zipPath = path.join(uploadsPath, `${name}.zip`);
    zip.writeZip(zipPath);

    const extractPath = uploadsPath;
    if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath);

    zip.extractAllTo(extractPath, true);

    return {
      message: `Layout downloaded from https://github.com/${owner}/${repo}/tree/${branch}/layouts/${name} to server.`
    };

  } catch (err) {
    console.error(err.message);
    throw new Error('Error retrieving layout or metadata. Please check names and branch.');
  }
}

module.exports = { getLayoutZipBuffer };
