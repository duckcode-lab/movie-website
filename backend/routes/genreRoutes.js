const express = require('express');
const router = express.Router();
const genreController = require('../controllers/genreController');
const { requireLogin, isAdmin } = require('../middleware/auth_middleware');

router.use(requireLogin, isAdmin);
router.get('/', genreController.index);
router.post('/', genreController.create);
router.put('/:id', genreController.update);
router.patch('/:id', genreController.update);
router.delete('/:id', genreController.remove);

module.exports = router;
