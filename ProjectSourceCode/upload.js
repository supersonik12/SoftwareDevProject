// src/routes/upload.js
const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const router = express.Router();
require('dotenv').config();

const upload = multer({ dest: 'uploads/' }); // temporary upload dir

router.post('/upload', upload.single('image'), async (req, res) => {
  const filePath = req.file.path;

  const form = new FormData();
  form.append('image', fs.createReadStream(filePath));

  try {
    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.API_KEY_PETS}`,
      form,
      { headers: form.getHeaders() }
    );

    // Clean up the temp file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      url: response.data.data.url,
      delete_url: response.data.data.delete_url,
    });
  } catch (error) {
    fs.unlinkSync(filePath);
    res.status(500).json({ error: 'Failed to upload image', detail: error.response?.data || error.message });
  }
});

module.exports = router;