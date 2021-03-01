import resources = require('../resources');
import express = require('express');
const router = express.Router();


router.get('/recent.json',  (req, res, next) => {
  res.json({
    data: resources.repository.articlesOrderedByModification(req.query.skip, req.query.limit)
  });
});

module.exports = router;
