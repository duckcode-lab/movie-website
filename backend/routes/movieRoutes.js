const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

router.get('/', movieController.index);
router.get('/:id', movieController.watch);
router.get('/watch/:id', movieController.watch);

module.exports = router;