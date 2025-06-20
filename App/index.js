const express = require('express');
const path = require('path');
const fs = require('fs');
const gitUploader = require('./api/upload');
const zipDownloader = require('./api/downloadLayout');

const app = express();
const PORT = process.env.PORT || 3000;


function cleanUploadsDirectory() {
  const uploadsPath = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadsPath)) {
    fs.readdirSync(uploadsPath).forEach(file => {
      const filePath = path.join(uploadsPath, file);
      fs.rmSync(filePath, { recursive: true, force: true });
    });
  } else {
    fs.mkdirSync(uploadsPath);
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', gitUploader);
app.use('/api', zipDownloader);

app.use(express.static(path.join(__dirname, 'public')));

app.post('/clean-uploads', (req, res) => {
  cleanUploadsDirectory();
  res.json({ mensaje: 'uploads cleaned' });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
