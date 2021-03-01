import resources = require('../resources');
import express = require('express');

const router = express.Router();
const urlRepo = resources.urlRepo;

router.get('/config.js', (req, res, next) => {
  res.type('application/javascript');
  let src = '// config file\n';
  if (urlRepo) {
      src += 'window.URL_REPOSITORY = "' + urlRepo + '";\n';
  }  
  res.send(src);
});

module.exports = router;