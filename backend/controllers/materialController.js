const Material = require('../models/Material');
const Subject = require('../models/Subject');

exports.uploadMaterial = async (req, res) => {
    try {
        const { title, subject, subjectCode, semester, department, link } = req.body;
        
        let fileUrl = null;
        let originalFileName = null;
        
        if (req.file) {
            fileUrl = '/uploads/' + req.file.filename;
            originalFileName = req.file.originalname;
        }

        // Verify subject belongs to teacher (if user is teacher)
        if (req.user.role === 'teacher') {
            const subjectDoc = await Subject.findOne({ _id: subject, teacher: req.user.id });
            if (!subjectDoc) {
                return res.status(403).json({ message: 'You are not assigned to this subject or it does not exist.' });
            }
        }

        const newMaterial = new Material({
            title,
            subject,
            subjectCode,
            semester,
            department,
            link,
            fileUrl,
            originalFileName,
            uploadedBy: req.user.id
        });

        await newMaterial.save();
        
        // Populate subject info for the response
        await newMaterial.populate('subject', 'name');

        res.status(201).json({ message: 'Material uploaded successfully', material: newMaterial });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMaterials = async (req, res) => {
    try {
        const { semester, subjectName, department, subjectId } = req.query;
        let query = {};

        if (semester) query.semester = semester;
        if (department) query.department = department;
        if (subjectId) query.subject = subjectId;
        
        // If subjectName is provided, we might need to find the subject first or just filter by subjectCode since it's saved.
        // Actually we can populate and then filter, or we find subject first.
        if (subjectName) {
            const subjects = await Subject.find({ name: { $regex: subjectName, $options: 'i' } });
            const subjectIds = subjects.map(s => s._id);
            if (subjectIds.length > 0) {
                if (query.subject) {
                    query.subject = { $in: subjectIds, $eq: query.subject }; // Combine logic if needed
                } else {
                    query.subject = { $in: subjectIds };
                }
            } else {
                return res.status(200).json({ materials: [] }); // No subjects match, so no materials
            }
        }

        // If teacher, optionally they can only see their own, or maybe they can see all.
        // The prompt says "teacher can put the study material only for the subjects they will assign by admin".
        // It doesn't restrict viewing.

        const materials = await Material.find(query)
            .populate('subject', 'name')
            .populate('uploadedBy', 'name role')
            .sort({ createdAt: -1 });

        res.status(200).json({ materials });
    } catch (error) {
        console.error('Get materials error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteMaterial = async (req, res) => {
    try {
        const material = await Material.findById(req.params.id);
        if (!material) {
            return res.status(404).json({ message: 'Material not found' });
        }

        // Check ownership or admin
        if (material.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this material' });
        }

        await Material.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Material deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: error.message });
    }
};
