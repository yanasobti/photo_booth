const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

const PORT = 5500;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname)); // Serves index.html, script.js, etc.

const imageDataMap = {};

// Serve index.html when accessing '/'
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve strip.html when accessing '/strip'
app.get('/strip', (req, res) => {
  res.sendFile(path.join(__dirname, 'strip.html'));
});

// Handle image upload
app.post('/upload/:userId', (req, res) => {
  const { image } = req.body;
  const { userId } = req.params;

  if (!image || !userId) {
    return res.status(400).send('Missing data');
  }

  imageDataMap[userId] = image;
  res.send('Image saved');
});

// Provide image as a blob for /strip/:userId
app.get('/strip/:userId', (req, res) => {
  const { userId } = req.params;
  const imageData = imageDataMap[userId];
  if (imageData) {
    // Remove the data URL prefix to get the base64 string
    const matches = imageData.match(/^data:(.+);base64,(.+)$/);
    if (!matches) return res.status(400).send('Invalid image data');
    const mimeType = matches[1];
    const base64Data = matches[2];
    const imgBuffer = Buffer.from(base64Data, 'base64');
    res.set('Content-Type', mimeType);
    res.send(imgBuffer);
  } else {
    res.status(404).send('No image found');
  }
});

app.listen(PORT, () => {
  console.log(`📸 Server running at http://localhost:${PORT}`);
});