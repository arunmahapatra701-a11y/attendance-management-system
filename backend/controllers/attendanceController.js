const Attendance = require('../models/Attendance');
const User = require('../models/User');
const mongoose = require('mongoose');

const markAttendance = async (req, res) => {
    try {
        const { studentsAttendance, date, section, subject } = req.body;
        const activeSection = section || 'Regular Class';

        if (!studentsAttendance || !Array.isArray(studentsAttendance)) {
            return res.status(400).json({ message: 'Invalid attendance data' });
        }

        const attendanceDate = date ? new Date(date) : new Date();
        attendanceDate.setHours(0, 0, 0, 0);

        // EXTRA SECURITY: Check if records already exist for this lecture to block duplicates at API level
        const queryCheck = { 
            date: attendanceDate, 
            teacher: req.user.id, 
            section: activeSection 
        };
        if (subject) queryCheck.subject = subject;

        const existingRecords = await Attendance.countDocuments(queryCheck);
        if (existingRecords > 0) {
            return res.status(400).json({ 
                message: 'Attendance already marked for this lecture. Submission blocked.',
                code: 'DUPLICATE_ATTENDANCE'
            });
        }

        // LIGHTNING PERFORMANCE: Use bulkWrite instead of individual findOneAndUpdate
        const bulkOps = studentsAttendance.map(record => {
            const query = { 
                student: record.studentId, 
                date: attendanceDate, 
                teacher: req.user.id, 
                section: activeSection 
            };
            if (subject) query.subject = subject;

            return {
                updateOne: {
                    filter: query,
                    update: { $set: { status: record.status } },
                    upsert: true
                }
            };
        });

        const result = await Attendance.bulkWrite(bulkOps);
        res.status(201).json({ 
            message: 'Attendance marked successfully', 
            count: result.upsertedCount + result.modifiedCount 
        });
    } catch (error) {
        console.error('[MARK ERROR]:', error);
        res.status(500).json({ message: 'Failed to mark attendance', error: error.message });
    }
};

const getStudentAttendance = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { limit = 30, skip = 0 } = req.query;
        
        const [liveRecords, archivedBuckets] = await Promise.all([
            Attendance.find({ student: studentId })
                .select('status date subject teacher section')
                .populate('teacher', 'name')
                .populate('subject', 'name code')
                .sort({ date: -1 })
                .limit(parseInt(limit))
                .skip(parseInt(skip))
                .lean(),
            mongoose.connection.db.collection('attendance_archives')
                .find({ student: new mongoose.Types.ObjectId(studentId) })
                .sort({ month: -1 })
                .toArray()
        ]);

        const historicalRecords = archivedBuckets.flatMap(bucket => 
            (bucket.records || []).map(record => ({
                _id: record.originalId,
                status: record.status,
                date: new Date(`${bucket.month}-${record.day.toString().padStart(2, '0')}`),
                isArchived: true
            }))
        );

        const allRecordsSorted = [...liveRecords, ...historicalRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Calculate stats on background to save frontend time
        const stats = allRecordsSorted.reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            acc.total++;
            return acc;
        }, { Present: 0, Absent: 0, Late: 0, total: 0 });

        res.json({ records: allRecordsSorted, stats });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch student attendance', error: error.message });
    }
};

const getTeacherAttendance = async (req, res) => {
    try {
        const { date, section, subject } = req.query;
        const activeSection = section || 'Regular Class';
        const attendanceDate = date ? new Date(date) : new Date();
        attendanceDate.setHours(0, 0, 0, 0);

        const query = { 
            teacher: req.user.id, 
            date: attendanceDate, 
            section: activeSection 
        };
        if (subject) query.subject = subject;

        const attendance = await Attendance.find(query)
            .select('student status date') // Projection
            .populate('student', 'name email rollNumber')
            .lean();
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch teacher attendance', error: error.message });
    }
};

const getAllStudents = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('name rollNumber department semester').lean();
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch students', error: error.message });
    }
};

const getTeacherLogs = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { subject, limit = 50 } = req.query;

        const query = { teacher: teacherId };
        const archiveQuery = { teacher: new mongoose.Types.ObjectId(teacherId) };
        
        if (subject) {
            query.subject = subject;
            archiveQuery.subject = new mongoose.Types.ObjectId(subject);
        }

        const [liveLogs, archivedBuckets] = await Promise.all([
            Attendance.find(query)
                .populate('student', 'name rollNumber department semester')
                .populate('subject', 'name code')
                .sort({ date: -1, section: 1 })
                .limit(parseInt(limit))
                .lean(),
            mongoose.connection.db.collection('attendance_archives')
                .find(archiveQuery)
                .sort({ month: -1 })
                .limit(20) 
                .toArray()
        ]);

        const historicalLogs = archivedBuckets.flatMap(bucket => 
            (bucket.records || []).map(record => ({
                _id: record.originalId,
                student: bucket.studentData || { _id: bucket.student },
                teacher: bucket.teacher,
                subject: bucket.subjectData || { _id: bucket.subject },
                date: new Date(`${bucket.month}-${record.day.toString().padStart(2, '0')}`),
                status: record.status,
                section: bucket.section,
                isArchived: true
            }))
        );

        const allLogs = [...liveLogs, ...historicalLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json(allLogs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch attendance logs', error: error.message });
    }
};

module.exports = { markAttendance, getStudentAttendance, getTeacherAttendance, getTeacherLogs, getAllStudents };
