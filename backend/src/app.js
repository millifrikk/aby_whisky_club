require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Import database and models
const { testConnection, syncDatabase } = require('./models');
const initializeDatabase = require('./utils/initializeDatabase');

// Import routes
const authRoutes = require('./routes/auth');
const whiskyRoutes = require('./routes/whiskies');
const distilleryRoutes = require('./routes/distilleries');
const ratingRoutes = require('./routes/ratings');
const newsEventRoutes = require('./routes/newsEvents');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Åby Whisky Club API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/whiskies', whiskyRoutes);
app.use('/api/distilleries', distilleryRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/news-events', newsEventRoutes);
app.use('/api/admin', adminRoutes);

// Basic API info
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Åby Whisky Club API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
        logout: 'POST /api/auth/logout'
      },
      whiskies: {
        list: 'GET /api/whiskies',
        featured: 'GET /api/whiskies/featured',
        stats: 'GET /api/whiskies/stats',
        details: 'GET /api/whiskies/:id',
        create: 'POST /api/whiskies (Admin)',
        update: 'PUT /api/whiskies/:id (Admin)',
        delete: 'DELETE /api/whiskies/:id (Admin)'
      },
      distilleries: {
        list: 'GET /api/distilleries',
        stats: 'GET /api/distilleries/stats',
        details: 'GET /api/distilleries/:id',
        create: 'POST /api/distilleries (Admin)',
        update: 'PUT /api/distilleries/:id (Admin)',
        delete: 'DELETE /api/distilleries/:id (Admin)',
        populate: 'POST /api/distilleries/populate/api (Admin)',
        update_counts: 'POST /api/distilleries/update-counts (Admin)'
      },
      ratings: {
        whisky_ratings: 'GET /api/ratings/whisky/:whisky_id',
        user_ratings: 'GET /api/ratings/user/:user_id',
        top_whiskies: 'GET /api/ratings/top-whiskies',
        recent: 'GET /api/ratings/recent',
        create: 'POST /api/ratings (Member)',
        details: 'GET /api/ratings/:id',
        delete: 'DELETE /api/ratings/:id (Owner/Admin)'
      },
      news_events: {
        list: 'GET /api/news-events',
        upcoming: 'GET /api/news-events/upcoming',
        featured: 'GET /api/news-events/featured',
        details: 'GET /api/news-events/:id',
        create: 'POST /api/news-events (Admin)',
        update: 'PUT /api/news-events/:id (Admin)',
        delete: 'DELETE /api/news-events/:id (Admin)',
        rsvp: 'POST /api/news-events/:event_id/rsvp (Member)',
        attendees: 'GET /api/news-events/:event_id/attendees'
      }
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    available_endpoints: '/api'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  // Default error
  let error = {
    message: 'Internal Server Error',
    status: 500
  };

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    error = {
      message: 'Validation Error',
      status: 400,
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    };
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    error = {
      message: 'Duplicate entry',
      status: 409,
      details: err.errors.map(e => ({
        field: e.path,
        message: `${e.path} already exists`
      }))
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      status: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      status: 401
    };
  }

  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: error.details 
    }),
    ...(error.details && { details: error.details })
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database (test connection, sync schema, seed if needed)
    await initializeDatabase();
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Åby Whisky Club API server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🗄️  Database: Connected and ready`);
      console.log(`🔗 API Documentation: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();
