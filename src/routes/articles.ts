import etag = require('etag');
import express = require('express');
import resources = require('../resources');


const router = express.Router();
const repository = resources.repository;

router.get('/articles.json',  (req, res, next) => {
    const tree = repository.get('tree');
    res.setHeader('Etag', etag(JSON.stringify(tree)));
    res.json(tree);
})

module.exports = router;