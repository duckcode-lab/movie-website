const express = require('express');
const movieController = require('../controllers/movieController');

const router = express.Router();

router.get('/', movieController.index);
router.get('/watch/:id', movieController.watch);

module.exports = router;