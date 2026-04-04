const express = require('express');
const router = express.Router();
const { createSubject, getSubjects } = require('../controllers/subjectController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getSubjects); // Everyone can get subjects
router.post('/', protect, authorize('admin'), createSubject); // Only admin can create

module.exports = router;
