const { NewsEvent, User, EventRSVP } = require('../models');
const { Op } = require('sequelize');

class NewsEventController {
  // Get all news and events with filtering
  static async getAllNewsEvents(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        search,
        upcoming_only = false,
        featured_only = false,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      // Build where clause
      const where = { is_published: true };

      if (type && type !== 'all') {
        where.type = type;
      }

      if (search) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (upcoming_only === 'true') {
        where.event_date = { [Op.gte]: new Date() };
      }

      if (featured_only === 'true') {
        where.is_featured = true;
      }

      // Build order clause
      const validSortFields = ['created_at', 'published_at', 'event_date', 'title'];
      const orderField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const orderDirection = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // For events, prioritize upcoming events
      let order;
      if (type === 'event' || upcoming_only === 'true') {
        order = [['event_date', 'ASC']];
      } else {
        order = [[orderField, orderDirection]];
      }

      // Calculate pagination
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: newsEvents } = await NewsEvent.findAndCountAll({
        where,
        order,
        limit: parseInt(limit),
        offset,
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'first_name', 'last_name']
          }
        ]
      });

      const totalPages = Math.ceil(count / parseInt(limit));

      res.json({
        news_events: newsEvents,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_count: count,
          limit: parseInt(limit),
          has_next: parseInt(page) < totalPages,
          has_prev: parseInt(page) > 1
        },
        filters: {
          type,
          search,
          upcoming_only,
          featured_only
        }
      });

    } catch (error) {
      console.error('Get all news/events error:', error);
      res.status(500).json({
        error: 'Failed to fetch news and events',
        message: 'An error occurred while fetching news and events'
      });
    }
  }

  // Get single news/event by ID
  static async getNewsEventById(req, res) {
    try {
      const { id } = req.params;

      const newsEvent = await NewsEvent.findByPk(id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'first_name', 'last_name']
          }
        ]
      });

      if (!newsEvent) {
        return res.status(404).json({
          error: 'News/Event not found',
          message: 'The requested news/event could not be found'
        });
      }

      // Check if published or user is admin/author
      if (!newsEvent.is_published) {
        if (!req.user || (req.user.role !== 'admin' && req.user.id !== newsEvent.created_by)) {
          return res.status(404).json({
            error: 'News/Event not found',
            message: 'The requested news/event could not be found'
          });
        }
      }

      // Add computed fields
      const responseData = {
        ...newsEvent.toJSON(),
        status: newsEvent.getStatus(),
        rsvp_open: newsEvent.isRsvpOpen(),
        spots_remaining: newsEvent.getSpotsRemaining()
      };

      // If user is logged in and this is an event, check RSVP status
      if (req.user && newsEvent.type === 'event') {
        const rsvp = await EventRSVP.findOne({
          where: {
            event_id: id,
            user_id: req.user.id
          }
        });
        responseData.user_rsvp = rsvp ? rsvp.toJSON() : null;
      }

      res.json({ news_event: responseData });

    } catch (error) {
      console.error('Get news/event by ID error:', error);
      res.status(500).json({
        error: 'Failed to fetch news/event',
        message: 'An error occurred while fetching the news/event'
      });
    }
  }

  // Create news/event (Admin only)
  static async createNewsEvent(req, res) {
    try {
      const newsEventData = {
        ...req.body,
        created_by: req.user.id
      };

      const newsEvent = await NewsEvent.create(newsEventData);

      // Fetch complete news/event with author
      const completeNewsEvent = await NewsEvent.findByPk(newsEvent.id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'first_name', 'last_name']
          }
        ]
      });

      res.status(201).json({
        message: 'News/Event created successfully',
        news_event: completeNewsEvent
      });

    } catch (error) {
      console.error('Create news/event error:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        error: 'Failed to create news/event',
        message: 'An error occurred while creating the news/event'
      });
    }
  }

  // Update news/event (Admin only)
  static async updateNewsEvent(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const newsEvent = await NewsEvent.findByPk(id);

      if (!newsEvent) {
        return res.status(404).json({
          error: 'News/Event not found',
          message: 'The requested news/event could not be found'
        });
      }

      const updatedNewsEvent = await newsEvent.update(updateData);

      // Fetch complete updated news/event
      const completeNewsEvent = await NewsEvent.findByPk(updatedNewsEvent.id, {
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'first_name', 'last_name']
          }
        ]
      });

      res.json({
        message: 'News/Event updated successfully',
        news_event: completeNewsEvent
      });

    } catch (error) {
      console.error('Update news/event error:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        error: 'Failed to update news/event',
        message: 'An error occurred while updating the news/event'
      });
    }
  }

  // Delete news/event (Admin only)
  static async deleteNewsEvent(req, res) {
    try {
      const { id } = req.params;

      const newsEvent = await NewsEvent.findByPk(id);

      if (!newsEvent) {
        return res.status(404).json({
          error: 'News/Event not found',
          message: 'The requested news/event could not be found'
        });
      }

      await newsEvent.destroy();

      res.json({
        message: 'News/Event deleted successfully'
      });

    } catch (error) {
      console.error('Delete news/event error:', error);
      res.status(500).json({
        error: 'Failed to delete news/event',
        message: 'An error occurred while deleting the news/event'
      });
    }
  }

  // RSVP to an event
  static async rsvpToEvent(req, res) {
    try {
      const { event_id } = req.params;
      const { status = 'attending', guests_count = 0, dietary_requirements, notes } = req.body;

      // Verify event exists and is an event type
      const event = await NewsEvent.findByPk(event_id);
      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          message: 'The specified event could not be found'
        });
      }

      if (event.type !== 'event') {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'RSVP is only available for events'
        });
      }

      if (!event.rsvp_required) {
        return res.status(400).json({
          error: 'RSVP not required',
          message: 'This event does not require RSVP'
        });
      }

      if (!event.isRsvpOpen()) {
        return res.status(400).json({
          error: 'RSVP closed',
          message: 'RSVP is no longer available for this event'
        });
      }

      // Check if user already has an RSVP
      const existingRsvp = await EventRSVP.findOne({
        where: {
          event_id,
          user_id: req.user.id
        }
      });

      let rsvp;
      if (existingRsvp) {
        // Update existing RSVP
        rsvp = await existingRsvp.update({
          status,
          guests_count,
          dietary_requirements,
          notes,
          rsvp_date: new Date()
        });
      } else {
        // Create new RSVP
        rsvp = await EventRSVP.create({
          event_id,
          user_id: req.user.id,
          status,
          guests_count,
          dietary_requirements,
          notes
        });
      }

      // Fetch complete RSVP with user and event
      const completeRsvp = await EventRSVP.findByPk(rsvp.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'first_name', 'last_name']
          },
          {
            model: NewsEvent,
            as: 'event',
            attributes: ['id', 'title', 'event_date', 'current_attendees', 'capacity']
          }
        ]
      });

      res.json({
        message: existingRsvp ? 'RSVP updated successfully' : 'RSVP created successfully',
        rsvp: completeRsvp
      });

    } catch (error) {
      console.error('RSVP error:', error);
      res.status(500).json({
        error: 'Failed to process RSVP',
        message: 'An error occurred while processing your RSVP'
      });
    }
  }

  // Get event attendees
  static async getEventAttendees(req, res) {
    try {
      const { event_id } = req.params;

      // Verify event exists
      const event = await NewsEvent.findByPk(event_id);
      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          message: 'The specified event could not be found'
        });
      }

      const attendees = await EventRSVP.findAll({
        where: {
          event_id,
          status: 'attending'
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'first_name', 'last_name']
          }
        ],
        order: [['rsvp_date', 'ASC']]
      });

      const attendeeStats = await EventRSVP.findAll({
        where: { event_id },
        attributes: [
          'status',
          [EventRSVP.sequelize.fn('COUNT', EventRSVP.sequelize.col('id')), 'count'],
          [EventRSVP.sequelize.fn('SUM', EventRSVP.sequelize.col('guests_count')), 'guests']
        ],
        group: ['status'],
        raw: true
      });

      res.json({
        event: {
          id: event.id,
          title: event.title,
          event_date: event.event_date,
          capacity: event.capacity,
          current_attendees: event.current_attendees
        },
        attendees,
        statistics: attendeeStats.reduce((acc, stat) => {
          acc[stat.status] = {
            count: parseInt(stat.count),
            guests: parseInt(stat.guests) || 0
          };
          return acc;
        }, {})
      });

    } catch (error) {
      console.error('Get event attendees error:', error);
      res.status(500).json({
        error: 'Failed to fetch attendees',
        message: 'An error occurred while fetching event attendees'
      });
    }
  }

  // Get upcoming events
  static async getUpcomingEvents(req, res) {
    try {
      const { limit = 5 } = req.query;

      const upcomingEvents = await NewsEvent.findAll({
        where: {
          type: 'event',
          is_published: true,
          event_date: { [Op.gte]: new Date() }
        },
        order: [['event_date', 'ASC']],
        limit: parseInt(limit),
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'first_name', 'last_name']
          }
        ]
      });

      res.json({ events: upcomingEvents });

    } catch (error) {
      console.error('Get upcoming events error:', error);
      res.status(500).json({
        error: 'Failed to fetch upcoming events',
        message: 'An error occurred while fetching upcoming events'
      });
    }
  }

  // Get featured content
  static async getFeaturedContent(req, res) {
    try {
      const { limit = 3 } = req.query;

      const featuredContent = await NewsEvent.findAll({
        where: {
          is_published: true,
          is_featured: true
        },
        order: [['published_at', 'DESC']],
        limit: parseInt(limit),
        include: [
          {
            model: User,
            as: 'author',
            attributes: ['id', 'username', 'first_name', 'last_name']
          }
        ]
      });

      res.json({ featured_content: featuredContent });

    } catch (error) {
      console.error('Get featured content error:', error);
      res.status(500).json({
        error: 'Failed to fetch featured content',
        message: 'An error occurred while fetching featured content'
      });
    }
  }
}

module.exports = NewsEventController;
