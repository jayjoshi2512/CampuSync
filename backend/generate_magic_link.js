/**
 * Script to generate a magic login link for demo alumni
 * Run: node generate_magic_link.js
 */

require('dotenv').config();
const { User } = require('./models');
const { signMagicLinkToken } = require('./utils/jwtFactory');
const redis = require('./config/redis');

async function generateMagicLink () {
    try {
        const user = await User.scope('withInactive').findOne({
            where: { email: 'alumni-demo@example.com' },
        });

        if(!user) {
            console.error('❌ Demo alumni user not found. Run create_demo_alumni.js first.');
            process.exit(1);
        }

        if(user.role !== 'alumni') {
            console.error('⚠️  User is not an alumni:', { email: user.email, role: user.role });
            process.exit(1);
        }

        // Generate magic link token
        const magicToken = signMagicLinkToken(user.id, user.organization_id);

        // Store in Redis with 15 min TTL
        await redis.set(`magic_link:${ magicToken }`, user.id.toString(), 900);

        const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
        const loginLink = `${ appBaseUrl }/portal?magic=${ magicToken }`;
        const alumniLink = `${ appBaseUrl }/alumni?magic=${ magicToken }`;

        console.log('\n✅ Magic login links generated!\n');
        console.log('📧 Demo Alumni Account:');
        console.log('   Email:', user.email);
        console.log('   Name:', user.name);
        console.log('   Role:', user.role);
        console.log('   Organization ID:', user.organization_id);
        console.log('\n🔗 Login Links (valid for 15 minutes):\n');
        console.log('  Student Portal:');
        console.log(' ', loginLink);
        console.log('\n  Alumni Portal:');
        console.log(' ', alumniLink);
        console.log('\n📋 Quick Copy (Alumni Portal):\n');
        console.log(alumniLink);

    } catch(error) {
        console.error('❌ Error generating magic link:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

generateMagicLink();
