const express = require('express');
const adminUserController = require('../controllers/adminUserController');
const { requireLogin, isAdmin } = require('../middleware/auth_middleware');

const router = express.Router();

router.use(requireLogin, isAdmin);
router.get('/', adminUserController.list);
router.get('/:id', adminUserController.getById);
router.patch('/:id/role', adminUserController.updateRole);
router.delete('/:id', adminUserController.remove);

module.exports = router;
