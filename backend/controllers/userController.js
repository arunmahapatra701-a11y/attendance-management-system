const User = require('../models/User');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
};

const assignUser = async (req, res) => {
    try {
        const { department, semester, subject } = req.body;
        
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        user.department = department || user.department;
        user.semester = semester || user.semester;
        
        if (user.role === 'teacher') {
            user.subject = subject || user.subject;
        }

        await user.save();
        
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            semester: user.semester,
            subject: user.subject,
            plainPassword: user.plainPassword
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
};

const createUser = async (req, res) => {
    try {
        const { name, email, password, role, rollNumber, subject, department, semester } = req.body;

        // Check if user already exists
        let query = [{ email }];
        if (rollNumber && rollNumber.trim() !== '') {
            query.push({ rollNumber });
        }
        
        const userExists = await User.findOne({ $or: query });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with that email or roll number' });
        }

        const user = await User.create({
            name,
            email,
            password,
            plainPassword: password,
            role,
            rollNumber: rollNumber || undefined,
            subject: subject || undefined,
            department,
            semester
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                semester: user.semester,
                subject: user.subject,
                rollNumber: user.rollNumber,
                plainPassword: user.plainPassword
            });
        } else {
            res.status(400).json({ message: 'Invalid user data provided' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Failed to create user', error: error.message });
    }
};

const getUserStats = async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } });
        const totalStudents = users.filter(u => u.role === 'student').length;
        const totalTeachers = users.filter(u => u.role === 'teacher').length;
        res.json({
            totalStudents,
            totalTeachers,
            totalClasses: 0, // Will be updated when subjects are counted
            systemHealth: 'Optimal - Real-time monitoring'
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
    }
};

module.exports = { getAllUsers, assignUser, createUser, getUserStats };
