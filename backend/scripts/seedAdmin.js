const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../schemas/userSchema');
const { getDefaultPermissions } = require('../utils/permissions');

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Check if admin exists
    const adminExists = await User.findOne({ email: 'admin@gmail.com' });
    
    if (adminExists) {
      console.log('Admin user already exists');
      // Update password and permissions
      adminExists.password = 'admin@123';
      adminExists.permissions = getDefaultPermissions('admin');
      await adminExists.save();
      console.log('Admin password and permissions updated');
      console.log('Total permissions:', adminExists.permissions.length);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: 'admin@123',
      role: 'admin',
      status: 'active',
      department: 'IT',
      permissions: getDefaultPermissions('admin')
    });

    console.log('Admin user created successfully:');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin@123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();

