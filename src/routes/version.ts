import express = require('express');
import fs = require('fs');

const router = express.Router();


router.get('/version.json', async (req, res) => {
  try {
    const json = JSON.parse(await fs.promises.readFile('package.json', "utf8"));    
    res.json({version: json['version']});
  } catch (e) {
    res.status(500).json({ e })
  }  
})

module.exports = router;
