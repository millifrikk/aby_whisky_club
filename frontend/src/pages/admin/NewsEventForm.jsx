import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { newsEventAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../utils/currency';
import toast from 'react-hot-toast';

const NewsEventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { symbol: currencySymbol } = useCurrency();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'event',
    event_date: '',
    event_end_date: '',
    location: '',
    address: '',
    capacity: '',
    price: '',
    contact_email: '',
    contact_phone: '',
    rsvp_required: false,
    rsvp_deadline: '',
    is_published: false,
    is_featured: false,
    image_url: '',
    tags: []
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isEditing) {
      loadNewsEvent();
    }
  }, [id, isEditing]);

  const loadNewsEvent = async () => {
    try {
      setInitialLoading(true);
      const response = await newsEventAPI.getById(id);
      const item = response.data.newsEvent;
      
      setFormData({
        title: item.title || '',
        content: item.content || '',
        type: item.type || 'event',
        event_date: item.event_date ? new Date(item.event_date).toISOString().slice(0, 16) : '',
        event_end_date: item.event_end_date ? new Date(item.event_end_date).toISOString().slice(0, 16) : '',
        location: item.location || '',
        address: item.address || '',
        capacity: item.capacity || '',
        price: item.price || '',
        contact_email: item.contact_email || '',
        contact_phone: item.contact_phone || '',
        rsvp_required: item.rsvp_required || false,
        rsvp_deadline: item.rsvp_deadline ? new Date(item.rsvp_deadline).toISOString().slice(0, 16) : '',
        is_published: item.is_published || false,
        is_featured: item.is_featured || false,
        image_url: item.image_url || '',
        tags: item.tags || []
      });
    } catch (error) {
      console.error('Error loading news/event:', error);
      toast.error('Failed to load item');
      navigate('/admin');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.content.trim()) {
      toast.error('Content is required');
      return;
    }

    if (isEventType() && formData.rsvp_required && !formData.event_date) {
      toast.error('Event date is required for RSVP events');
      return;
    }

    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        price: formData.price ? parseFloat(formData.price) : null,
        event_date: formData.event_date ? new Date(formData.event_date).toISOString() : null,
        event_end_date: formData.event_end_date ? new Date(formData.event_end_date).toISOString() : null,
        rsvp_deadline: formData.rsvp_deadline ? new Date(formData.rsvp_deadline).toISOString() : null,
        created_by: user?.id
      };

      if (isEditing) {
        await newsEventAPI.update(id, submitData);
        toast.success('Item updated successfully');
      } else {
        await newsEventAPI.create(submitData);
        toast.success('Item created successfully');
      }
      
      navigate('/admin');
    } catch (error) {
      console.error('Error saving:', error);
      const message = error.response?.data?.message || 'Failed to save item';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isEventType = () => {
    return ['event', 'tasting', 'meeting'].includes(formData.type);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link
            to="/admin"
            className="text-amber-600 hover:text-amber-700 mr-4"
          >
            ← Back to Admin
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit' : 'Create'} {formData.type === 'news' ? 'News Article' : 'Event'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEditing ? 'Update' : 'Create'} {isEventType() ? 'event information and settings' : 'news content'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white shadow rounded-lg p-6">
          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  required
                >
                  <option value="event">Event</option>
                  <option value="tasting">Whisky Tasting</option>
                  <option value="meeting">Club Meeting</option>
                  <option value="news">News Article</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>

              {/* Publishing Status */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Publishing Options
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => handleInputChange('is_published', e.target.checked)}
                      className="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Published</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => handleInputChange('is_featured', e.target.checked)}
                      className="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="Enter a compelling title"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={8}
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder={isEventType() ? "Describe the event details, what attendees can expect, agenda, etc." : "Write your news article or announcement content"}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.content.length}/2000 characters
              </p>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                placeholder="https://example.com/image.jpg"
              />
              {formData.image_url && (
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="mt-2 h-32 w-48 object-cover rounded border"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Event-Specific Fields */}
        {isEventType() && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                Event Details
              </h2>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => handleInputChange('event_date', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.event_end_date}
                    onChange={(e) => handleInputChange('event_end_date', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Venue name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Full address"
                  />
                </div>
              </div>

              {/* Capacity & Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Maximum attendees"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    placeholder="contact@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RSVP Settings */}
        {isEventType() && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="space-y-6">
              <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                RSVP Settings
              </h2>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.rsvp_required}
                    onChange={(e) => handleInputChange('rsvp_required', e.target.checked)}
                    className="rounded border-gray-300 text-amber-600 shadow-sm focus:border-amber-300 focus:ring focus:ring-amber-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Require RSVP for this event</span>
                </label>
              </div>

              {formData.rsvp_required && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RSVP Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.rsvp_deadline}
                    onChange={(e) => handleInputChange('rsvp_deadline', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deadline for users to RSVP. Leave empty for no deadline.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Tags
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Tags
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Enter a tag and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Add
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-amber-600 hover:text-amber-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          <Link
            to="/admin"
            className="bg-gray-300 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-600 text-white py-2 px-6 rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update' : 'Create')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewsEventForm;