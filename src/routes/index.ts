import express = require('express');
const router = express.Router();

router.use(require('./version'))
router.use(require('./search'))
router.use(require('./articles'))
router.use(require('./article'))
router.use(require('./config'))
router.use(require('./recent'))

module.exports = router;
