const express = require('express');
const router = express.Router();
const { getNotices, createNotice, deleteNotice } = require('../controllers/noticeController');
const { protect } = require('../middleware/auth');

router.route('/')
    .get(protect, getNotices)
    .post(protect, createNotice);

router.route('/:id')
    .delete(protect, deleteNotice);

module.exports = router;
