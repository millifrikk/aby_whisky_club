import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { newsEventAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../utils/currency';
import toast from 'react-hot-toast';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const [item, setItem] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [userRSVP, setUserRSVP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [showRSVPForm, setShowRSVPForm] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({
    status: 'attending',
    guests_count: 0,
    dietary_requirements: '',
    notes: ''
  });

  useEffect(() => {
    loadEventDetails();
  }, [id]);

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      const [eventResponse, attendeesResponse] = await Promise.allSettled([
        newsEventAPI.getById(id),
        newsEventAPI.getAttendees(id)
      ]);

      if (eventResponse.status === 'fulfilled') {
        const eventData = eventResponse.value.data.newsEvent;
        setItem(eventData);
        
        // Check if user has already RSVP'd
        if (isAuthenticated && eventData.type !== 'news' && eventData.type !== 'announcement') {
          setUserRSVP(eventData.user_rsvp || null);
          if (eventData.user_rsvp) {
            setRsvpForm({
              status: eventData.user_rsvp.status,
              guests_count: eventData.user_rsvp.guests_count || 0,
              dietary_requirements: eventData.user_rsvp.dietary_requirements || '',
              notes: eventData.user_rsvp.notes || ''
            });
          }
        }
      } else {
        toast.error('Event not found');
        navigate('/events');
        return;
      }

      if (attendeesResponse.status === 'fulfilled') {
        setAttendees(attendeesResponse.value.data.attendees || []);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please log in to RSVP');
      return;
    }

    try {
      setRsvpLoading(true);
      await newsEventAPI.rsvp(id, rsvpForm);
      toast.success('RSVP updated successfully');
      setShowRSVPForm(false);
      // Reload event details to get updated info
      await loadEventDetails();
    } catch (error) {
      console.error('Error updating RSVP:', error);
      const message = error.response?.data?.message || 'Failed to update RSVP';
      toast.error(message);
    } finally {
      setRsvpLoading(false);
    }
  };

  const getItemIcon = (type) => {
    const icons = {
      'event': '🎉',
      'tasting': '🥃',
      'meeting': '👥',
      'news': '📰',
      'announcement': '📢'
    };
    return icons[type] || '📅';
  };

  const getItemTypeLabel = (type) => {
    const labels = {
      'event': 'Event',
      'tasting': 'Whisky Tasting',
      'meeting': 'Club Meeting',
      'news': 'News',
      'announcement': 'Announcement'
    };
    return labels[type] || 'Event';
  };

  const formatEventDate = (dateString, endDateString) => {
    const startDate = new Date(dateString);
    const endDate = endDateString ? new Date(endDateString) : null;
    
    const dateOptions = { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    };
    
    const timeOptions = { 
      hour: '2-digit', 
      minute: '2-digit'
    };

    const formattedDate = startDate.toLocaleDateString('en-US', dateOptions);
    const startTime = startDate.toLocaleTimeString('en-US', timeOptions);
    
    if (endDate && endDate.toDateString() === startDate.toDateString()) {
      // Same day event
      const endTime = endDate.toLocaleTimeString('en-US', timeOptions);
      return `${formattedDate} • ${startTime} - ${endTime}`;
    } else if (endDate) {
      // Multi-day event
      const endDateFormatted = endDate.toLocaleDateString('en-US', dateOptions);
      const endTime = endDate.toLocaleTimeString('en-US', timeOptions);
      return `${formattedDate} ${startTime} - ${endDateFormatted} ${endTime}`;
    } else {
      // Single time event
      return `${formattedDate} • ${startTime}`;
    }
  };

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  const isRSVPOpen = (item) => {
    if (!item.rsvp_required) return false;
    if (item.rsvp_deadline && new Date(item.rsvp_deadline) < new Date()) return false;
    if (item.event_date && !isUpcoming(item.event_date)) return false;
    return true;
  };

  const getRSVPStatusColor = (status) => {
    const colors = {
      'attending': 'bg-green-100 text-green-800',
      'maybe': 'bg-yellow-100 text-yellow-800',
      'declined': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRSVPStatusLabel = (status) => {
    const labels = {
      'attending': 'Attending',
      'maybe': 'Maybe',
      'declined': 'Declined'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Event not found</h2>
        <p className="text-gray-600">The event you're looking for doesn't exist.</p>
        <Link to="/events" className="text-amber-600 hover:text-amber-700 mt-4 inline-block">
          ← Back to Events
        </Link>
      </div>
    );
  }

  const isEvent = item.type !== 'news' && item.type !== 'announcement';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/events"
          className="text-amber-600 hover:text-amber-700 inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </Link>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Image */}
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-64 w-full object-cover"
          />
        )}

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center">
              <span className="text-3xl mr-3">{getItemIcon(item.type)}</span>
              <div>
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide block">
                  {getItemTypeLabel(item.type)}
                </span>
                <h1 className="text-3xl font-bold text-gray-900 mt-1">{item.title}</h1>
              </div>
            </div>
            
            {item.is_featured && (
              <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-amber-100 text-amber-800">
                Featured
              </span>
            )}
          </div>

          {/* Event Details */}
          {isEvent && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-gray-50 rounded-lg">
              {/* Date & Time */}
              {item.event_date && (
                <div className="flex items-start">
                  <span className="text-xl mr-3">📅</span>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Date & Time</h3>
                    <p className="text-gray-600">
                      {formatEventDate(item.event_date, item.event_end_date)}
                    </p>
                  </div>
                </div>
              )}

              {/* Location */}
              {item.location && (
                <div className="flex items-start">
                  <span className="text-xl mr-3">📍</span>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Location</h3>
                    <p className="text-gray-600">{item.location}</p>
                    {item.address && (
                      <p className="text-sm text-gray-500">{item.address}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Price */}
              {item.price && (
                <div className="flex items-start">
                  <span className="text-xl mr-3">💰</span>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Price</h3>
                    <p className="text-gray-600">{formatPrice(item.price)}</p>
                  </div>
                </div>
              )}

              {/* Capacity */}
              {item.capacity && (
                <div className="flex items-start">
                  <span className="text-xl mr-3">👥</span>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Attendance</h3>
                    <p className="text-gray-600">
                      {item.current_attendees || 0} / {item.capacity} people
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-amber-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(((item.current_attendees || 0) / item.capacity) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact */}
              {(item.contact_email || item.contact_phone) && (
                <div className="flex items-start">
                  <span className="text-xl mr-3">📞</span>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">Contact</h3>
                    {item.contact_email && (
                      <p className="text-gray-600">
                        <a href={`mailto:${item.contact_email}`} className="text-amber-600 hover:text-amber-700">
                          {item.contact_email}
                        </a>
                      </p>
                    )}
                    {item.contact_phone && (
                      <p className="text-gray-600">
                        <a href={`tel:${item.contact_phone}`} className="text-amber-600 hover:text-amber-700">
                          {item.contact_phone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="prose max-w-none mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {isEvent ? 'Event Description' : 'Article'}
            </h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {item.content}
            </div>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block bg-amber-100 text-amber-800 text-sm px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* RSVP Section */}
          {isEvent && item.rsvp_required && (
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">RSVP</h3>
              
              {!isAuthenticated ? (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-blue-800">
                    Please <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">log in</Link> to RSVP for this event.
                  </p>
                </div>
              ) : !isRSVPOpen(item) ? (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <p className="text-gray-700">
                    {item.rsvp_deadline && new Date(item.rsvp_deadline) < new Date()
                      ? 'RSVP deadline has passed'
                      : 'RSVP is not currently available for this event'
                    }
                  </p>
                </div>
              ) : (
                <div>
                  {userRSVP && !showRSVPForm ? (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-800">
                            You are <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRSVPStatusColor(userRSVP.status)}`}>
                              {getRSVPStatusLabel(userRSVP.status)}
                            </span>
                          </p>
                          {userRSVP.guests_count > 0 && (
                            <p className="text-sm text-green-700 mt-1">
                              With {userRSVP.guests_count} guest{userRSVP.guests_count !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setShowRSVPForm(true)}
                          className="text-green-600 hover:text-green-500 font-medium"
                        >
                          Update RSVP
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleRSVP} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          RSVP Status
                        </label>
                        <select
                          value={rsvpForm.status}
                          onChange={(e) => setRsvpForm(prev => ({ ...prev, status: e.target.value }))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                          required
                        >
                          <option value="attending">Attending</option>
                          <option value="maybe">Maybe</option>
                          <option value="declined">Can't Make It</option>
                        </select>
                      </div>

                      {rsvpForm.status === 'attending' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Number of Guests (max 10)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={rsvpForm.guests_count}
                              onChange={(e) => setRsvpForm(prev => ({ ...prev, guests_count: parseInt(e.target.value) || 0 }))}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Dietary Requirements
                            </label>
                            <textarea
                              rows={2}
                              value={rsvpForm.dietary_requirements}
                              onChange={(e) => setRsvpForm(prev => ({ ...prev, dietary_requirements: e.target.value }))}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                              placeholder="Any allergies or dietary restrictions..."
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={rsvpForm.notes}
                          onChange={(e) => setRsvpForm(prev => ({ ...prev, notes: e.target.value }))}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                          placeholder="Any additional comments..."
                        />
                      </div>

                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          disabled={rsvpLoading}
                          className="bg-amber-600 text-white py-2 px-6 rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {rsvpLoading ? 'Updating...' : userRSVP ? 'Update RSVP' : 'Submit RSVP'}
                        </button>
                        {showRSVPForm && (
                          <button
                            type="button"
                            onClick={() => setShowRSVPForm(false)}
                            className="bg-gray-300 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-400 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  )}

                  {item.rsvp_deadline && (
                    <p className="text-sm text-gray-500 mt-4">
                      RSVP deadline: {new Date(item.rsvp_deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Attendees */}
          {isEvent && attendees.length > 0 && (
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Who's Coming ({attendees.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {attendees.map((attendee) => (
                  <div key={attendee.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-medium">
                      {attendee.user?.first_name?.charAt(0) || attendee.user?.username?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attendee.user?.first_name && attendee.user?.last_name
                          ? `${attendee.user.first_name} ${attendee.user.last_name}`
                          : attendee.user?.username
                        }
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span className={`inline-flex px-2 py-1 rounded-full ${getRSVPStatusColor(attendee.status)}`}>
                          {getRSVPStatusLabel(attendee.status)}
                        </span>
                        {attendee.guests_count > 0 && (
                          <span>+{attendee.guests_count} guest{attendee.guests_count !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;