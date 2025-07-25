const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

function cleanUploadsDirectory() {
  const uploadsPath = path.join(__dirname, '..', 'uploads');
  if (fs.existsSync(uploadsPath)) {
    fs.readdirSync(uploadsPath).forEach(file => {
      const filePath = path.join(uploadsPath, file);
      fs.rmSync(filePath, { recursive: true, force: true });
    });
  } else {
    fs.mkdirSync(uploadsPath);
  }
}

router.get('/', (req, res) => {
  cleanUploadsDirectory();
  res.json({ mensaje: 'uploads cleaned' });
});

module.exports = router;
