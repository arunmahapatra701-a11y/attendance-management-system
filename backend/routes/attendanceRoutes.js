const express = require('express');
const router = express.Router();
const { markAttendance, getStudentAttendance, getTeacherAttendance, getTeacherLogs, getAllStudents } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.post('/mark', protect, authorize('teacher', 'admin'), markAttendance);
router.get('/student', protect, authorize('student'), getStudentAttendance);
router.get('/teacher', protect, authorize('teacher', 'admin'), getTeacherAttendance);
router.get('/teacher/logs', protect, authorize('teacher', 'admin'), getTeacherLogs);
router.get('/students', protect, authorize('teacher', 'admin'), getAllStudents);

module.exports = router;
