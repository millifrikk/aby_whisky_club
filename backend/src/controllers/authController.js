const { User } = require('../models');
const { generateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

class AuthController {
  // User registration
  static async register(req, res) {
    try {
      const { username, email, password, first_name, last_name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { email: email },
            { username: username }
          ]
        }
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: existingUser.email === email 
            ? 'Email is already registered' 
            : 'Username is already taken'
        });
      }

      // Create new user
      const user = await User.create({
        username,
        email,
        password_hash: password, // Will be hashed by the model hook
        first_name,
        last_name,
        role: 'member' // Default role
      });

      // Generate token
      const token = generateToken({ 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      });

      // Update last login
      await user.update({ last_login: new Date() });

      res.status(201).json({
        message: 'User registered successfully',
        user: user.toSafeObject(),
        token
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: 'An error occurred during registration'
      });
    }
  }

  // User login
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ 
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid email or password'
        });
      }

      // Check if account is active
      if (!user.is_active) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Account is inactive. Please contact an administrator.'
        });
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid email or password'
        });
      }

      // Generate token
      const token = generateToken({ 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      });

      // Update last login
      await user.update({ last_login: new Date() });

      res.json({
        message: 'Login successful',
        user: user.toSafeObject(),
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: 'An error occurred during login'
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password_hash'] },
        include: [
          {
            model: require('../models').Rating,
            as: 'ratings',
            limit: 5,
            order: [['created_at', 'DESC']],
            include: [
              {
                model: require('../models').Whisky,
                as: 'whisky',
                attributes: ['id', 'name', 'distillery']
              }
            ]
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      res.json({
        user: user.toJSON()
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Failed to fetch profile',
        message: 'An error occurred while fetching user profile'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const { first_name, last_name, bio, whisky_preferences } = req.body;
      
      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      // Update allowed fields
      const updatedUser = await user.update({
        first_name,
        last_name,
        bio,
        whisky_preferences
      });

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser.toSafeObject()
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Failed to update profile',
        message: 'An error occurred while updating profile'
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      const { current_password, new_password } = req.body;
      
      const user = await User.findByPk(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User not found'
        });
      }

      // Validate current password
      const isValidPassword = await user.validatePassword(current_password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Current password is incorrect'
        });
      }

      // Update password
      await user.update({ password_hash: new_password });

      res.json({
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        error: 'Failed to change password',
        message: 'An error occurred while changing password'
      });
    }
  }

  // Logout (for future session management)
  static async logout(req, res) {
    try {
      // For JWT, logout is mainly handled client-side by removing the token
      // But we can add session invalidation here if using Redis sessions
      
      res.json({
        message: 'Logout successful'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred during logout'
      });
    }
  }

  // Refresh token
  static async refreshToken(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password_hash'] }
      });

      if (!user || !user.is_active) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'User not found or inactive'
        });
      }

      // Generate new token
      const token = generateToken({ 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      });

      res.json({
        message: 'Token refreshed successfully',
        user: user.toJSON(),
        token
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        error: 'Token refresh failed',
        message: 'An error occurred while refreshing token'
      });
    }
  }
}

module.exports = AuthController;
