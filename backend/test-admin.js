const express = require('express');
const app = express();

// Mock middleware
const mockAuth = (req, res, next) => {
  req.user = { id: 1, role: 'admin' };
  next();
};

// Import admin routes
const adminRoutes = require('./src/routes/admin');

app.use(express.json());
app.use('/admin', mockAuth, adminRoutes);

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Admin routes test server running' });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Admin test server running on port ${PORT}`);
});