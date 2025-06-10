const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NewsEvent = sequelize.define('NewsEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [1, 255]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('news', 'event', 'tasting', 'meeting', 'announcement'),
    allowNull: false,
    defaultValue: 'news'
  },
  event_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  event_end_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    }
  },
  current_attendees: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    }
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_published: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {}
  },
  rsvp_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  rsvp_deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  contact_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  contact_phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  tableName: 'news_events',
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['is_published']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['event_date']
    },
    {
      fields: ['published_at']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Virtual fields
NewsEvent.prototype.getStatus = function() {
  if (!this.is_published) return 'draft';
  
  if (this.type === 'event' && this.event_date) {
    const now = new Date();
    const eventDate = new Date(this.event_date);
    
    if (eventDate < now) return 'past';
    if (eventDate > now) return 'upcoming';
    return 'active';
  }
  
  return 'published';
};

NewsEvent.prototype.isRsvpOpen = function() {
  if (!this.rsvp_required || this.type !== 'event') return false;
  
  const now = new Date();
  
  if (this.rsvp_deadline && new Date(this.rsvp_deadline) < now) {
    return false;
  }
  
  if (this.event_date && new Date(this.event_date) < now) {
    return false;
  }
  
  if (this.capacity && this.current_attendees >= this.capacity) {
    return false;
  }
  
  return true;
};

NewsEvent.prototype.getSpotsRemaining = function() {
  if (!this.capacity) return null;
  return Math.max(0, this.capacity - this.current_attendees);
};

// Hooks
NewsEvent.beforeCreate(async (newsEvent) => {
  if (newsEvent.is_published && !newsEvent.published_at) {
    newsEvent.published_at = new Date();
  }
});

NewsEvent.beforeUpdate(async (newsEvent) => {
  if (newsEvent.changed('is_published') && newsEvent.is_published && !newsEvent.published_at) {
    newsEvent.published_at = new Date();
  }
});

// Class methods
NewsEvent.associate = function(models) {
  NewsEvent.belongsTo(models.User, {
    foreignKey: 'created_by',
    as: 'author'
  });
  
  // For future RSVP functionality
  NewsEvent.belongsToMany(models.User, {
    through: 'EventRSVPs',
    foreignKey: 'event_id',
    otherKey: 'user_id',
    as: 'attendees'
  });
};

module.exports = NewsEvent;
