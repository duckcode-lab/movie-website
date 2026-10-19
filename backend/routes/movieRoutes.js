const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { requireLogin, isAdmin } = require('../middleware/auth_middleware');

router.get('/', movieController.index);
router.post('/', requireLogin, isAdmin, movieController.create);
router.put('/:id', requireLogin, isAdmin, movieController.update);
router.patch('/:id', requireLogin, isAdmin, movieController.update);
router.delete('/:id', requireLogin, isAdmin, movieController.remove);
router.get('/:id', movieController.watch);
router.get('/watch/:id', movieController.watch);

module.exports = router;