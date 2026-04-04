const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const debug = async () => {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Successfully connected to MongoDB');
        
        const count = await User.countDocuments({});
        console.log('Current user count:', count);
        
        const users = await User.find({}).select('-password');
        console.log('Registered Users:', JSON.stringify(users, null, 2));
        
        process.exit();
    } catch (err) {
        console.error('DEBUG ERROR:', err.message);
        process.exit(1);
    }
};

debug();
