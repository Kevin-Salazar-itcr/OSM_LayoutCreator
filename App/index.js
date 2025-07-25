const express = require('express');
const path = require('path');
const fs = require('fs');
const gitUploader = require('./api/upload');
const zipDownloader = require('./api/downloadLayout');
const cleaner = require('./api/cleaner');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', gitUploader);

app.use('/api', zipDownloader);

app.use('/api/clean', cleaner);

app.options('/', (req, res) => {
  const routes = [];
  routes.push({ method: 'POST', path: '/api/upload-zip' });
  routes.push({ method: 'POST', path: '/api/download' });
  routes.push({ method: 'POST', path: '/api/loadFromZip' });
  routes.push({ method: 'POST', path: '/api/clean' });
  res.json({ endpoints: routes });
});

app.get('/', (req, res) => {
  res.send('🚀 Backend server is running');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
