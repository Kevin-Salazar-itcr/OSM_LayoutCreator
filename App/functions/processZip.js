const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

/**
 * zip expected structure:
 * myLayout.zip
 * ├── myLayout/
 * │   ├── myLayout_icons/
 * │   │   ├── icon1.png
 * │   ├── en.xml
 * │   └── README.md
 * └── metadata/
 *     └── myLayout.xml
 *
 * @param {string} zipPath 
 * @returns {Promise<{ success: true, layoutName: string } | { success: false, error: string }>}
 */
async function processZip(zipPath) {
  const extractPath = path.join(__dirname, '../uploads');
  if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath);

  try {
    await fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .promise();

    const contents = fs.readdirSync(extractPath);
    const layoutDir = contents.find(name => fs.lstatSync(path.join(extractPath, name)).isDirectory() && name !== 'metadata');
    const metadataDir = contents.find(name => name === 'metadata');

    if (!layoutDir || !metadataDir) {
      return { success: false, error: 'Verify zip structure.' };
    }

    const layoutPath = path.join(extractPath, layoutDir);
    const metadataPath = path.join(extractPath, 'metadata');

    const layoutFiles = fs.readdirSync(layoutPath);
    const iconsDir = layoutFiles.find(name => name.endsWith('_icons') && fs.lstatSync(path.join(layoutPath, name)).isDirectory());
    const readmeFile = layoutFiles.find(name => name.toLowerCase() === 'readme.md');
    const xmlFile = layoutFiles.find(name => name.endsWith('.xml'));

    if (!iconsDir || !readmeFile || !xmlFile) {
      return { success: false, error: 'Zip uncompleted.' };
    }

    const metadataFiles = fs.readdirSync(metadataPath);
    const metadataXML = metadataFiles.find(name => name.endsWith('.xml'));

    if (!metadataXML) {
      return { success: false, error: 'XML for metadata not found.' };
    }

    return {
      success: true,
      layoutName: layoutDir
    };

  } catch (err) {
    console.error('Error processing ZIP:', err.message);
    return { success: false, error: 'Unable to decompress ZIP file.' };
  } finally {
    fs.unlinkSync(zipPath); // borra el ZIP temporal
  }
}

module.exports = { processZip };
