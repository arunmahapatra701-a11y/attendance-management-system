const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');

/**
 * DATABASE JANITOR (STAY-CLEAN ENGINE)
 * Automatically compresses data older than 1 month into buckets.
 */
const runMonthlyCleanup = async () => {
    try {
        console.log('[JANITOR] Starting automatic monthly optimization (Bucket Mode)...');
        
        const ONE_MONTH_AGO = new Date();
        ONE_MONTH_AGO.setMonth(ONE_MONTH_AGO.getMonth() - 1);
        
        // 1. Aggregate and Bucket
        const oldDataAggregated = await Attendance.aggregate([
            { $match: { date: { $lt: ONE_MONTH_AGO } } },
            {
                $group: {
                    _id: {
                        student: "$student",
                        subject: "$subject",
                        teacher: "$teacher",
                        section: "$section",
                        month: { $dateToString: { format: "%Y-%m", date: "$date" } }
                    },
                    days: { 
                        $push: { 
                            day: { $dayOfMonth: "$date" }, 
                            status: "$status",
                            originalId: "$_id" 
                        } 
                    },
                    presentCount: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
                    absentCount: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
                    lateCount: { $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] } }
                }
            }
        ]);

        if (oldDataAggregated.length > 0) {
            const archiveCollection = mongoose.connection.db.collection('attendance_archives');
            
            // LIGHTNING PERFORMANCE: Keep indexing for archives
            await archiveCollection.createIndex({ student: 1, month: -1 });
            await archiveCollection.createIndex({ teacher: 1, month: -1 });

            const bucketsToInsert = oldDataAggregated.map(bucket => ({
                student: bucket._id.student,
                subject: bucket._id.subject,
                teacher: bucket._id.teacher,
                section: bucket._id.section,
                month: bucket._id.month,
                records: bucket.days, // Standard JSON objects (Easier to manage)
                stats: {
                    present: bucket.presentCount,
                    absent: bucket.absentCount,
                    late: bucket.lateCount
                },
                archivedAt: new Date(),
                compressionMethod: "bucket-v1-auto"
            }));

            await archiveCollection.insertMany(bucketsToInsert);
            const deleteResult = await Attendance.deleteMany({ date: { $lt: ONE_MONTH_AGO } });
            console.log(`[JANITOR] Success: Compressed into ${bucketsToInsert.length} buckets. Deleted ${deleteResult.deletedCount} raw records.`);
        } else {
            console.log('[JANITOR] No old records found for cleaning.');
        }

        // 2. Index Sync (Safety check)
        await Attendance.syncIndexes();
        
    } catch (err) {
        console.error('[JANITOR ERROR]:', err.message);
    }
};

// Start the scheduler
const initJanitor = () => {
    console.log('[JANITOR] Database Janitor Service Initialized (Monthly Bucket Mode)');
    
    // Auto-run once on boot for safety
    runMonthlyCleanup();

    // Check once every 24 hours
    setInterval(() => {
        const now = new Date();
        if (now.getDate() === 1 && now.getHours() === 0) {
            runMonthlyCleanup();
        }
    }, 1000 * 60 * 60);
};

module.exports = { initJanitor, runMonthlyCleanup };
