const express = require('express');
const { getLayoutZipBuffer } = require('../functions/getLayoutFromGitHub');
const { processZip } = require('../functions/processZip');
const multer = require('multer');
const upload = multer({ dest: 'temp_uploads/' });


const router = express.Router();

router.post('/download', async (req, res) => {
  const { mode, name, repo, owner, branch } = req.body;

  if (!mode || !name) {
    return res.status(400).json({ error: 'Both "mode" and "name" are required.' });
  }

  try {
    const zipBuffer = await getLayoutZipBuffer({
      mode,
      name,
      repo,
      owner,
      branch
    });

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename=${name}.zip`
    });

    res.send(zipBuffer);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.post('/loadFromZip', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No ZIP received.' });
  }

  const result = await processZip(req.file.path);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ mensaje: `Layout "${result.layoutName}" processed successfuly.` });
});

module.exports = router;
