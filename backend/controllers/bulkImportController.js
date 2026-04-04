const XLSX = require('xlsx');
const User = require('../models/User');

// @desc    Bulk import students from Excel file
// @route   POST /api/users/bulk-import
// @access  Private (Admin only)
const bulkImportStudents = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can bulk import students' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an Excel file' });
        }

        // Parse the Excel file from buffer
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Use sheet_to_json to get data objects
        const rows = XLSX.utils.sheet_to_json(worksheet);

        if (!rows || rows.length === 0) {
            return res.status(400).json({ message: 'Excel file is empty or has no valid data rows' });
        }

        // Improved Header normalization and matching
        // Map common variations of headers to our internal keys
        const headerMaps = {
            enrollmentNumber: ['Enrollment Number', 'enrollment number', 'enrollmentno', 'roll number', 'rollno', 'EnrollmentNumber'],
            name: ['Name', 'name', 'student name', 'studentname', 'fullname'],
            department: ['Department', 'department', 'dept'],
            semester: ['Semester', 'semester', 'sem']
        };

        const results = { created: 0, skipped: 0, errors: [] };

        for (const row of rows) {
            // Find values by checking various possible header names
            let enrollmentNumber = '';
            let name = '';
            let department = '';
            let semester = '';

            // Match keys by normalizing both key and target map
            Object.keys(row).forEach(key => {
                const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '');
                
                if (headerMaps.enrollmentNumber.some(h => h.toLowerCase().replace(/\s+/g, '') === normalizedKey)) {
                    enrollmentNumber = String(row[key] || '').trim();
                } else if (headerMaps.name.some(h => h.toLowerCase().replace(/\s+/g, '') === normalizedKey)) {
                    name = String(row[key] || '').trim();
                } else if (headerMaps.department.some(h => h.toLowerCase().replace(/\s+/g, '') === normalizedKey)) {
                    department = String(row[key] || '').trim();
                } else if (headerMaps.semester.some(h => h.toLowerCase().replace(/\s+/g, '') === normalizedKey)) {
                    semester = String(row[key] || '').trim();
                }
            });

            if (!enrollmentNumber || !name) {
                results.errors.push(`Skipped row: Missing enrollment number or name (Found: ${enrollmentNumber || 'none'}/${name || 'none'})`);
                results.skipped++;
                continue;
            }

            if (!department || !semester) {
                const missingFields = [];
                if (!department) missingFields.push('department');
                if (!semester) missingFields.push('semester');
                results.errors.push(`Skipped ${enrollmentNumber}: Enrollment does not contain ${missingFields.join(', ')}`);
                results.skipped++;
                continue;
            }

            // Check if student already exists (by rollNumber or generated email)
            const generatedEmail = `${enrollmentNumber.toString().toLowerCase().replace(/\s+/g, '')}@student.edu`;
            const existingUser = await User.findOne({ 
                $or: [{ rollNumber: enrollmentNumber }, { email: generatedEmail }] 
            });
            if (existingUser) {
                results.errors.push(`Skipped: ${enrollmentNumber} (${name}) - already exists`);
                results.skipped++;
                continue;
            }

            try {
                const defaultPassword = '123456';

                await User.create({
                    name,
                    email: generatedEmail,
                    password: defaultPassword,
                    plainPassword: defaultPassword, // Storing for ease of system administration as requested
                    role: 'student',
                    rollNumber: enrollmentNumber,
                    department,
                    semester
                });

                results.created++;
            } catch (err) {
                results.errors.push(`Failed: ${enrollmentNumber} (${name}) - ${err.message}`);
                results.skipped++;
            }
        }

        res.status(200).json({
            message: `Import complete. ${results.created} students successfully created, ${results.skipped} skipped.`,
            created: results.created,
            skipped: results.skipped,
            errors: results.errors.slice(0, 20) // Cap error details at 20 for cleaner response
        });

    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({ message: 'Bulk import failed: ' + error.message });
    }
};

module.exports = { bulkImportStudents };
