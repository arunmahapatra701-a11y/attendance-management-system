const express = require('express');
const router = express.Router();
const { clearDatabase } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// This route is extremely destructive and is only allowed for the admin.
router.delete('/purge-database', protect, authorize('admin'), clearDatabase);

module.exports = router;
