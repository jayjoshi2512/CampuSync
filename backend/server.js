// backend/server.js
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

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
function toOrigin (value) {
    if(!value) return null;
    try {
        return new URL(value).origin;
    } catch {
        return null;
    }
}
function parseOrigins (csvValue) {
    if(!csvValue) return [];
    return csvValue
        .split(',')
        .map((item) => toOrigin(item.trim()))
        .filter(Boolean);
}

const allowedOrigins = [ ...new Set([
    process.env.APP_BASE_URL,
    process.env.FRONTEND_URL,
    process.env.FRONTEND_BASE_URL,
    process.env.WEB_BASE_URL,
    'https://campusync-six.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    ...parseOrigins(process.env.CORS_ORIGINS),
].map(toOrigin).filter(Boolean)) ];

function isAllowedOrigin (origin) {
    if(!origin) return true;
    if(allowedOrigins.includes(origin)) return true;
    if(/^https:\/\/campusync-[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
    if(/^https:\/\/[a-z0-9-]+-campusync\.vercel\.app$/i.test(origin)) return true;
    return false;
}

const corsOptions = {
    origin: function(origin, callback) {
        if(isAllowedOrigin(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: [ 'GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS' ],
    allowedHeaders: [ 'Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin' ],
    optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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

        // Run SuperAdmin Seeder
        const seedSuperAdmin = require('./src/utils/seedSuperAdmin');
        await seedSuperAdmin();

        // Create HTTP server and Socket.io instance
        const server = http.createServer(app);
        const io = new Server(server, {
            cors: {
                origin: allowedOrigins,
                methods: [ 'GET', 'POST' ],
                credentials: true,
            },
            transports: [ 'websocket', 'polling' ],
        });

        // Attach io to app for use in routes/controllers
        app.set('io', io);

        // Socket.io middleware for JWT authentication
        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[ 1 ];
                if(!token) {
                    return next(new Error('No token provided'));
                }
                // Token will be verified when joining rooms based on user role/org
                socket.token = token;
                next();
            } catch(err) {
                next(new Error('Authentication failed'));
            }
        });

        // Socket.io connection handler
        io.on('connection', (socket) => {
            console.log(`[Socket.io] User connected: ${ socket.id }`);

            // Users join rooms by their role/org (sent from client)
            socket.on('join-user-room', (data) => {
                const { userId, role } = data;
                socket.userId = userId;
                socket.role = role;
                socket.join(`user:${ userId }`);
                socket.join(`role:${ role }`);
                console.log(`[Socket.io] ${ socket.id } joined user:${ userId } and role:${ role }`);
            });

            socket.on('disconnect', () => {
                console.log(`[Socket.io] User disconnected: ${ socket.id }`);
            });
        });

        server.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${ PORT }`);
            console.log(`   WebSocket: wss://campusync-api.unicodetechnolab.site`);
            logger.info(`🚀 Server running on http://localhost:${ PORT }`);
            logger.info(`   Environment: ${ process.env.NODE_ENV || 'development' }`);
            logger.info(`   Frontend:    ${ process.env.APP_BASE_URL || 'http://localhost:5173' }`);
            logger.info(`   Health:      http://localhost:${ PORT }/api/health`);
            logger.info(`   WebSocket:   wss://campusync-api.unicodetechnolab.site`);
            logger.info(`   Allowed CORS origins: ${ allowedOrigins.join(', ') }`);
        });
    } catch(err) {
        logger.error('Failed to start server:', err.message);
        logger.error(err.stack);
        process.exit(1);
    }
}

startServer();

module.exports = app;

