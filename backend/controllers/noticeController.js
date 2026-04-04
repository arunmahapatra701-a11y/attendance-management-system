const Notice = require('../models/Notice');
const User = require('../models/User');

// @desc    Get all notices
// @route   GET /api/notices
// @access  Private (All authenticated users can see)
const getNotices = async (req, res) => {
    try {
        const query = {};
        
        // If the user is a student, filter by their department/semester
        if (req.user.role === 'student') {
            const fullUser = await User.findById(req.user.id);
            if (fullUser) {
                query.$or = [
                    { targetDepartment: '' },
                    { targetDepartment: fullUser.department || '' }
                ];
            }
        }

        const notices = await Notice.find(query)
            .populate('postedBy', 'name role')
            .sort({ createdAt: -1 });
            
        res.status(200).json(notices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a notice
// @route   POST /api/notices
// @access  Private (Teacher or Admin only)
const createNotice = async (req, res) => {
    try {
        if (req.user.role === 'student') {
            return res.status(403).json({ message: 'Not authorized to create notices' });
        }

        const { title, message, category, targetDepartment, targetSemester } = req.body;

        const notice = await Notice.create({
            title,
            message,
            category: category || 'General',
            postedBy: req.user.id,
            targetDepartment: targetDepartment || '',
            targetSemester: targetSemester || ''
        });

        // populate before returning
        const populatedNotice = await Notice.findById(notice._id).populate('postedBy', 'name role');

        res.status(201).json(populatedNotice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a notice
// @route   DELETE /api/notices/:id
// @access  Private (Admin or the Teacher who created it)
const deleteNotice = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);

        if (!notice) {
            return res.status(404).json({ message: 'Notice not found' });
        }

        if (req.user.role !== 'admin' && notice.postedBy.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this notice' });
        }

        await notice.deleteOne();
        res.status(200).json({ message: 'Notice removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getNotices,
    createNotice,
    deleteNotice
};
