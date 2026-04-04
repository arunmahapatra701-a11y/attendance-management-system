const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: false
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            const now = new Date();
            now.setHours(0, 0, 0, 0); // Normalize to midnight
            return now;
        }
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late'],
        required: true
    },
    section: {
        type: String,
        default: 'Regular Class'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Optimization: Compound indexes for high-speed lookups over time
// 1. For student report view (latest first)
attendanceSchema.index({ student: 1, date: -1, subject: 1 });
// 2. For teacher history view (latest first)
attendanceSchema.index({ teacher: 1, date: -1, subject: 1 });
// 3. For subject-wide reports
attendanceSchema.index({ subject: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
