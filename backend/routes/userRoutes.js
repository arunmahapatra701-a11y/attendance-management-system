const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getAllUsers, assignUser, createUser, getUserStats } = require('../controllers/userController');
const { bulkImportStudents } = require('../controllers/bulkImportController');
const { protect, authorize } = require('../middleware/auth');

// Use memory storage so we get the file buffer directly
const upload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.originalname.match(/\.(xlsx|xls|csv)$/i)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) or CSV are allowed'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

router.get('/', protect, authorize('admin'), getAllUsers);
router.get('/stats', protect, authorize('admin'), getUserStats);
router.get('/test-route', (req, res) => res.json({ message: 'User routes are working' }));
router.post('/bulk-import', protect, authorize('admin'), (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, bulkImportStudents);
router.post('/', protect, authorize('admin'), createUser);
router.put('/:id/assign', protect, authorize('admin'), assignUser);

module.exports = router;
