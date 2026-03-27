// backend/server.js
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { connectDB, logger } = require('./config/database');
const { handleWebhook } = require('./src/modules/billing/billing.controller');
const { generalApi } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// TRUST PROXY (for correct IP detection behind reverse proxy / SSL)
// ============================================
app.set('trust proxy', 1);

// ============================================
// SECURITY HEADERS
// ============================================
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
}));

// ============================================
// CORS
// ============================================
const allowedOrigins = [
    process.env.APP_BASE_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5174',
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (server-to-server, mobile apps, curl)
        if(!origin) return callback(null, true);
        if(allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: [ 'GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS' ],
    allowedHeaders: [ 'Content-Type', 'Authorization' ],
}));

// ============================================
// RAZORPAY WEBHOOK — MUST be before express.json()
// Requires raw body for signature verification
// ============================================
app.post('/api/billing/webhook',
    express.raw({ type: 'application/json' }),
    handleWebhook
);

// ============================================
// BODY PARSERS
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============================================
// LOGGING
// ============================================
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// ============================================
// RATE LIMITING (general — SSE stream is exempt, persistent connections must not burn the quota)
// ============================================
app.use('/api', (req, res, next) => {
    if(req.path === '/notifications/stream') return next();
    return generalApi(req, res, next);
});

// ============================================
// IMPORT ROUTES
// ============================================
const registrationRoutes = require('./src/modules/organizations/registration.routes');
const superAdminAuthRoutes = require('./src/modules/auth/superAdminAuth.routes');
const superAdminDashboardRoutes = require('./src/modules/superadmin/superAdminDashboard.routes');
const adminAuthRoutes = require('./src/modules/auth/adminAuth.routes');
const adminDashboardRoutes = require('./src/modules/admin/adminDashboard.routes');
const userAuthRoutes = require('./src/modules/auth/userAuth.routes');
const cardRoutes = require('./src/modules/cards/cards.routes');
const memoryRoutes = require('./src/modules/memories/memories.routes');
const reactionRoutes = require('./src/modules/memories/reactions.routes');
const notificationRoutes = require('./src/modules/notifications/notifications.routes');
const profileRoutes = require('./src/modules/users/profile.routes');
const billingRoutes = require('./src/modules/billing/billing.routes');
const featureRoutes = require('./src/modules/features/features.routes');
const mentorshipRoutes = require('./src/modules/mentorship/mentorship.routes');

// ============================================
// MOUNT ROUTES
// ============================================
app.use('/api/register', registrationRoutes);
app.use('/api/super-admin', superAdminAuthRoutes);
app.use('/api/super-admin', superAdminDashboardRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/user', userAuthRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user/profile', profileRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/mentorship', mentorshipRoutes);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
    });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${ req.method } ${ req.originalUrl } not found.`,
    });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.originalUrl,
        method: req.method,
    });

    if(err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'CORS: Origin not allowed.' });
    }

    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error.',
    });
});

// ============================================
// DATABASE SYNC + SERVER START
// ============================================
async function startServer () {
    try {
        // Connect to MongoDB
        await connectDB();

        // Import all models to ensure schemas are registered
        require('./src/modules/models');

        app.listen(PORT, () => {
            logger.info(`🚀 Server running on http://localhost:${ PORT }`);
            logger.info(`   Environment: ${ process.env.NODE_ENV || 'development' }`);
            logger.info(`   Frontend:    ${ process.env.APP_BASE_URL || 'http://localhost:5173' }`);
            logger.info(`   Health:      http://localhost:${ PORT }/api/health`);
        });
    } catch(err) {
        logger.error('Failed to start server:', err.message);
        logger.error(err.stack);
        process.exit(1);
    }
}

startServer();

module.exports = app;

