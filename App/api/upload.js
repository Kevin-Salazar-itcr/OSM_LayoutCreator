const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { uploadZipToGitHub } = require('../functions/githubUploader');

const router = express.Router();
const upload = multer({ dest: path.join(__dirname, '../uploads') });

router.post('/upload-zip', upload.single('zipfile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'ZIP file is required.' });
  }

  try {
    const result = await uploadZipToGitHub(req.file.path);
    fs.unlinkSync(req.file.path); // cleanup temp file
    res.json(result);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Error processing ZIP or creating PR.' });
  }
});

module.exports = router;