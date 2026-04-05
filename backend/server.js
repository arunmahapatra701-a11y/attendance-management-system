const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const compression = require('compression');
const morgan = require('morgan');

const app = express();

// LIGHTNING PERFORMANCE: Use Gzip compression for all JSON responses
app.use(compression());
// MONITORING: Log API request speeds to detect slowdowns
app.use(morgan('dev'));

app.use(cors());
app.use(express.json());

// Step 1: Tell Backend to serve Frontend files (built via npm run build)
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Global error handling middleware (must come BEFORE the catch-all)
app.use((err, req, res, next) => {
    console.error('Global error handler:', err.stack);
    res.status(err.status || 500).json({ message: err.message || 'Something went wrong!', error: err.message });
});

// Step 2: Handle any route not matching API by serving React's index.html
// This allows React Router to work properly on the backend.
app.use((req, res) => {
    if (!req.path.startsWith('/api/')) {
        res.sendFile(path.resolve(__dirname, '../frontend/dist/index.html'));
    } else {
        res.status(404).json({ message: 'API Endpoint not found' });
    }
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI is not defined in .env');
    process.exit(1);
}
mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('--- CONNECTED TO MONGODB ATLAS ---');
        
        // Finalize index updates
        try {
            const User = require('./models/User');
            await User.syncIndexes();
        } catch (indexErr) {
            console.log('Index sync note:', indexErr.message);
        }

        // Database Janitor Service (Monthly Auto-Cleaning)
        try {
            const { initJanitor, runMonthlyCleanup } = require('./utils/janitor');
            initJanitor();
            console.log('[JANITOR] Service online. Performing baseline check...');
            await runMonthlyCleanup(); // Run once on startup to clean old data
        } catch (janitorErr) {
            console.log('[JANITOR ERROR]:', janitorErr.message);
        }
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Database connection failed:', error.message);
        console.log('Hint: Check your .env file and ensure your IP is whitelisted in Atlas.');
    });

