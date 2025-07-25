const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

async function testDownload() {
  try {
    const response = await axios.post(`${BASE_URL}/download`, {
      mode: 'github',
      name: 'maxspeed',
      repo: 'osmtracker-android-layouts',
      owner: 'Kevin-Salazar-itcr',
      branch: 'prueba'
    }, { responseType: 'arraybuffer' });

    console.log('✅ download → ZIP guardado como prueba.zip');
  } catch (error) {
    console.error('❌ download error:', error.response?.data || error.message);
  }
}

async function testLoadFromZip() {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(path.join(__dirname, 'Hydranten.zip')));

    const response = await axios.post(`${BASE_URL}/loadFromZip`, form, {
      headers: form.getHeaders()
    });

    console.log('✅ loadFromZip →', response.data);
  } catch (error) {
    console.error('❌ loadFromZip error:', error.response?.data || error.message);
  }
}

async function testUploadZip() {
  try {
    const form = new FormData();
    form.append('zipfile', fs.createReadStream(path.join(__dirname, '/uploads/maxspeed_usa.zip')));

    const response = await axios.post(`${BASE_URL}/upload-zip`, form, {
      headers: form.getHeaders()
    });

    console.log('✅ upload-zip →', response.data);
  } catch (error) {
    console.error('❌ upload-zip error:', error.response?.data || error.message);
  }
}

async function testCleaner() {
  try {
    const response = await axios.post(`${BASE_URL}/clean`);
    console.log('✅ clean →', response.data);
  } catch (error) {
    console.error('❌ clean error:', error);
  }
}

async function runTests() {
  //await testDownload();
  //await testLoadFromZip();
  await testUploadZip();
  //await testCleaner();
}

runTests();
