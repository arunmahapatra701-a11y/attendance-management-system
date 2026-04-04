const Attendance = require('../models/Attendance');
const User = require('../models/User');

const markAttendance = async (req, res) => {
    try {
        const { studentsAttendance, date, section, subject } = req.body;
        const activeSection = section || 'Regular Class';

        if (!studentsAttendance || !Array.isArray(studentsAttendance)) {
            return res.status(400).json({ message: 'Invalid attendance data' });
        }

        const attendanceDate = date ? new Date(date) : new Date();
        attendanceDate.setHours(0, 0, 0, 0);

        const results = await Promise.all(studentsAttendance.map(async (record) => {
            const query = { student: record.studentId, date: attendanceDate, teacher: req.user.id, section: activeSection };
            if (subject) query.subject = subject;

            return await Attendance.findOneAndUpdate(
                query,
                { status: record.status },
                { upsert: true, new: true }
            );
        }));

        res.status(201).json({ message: 'Attendance marked successfully', count: results.length });
    } catch (error) {
        res.status(500).json({ message: 'Failed to mark attendance', error: error.message });
    }
};

const getStudentAttendance = async (req, res) => {
    try {
        const studentId = req.user.id;
        
        // Parallel fetch for speed
        const [liveRecords, archivedBuckets] = await Promise.all([
            Attendance.find({ student: studentId })
                .populate('teacher', 'name')
                .populate('subject', 'name code')
                .sort({ date: -1 }).lean(),
            mongoose.connection.db.collection('attendance_archives').find({ student: new mongoose.Types.ObjectId(studentId) }).toArray()
        ]);

        // Transform buckets into a similar structure for the frontend
        const historicalRecords = archivedBuckets.flatMap(bucket => 
            bucket.records.map(record => ({
                _id: record.originalId,
                student: bucket.student,
                teacher: bucket.teacher,
                subject: bucket.subject,
                date: new Date(`${bucket.month}-${record.day}`),
                status: record.status,
                section: bucket.section,
                isArchived: true
            }))
        );

        const allRecords = [...liveRecords, ...historicalRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json(allRecords);
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

        const attendance = await Attendance.find(query).populate('student', 'name email rollNumber');
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch teacher attendance', error: error.message });
    }
};

const getAllStudents = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('-password');
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch students', error: error.message });
    }
};

const getTeacherLogs = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { subject } = req.query;

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
                .sort({ date: -1, section: 1 }).lean(),
            mongoose.connection.db.collection('attendance_archives').find(archiveQuery).toArray()
        ]);

        const historicalLogs = archivedBuckets.flatMap(bucket => 
            bucket.records.map(record => ({
                _id: record.originalId,
                student: bucket.studentData || { _id: bucket.student }, // Fallback
                teacher: bucket.teacher,
                subject: bucket.subjectData || { _id: bucket.subject },
                date: new Date(`${bucket.month}-${record.day}`),
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
