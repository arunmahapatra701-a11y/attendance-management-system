const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a subject name'],
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Please provide a subject code'],
        unique: true,
        trim: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    department: {
        type: String,
        trim: true
    },
    semester: {
        type: String,
        trim: true
    },
    isLab: {
        type: Boolean,
        default: false
    },
    batches: [{
        batchName: String,
        startRoll: Number,
        endRoll: Number
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Subject', subjectSchema);
