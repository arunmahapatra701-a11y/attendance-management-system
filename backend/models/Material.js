const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a material title'],
        trim: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: [true, 'Please provide a subject']
    },
    subjectCode: {
        type: String,
        required: [true, 'Please provide a subject code']
    },
    semester: {
        type: String,
        required: [true, 'Please provide a semester']
    },
    department: {
        type: String,
        required: [true, 'Please provide a department']
    },
    link: {
        type: String,
        trim: true
    },
    fileUrl: {
        type: String
    },
    originalFileName: {
        type: String
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Material', materialSchema);
