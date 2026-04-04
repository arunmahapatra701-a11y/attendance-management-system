const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['General', 'Examination', 'Urgent', 'Academic', 'Other'],
        default: 'General'
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetDepartment: {
        type: String, // Optional: if empty, viewable by all
        default: ''
    },
    targetSemester: {
        type: String, // Optional: if empty, viewable by all
        default: ''
    }
}, { timestamps: true });

// Latest notices first
noticeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notice', noticeSchema);
