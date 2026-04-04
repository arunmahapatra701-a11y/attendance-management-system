const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const Attendance = require('./backend/models/Attendance');
const User = require('./backend/models/User');
const Notice = require('./backend/models/Notice');
const Material = require('./backend/models/Material');

const undoOptimization = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- UNDOING DATABASE OPTIMIZATIONS ---');

        // 1. Dropping Indexes from Attendance
        console.log('Dropping Attendance indexes...');
        try {
            await Attendance.collection.dropIndexes();
            console.log('Attendance indexes cleaned.');
        } catch (e) {
            console.log('Attendance indexes note:', e.message);
        }

        // 2. User indexes
        console.log('Dropping User indexes (custom ones)...');
        try {
            await User.collection.dropIndex('role_1');
            await User.collection.dropIndex('department_1_semester_1');
        } catch (e) { console.log('User index note:', e.message); }

        // 3. Notice & Material
        try { await Notice.collection.dropIndex('createdAt_-1'); } catch(e){}
        try { await Material.collection.dropIndex('subject_1_createdAt_-1'); } catch(e){}

        // 4. De-Bucketing Engine (Restoring Archived Data)
        try {
            const db = mongoose.connection.db;
            const collections = await db.listCollections().toArray();
            const hasArchive = collections.find(c => c.name === 'attendance_archives');
            
            if (hasArchive) {
                console.log('Checking for compressed buckets to restore...');
                const Archive = db.collection('attendance_archives');
                
                // Use aggregation to explode buckets back into individual records
                const restoredData = await Archive.aggregate([
                    { $unwind: "$records" },
                    {
                        $project: {
                            _id: "$records.originalId",
                            student: 1,
                            subject: 1,
                            teacher: 1,
                            section: 1,
                            status: "$records.status",
                            date: { 
                                $dateFromParts: { 
                                    year: { $toInt: { $arrayElemAt: [{ $split: ["$month", "-"] }, 0] } },
                                    month: { $toInt: { $arrayElemAt: [{ $split: ["$month", "-"] }, 1] } },
                                    day: "$records.day"
                                }
                            }
                        }
                    }
                ]).toArray();

                if (restoredData.length > 0) {
                    console.log(`Unpacking ${restoredData.length} records from buckets...`);
                    await Attendance.insertMany(restoredData);
                    await Archive.drop();
                    console.log('Restoration complete: Buckets exploded and archive dropped.');
                } else {
                    console.log('Archive collection was empty.');
                    await Archive.drop();
                }
            }
        } catch (archiveErr) {
            console.log('De-bucketing note:', archiveErr.message);
        }

        console.log('--- UNDO COMPLETE ---');
        console.log('System is back to original state.');
        process.exit(0);
    } catch (err) {
        console.error('CRITICAL ERROR DURING UNDO:', err.stack);
        process.exit(1);
    }
};

undoOptimization();
