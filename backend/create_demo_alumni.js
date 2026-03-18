/**
 * Script to create a demo alumni user for testing
 * Run: node create_demo_alumni.js
 */

require('dotenv').config();
const { sequelize, Organization, User } = require('./models');

async function createDemoAlumni () {
    try {
        console.log('🔍 Fetching demo organization...');

        // Find any active organization
        const org = await Organization.findOne({
            where: { status: 'active', is_active: 1 },
            attributes: [ 'id', 'name', 'slug' ],
        });

        if(!org) {
            console.error('❌ No active organization found. Please create one first.');
            process.exit(1);
        }

        console.log(`✅ Using organization: "${ org.name }" (ID: ${ org.id })`);

        // Check if demo alumni already exists
        const existing = await User.scope('withInactive').findOne({
            where: {
                email: 'alumni-demo@example.com',
                organization_id: org.id,
            },
        });

        if(existing) {
            console.log('⚠️  Demo alumni user already exists:', existing.email);
            console.log('   ID:', existing.id);
            console.log('   Role:', existing.role);
            return;
        }

        // Create demo alumni user
        const demoAlumni = await User.create({
            organization_id: org.id,
            name: 'Demo Alumni',
            email: 'alumni-demo@example.com',
            branch: 'Computer Science',
            batch_year: 2020,
            role: 'alumni',
            is_active: 1,
            avatar_url: null,
            linkedin_url: null,
            github_url: null,
            twitter_url: null,
            instagram_url: null,
            website_url: null,
            bio: 'Demo alumni account for testing the alumni portal',
        });

        console.log('✅ Demo alumni user created successfully!');
        console.log('   Email:', demoAlumni.email);
        console.log('   Name:', demoAlumni.name);
        console.log('   Role:', demoAlumni.role);
        console.log('   ID:', demoAlumni.id);
        console.log('\n📌 To test alumni portal:');
        console.log('   1. Go to http://localhost:5173/register/alumni');
        console.log('   2. Or directly access http://localhost:5173/alumni (will redirect to login)');
        console.log('   3. Log in with:');
        console.log('      Email: alumni-demo@example.com');
        console.log('      (Note: Use magic link or set password first)');

    } catch(error) {
        console.error('❌ Error creating demo alumni:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

createDemoAlumni();
