const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EventRSVP = sequelize.define('EventRSVP', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  event_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'news_events',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('attending', 'maybe', 'declined'),
    allowNull: false,
    defaultValue: 'attending'
  },
  guests_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 10
    }
  },
  dietary_requirements: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rsvp_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'event_rsvps',
  indexes: [
    {
      unique: true,
      fields: ['event_id', 'user_id'],
      name: 'unique_event_user_rsvp'
    },
    {
      fields: ['status']
    },
    {
      fields: ['rsvp_date']
    }
  ]
});

// Hooks to update attendee count
EventRSVP.afterCreate(async (rsvp) => {
  if (rsvp.status === 'attending') {
    const NewsEvent = require('./NewsEvent');
    const event = await NewsEvent.findByPk(rsvp.event_id);
    if (event) {
      event.current_attendees += (1 + rsvp.guests_count);
      await event.save();
    }
  }
});

EventRSVP.afterUpdate(async (rsvp) => {
  const NewsEvent = require('./NewsEvent');
  const event = await NewsEvent.findByPk(rsvp.event_id);
  if (event) {
    // Recalculate attendee count
    const attendingCount = await EventRSVP.sum('guests_count', {
      where: { 
        event_id: rsvp.event_id, 
        status: 'attending' 
      }
    }) || 0;
    
    const attendingRSVPs = await EventRSVP.count({
      where: { 
        event_id: rsvp.event_id, 
        status: 'attending' 
      }
    });
    
    event.current_attendees = attendingRSVPs + attendingCount;
    await event.save();
  }
});

EventRSVP.afterDestroy(async (rsvp) => {
  const NewsEvent = require('./NewsEvent');
  const event = await NewsEvent.findByPk(rsvp.event_id);
  if (event && rsvp.status === 'attending') {
    event.current_attendees -= (1 + rsvp.guests_count);
    await event.save();
  }
});

// Class methods
EventRSVP.associate = function(models) {
  EventRSVP.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  
  EventRSVP.belongsTo(models.NewsEvent, {
    foreignKey: 'event_id',
    as: 'event'
  });
};

module.exports = EventRSVP;
