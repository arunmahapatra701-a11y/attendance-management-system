const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Create Demo Admin
        await User.create({
            name: 'Demo Admin',
            email: 'admin@test.com',
            password: '123456',
            role: 'admin'
        });

        // Create Demo Teacher
        await User.create({
            name: 'Demo Teacher',
            email: 'teacher@test.com',
            password: '123456',
            role: 'teacher',
            subject: 'Computer Science'
        });

        // Create Demo Students
        await User.create([
            {
                name: 'John Student',
                email: 'john@test.com',
                password: '123456',
                role: 'student',
                rollNumber: 'ST-001'
            },
            {
                name: 'Jane Student',
                email: 'jane@test.com',
                password: '123456',
                role: 'student',
                rollNumber: 'ST-002'
            }
        ]);

        console.log('Seeding completed successfully!');
        process.exit();
    } catch (error) {
        console.error('Seeding failed:', error.message);
        process.exit(1);
    }
};

seedData();
