const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const Material = require('../models/Material');
const Notice = require('../models/Notice');
const { runMonthlyCleanup } = require('../utils/janitor');

const clearDatabase = async (req, res) => {
    try {
        // Delete all attendance records (Reports & Daily Logs)
        await Attendance.deleteMany({});
        
        // Delete all subjects
        await Subject.deleteMany({});
        
        // Delete all materials
        await Material.deleteMany({});
        
        // Delete all notices (Updates)
        await Notice.deleteMany({});
        
        // Delete all users EXCEPT for the admins
        // This is important to ensure the admin can still log in!
        await User.deleteMany({ role: { $ne: 'admin' } });

        res.status(200).json({ 
            success: true, 
            message: 'Database purged successfully. All student/teacher data, subjects, materials, and logs have been deleted.' 
        });
    } catch (error) {
        console.error('Error purging database:', error);
        res.status(500).json({ success: false, message: 'Purge failed', error: error.message });
    }
};

const optimizeDatabase = async (req, res) => {
    try {
        await runMonthlyCleanup(); // Triggers the Janitor logic immediately
        res.status(200).json({ 
            success: true, 
            message: 'Database optimization complete. Standard records older than 1 month have been bucketed.' 
        });
    } catch (error) {
        console.error('Manual optimization error:', error);
        res.status(500).json({ success: false, message: 'Optimization failed', error: error.message });
    }
};

module.exports = { clearDatabase, optimizeDatabase };
