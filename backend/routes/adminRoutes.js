const express = require('express');
const router = express.Router();
const { clearDatabase, optimizeDatabase } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// This route is extremely destructive and is only allowed for the admin.
router.delete('/purge-database', protect, authorize('admin'), clearDatabase);

// Manual trigger for Database Janitor (Standard Records -> Monthly Buckets)
router.post('/optimize-database', protect, authorize('admin'), optimizeDatabase);

module.exports = router;
