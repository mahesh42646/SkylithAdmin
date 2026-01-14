const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Role = require('../schemas/roleSchema');

dotenv.config();

const seedRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Check if roles already exist
    const existingRoles = await Role.find();
    if (existingRoles.length > 0) {
      console.log('Roles already exist. Skipping seed.');
      process.exit(0);
    }

    // Create default roles with some example sub-roles
    const roles = [
      {
        name: 'admin',
        displayName: 'Admin',
        description: 'Full system access',
        defaultPermissions: [],
        subRoles: []
      },
      {
        name: 'management',
        displayName: 'Management',
        description: 'Team oversight and management',
        defaultPermissions: [],
        subRoles: [
          {
            name: 'Senior Manager',
            description: 'Senior management level',
            permissions: []
          },
          {
            name: 'Department Head',
            description: 'Head of department',
            permissions: []
          }
        ]
      },
      {
        name: 'team_member',
        displayName: 'Team Member',
        description: 'Regular team member',
        defaultPermissions: [],
        subRoles: [
          {
            name: 'Team Lead',
            description: 'Team leader',
            permissions: []
          },
          {
            name: 'Senior Developer',
            description: 'Senior level developer',
            permissions: []
          },
          {
            name: 'Junior Developer',
            description: 'Junior level developer',
            permissions: []
          }
        ]
      }
    ];

    for (const roleData of roles) {
      await Role.create(roleData);
      console.log(`Created role: ${roleData.displayName}`);
    }

    console.log('Default roles and sub-roles created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding roles:', error);
    process.exit(1);
  }
};

seedRoles();


