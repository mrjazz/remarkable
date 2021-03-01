import resources = require('../resources');
import wiki = require('../wiki/wiki');
import etag = require('etag');

import express = require('express');
const router = express.Router();


router.get('/search.json', (req, res, next) => {
  wiki.searchAndSort(resources.docsPath, req.query.text)
    .then(result => {      
      console.log(result);
      res.setHeader('Etag', etag(JSON.stringify(result)));
      res.json(result);
    })
    .catch(error => res.status(500).json({ error }));
})

module.exports = router;
