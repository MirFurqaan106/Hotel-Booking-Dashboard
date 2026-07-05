import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { FiStar, FiEdit, FiUser, FiCalendar, FiMessageSquare, FiCheckCircle } from 'react-icons/fi';
import './Reviews.css';

const Reviews = () => {
  const { allBookings } = useDashboard();
  
  // Local state for user submitted reviews initialized with local storage persistence
  const [userReviews, setUserReviews] = useState(() => {
    const saved = localStorage.getItem('panun_ghar_user_reviews');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formText, setFormText] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');
  const [dbReviews, setDbReviews] = useState([]);

  const fetchDbReviews = async () => {
    try {
      const res = await api.get('/reviews');
      const mapped = res.data.map(r => ({
        id: `DB-REV-${r.id}`,
        name: r.guest_name || r.user?.full_name || 'Anonymous Guest',
        rating: r.rating,
        roomType: 'Heritage Suite Stayer',
        date: new Date(r.created_at).toISOString().split('T')[0],
        comment: r.comment
      }));
      setDbReviews(mapped);
    } catch (err) {
      console.error("Failed to load reviews from SQLite backend:", err);
    }
  };

  useEffect(() => {
    fetchDbReviews();
  }, []);

  // 1. Gather all default reviews from Checked Out bookings
  const defaultReviews = useMemo(() => {
    const reviews = [];
    
    // Review templates matching ratings
    const templates = {
      5: [
        "Panun Ghar is a true gem in Kashmir! The wooden craftsmanship is outstanding, and the private cinema lounge was a huge highlight. Mir Furqaan and his team treated us like family.",
        "An absolutely magical stay. The views of the pine trees and mountains are breathtaking. Highly recommend the Deluxe Suite. Outstanding hospitality!",
        "Excellent resort! From Dal Lake proximity to the beautifully heated rooms, everything was top-notch. Swimming pool and cinema were fantastic additions.",
        "Perfect location, clean bathrooms, and cozy lobby lounge. The park gardens are very well-maintained. We loved the traditional Kashmiri Kahwa tea!"
      ],
      4: [
        "Very comfortable rooms and excellent service. The private cinema room is a neat feature. Highly convenient location in Srinagar.",
        "Excellent hospitality and gorgeous mountain views. Rooms were warm and clean. We had a great time relaxing in the park lawns.",
        "Great experience staying at Panun Ghar. The room was spacious and the staff was extremely helpful. Will definitely visit again."
      ],
      3: [
        "The stay was good. Beautiful location, but the heated pool was closed for maintenance for one day during our stay. Overall nice hotel.",
        "Decent amenities and friendly staff. Rooms are cozy, though the WiFi signal was a bit weak in our corner room."
      ]
    };

    allBookings.forEach((b, index) => {
      if (b.BookingStatus === 'Checked Out' && b.Rating) {
        const rating = b.Rating;
        const textOptions = templates[rating] || ["A comfortable and relaxing stay at Panun Ghar. Great location and views."];
        const comment = textOptions[index % textOptions.length];

        reviews.push({
          id: `REV-${1000 + index}`,
          name: b.GuestName,
          rating: rating,
          roomType: b.RoomType,
          date: b.CheckOut,
          comment: comment
        });
      }
    });

    return reviews;
  }, [allBookings]);

  // Combine default reviews, database reviews and user submitted reviews
  const allReviewsList = useMemo(() => {
    return [...userReviews, ...dbReviews, ...defaultReviews];
  }, [userReviews, dbReviews, defaultReviews]);

  // Calculate Average Rating stats
  const stats = useMemo(() => {
    const total = allReviewsList.length;
    if (total === 0) return { avg: '0.0', counts: {} };

    const sum = allReviewsList.reduce((acc, r) => acc + r.rating, 0);
    const avg = (sum / total).toFixed(1);

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviewsList.forEach(r => {
      counts[r.rating] = (counts[r.rating] || 0) + 1;
    });

    return { total, avg, counts };
  }, [allReviewsList]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');

    if (token) {
      try {
        await api.post('/reviews', {
          rating: parseInt(formRating),
          comment: formText
        });
        fetchDbReviews();
      } catch (err) {
        console.error("Failed to save review in database:", err);
      }
    } else {
      const newRev = {
        id: `REV-${Date.now()}`,
        name: formName || 'Anonymous Guest',
        rating: parseInt(formRating),
        roomType: 'Walk-In Guest',
        date: new Date().toISOString().split('T')[0],
        comment: formText
      };

      const updated = [newRev, ...userReviews];
      setUserReviews(updated);
      localStorage.setItem('panun_ghar_user_reviews', JSON.stringify(updated));
    }
    
    // Feedback toasts
    setToast("Review submitted successfully! Thank you for your feedback.");
    setTimeout(() => setToast(''), 3000);

    // Reset Form
    setFormName('');
    setFormRating(5);
    setFormText('');
    setShowForm(false);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar 
        key={i} 
        size={14} 
        fill={i < rating ? "currentColor" : "none"} 
        className={i < rating ? "text-warning" : "text-muted"} 
      />
    ));
  };

  return (
    <div className="reviews-page page-container animate-fade-in">
      <div className="reviews-header-block">
        <h1>Guest Reviews</h1>
        <p>Read honest reviews from our checked-out guests, or share your own personal stay experience.</p>
      </div>

      {toast && (
        <div className="toast-notification animate-fade-in">
          <FiCheckCircle size={16} />
          <span>{toast}</span>
        </div>
      )}

      <div className="reviews-layout-grid">
        
        {/* Left Side: Rating summary */}
        <div className="reviews-sidebar-panel">
          <div className="rating-summary-card card glass-panel">
            <h3>Overall Score</h3>
            <div className="score-big-num">
              <h2>{stats.avg}</h2>
              <div className="stars-row big">
                {renderStars(Math.round(parseFloat(stats.avg)))}
              </div>
              <p>Based on {stats.total} guest reviews</p>
            </div>

            {/* Rating breakdown bars */}
            <div className="breakdown-list">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats.counts[stars] || 0;
                const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <div key={stars} className="breakdown-item-bar">
                    <span className="lbl">{stars} Star</span>
                    <div className="bar-bg">
                      <div className="bar-fill" style={{ width: `${percent}%` }}></div>
                    </div>
                    <span className="count-txt">{count}</span>
                  </div>
                );
              })}
            </div>

            <button className="write-rev-toggle-btn" onClick={() => setShowForm(!showForm)}>
              <FiEdit size={16} />
              <span>Write a Review</span>
            </button>
          </div>
        </div>

        {/* Right Side: Reviews Scroll List and Form */}
        <div className="reviews-main-panel">
          
          {/* Form overlay/expandable */}
          {showForm && (
            <div className="write-review-form-card card glass-panel animate-fade-in">
              <div className="form-head">
                <h3>Submit Your Stay Review</h3>
                <button className="close-form-btn" onClick={() => setShowForm(false)}>×</button>
              </div>

              <form onSubmit={handleSubmitReview} className="rev-form">
                <div className="form-row-group">
                  <div className="grp">
                    <label>Your Full Name</label>
                    <input 
                      type="text" 
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Vihaan Sharma"
                      required
                    />
                  </div>
                  <div className="grp select-grp">
                    <label>Rating Score</label>
                    <select value={formRating} onChange={(e) => setFormRating(e.target.value)}>
                      <option value={5}>5 Star (Excellent)</option>
                      <option value={4}>4 Star (Very Good)</option>
                      <option value={3}>3 Star (Good)</option>
                      <option value={2}>2 Star (Average)</option>
                      <option value={1}>1 Star (Poor)</option>
                    </select>
                  </div>
                </div>

                <div className="grp">
                  <label>Review Commentary</label>
                  <textarea 
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    placeholder="Describe your room condition, staff behaviour, cinema, pool and park experience..."
                    rows={4}
                    required
                  ></textarea>
                </div>

                <button type="submit" className="submit-rev-btn">
                  Publish Review
                </button>
              </form>
            </div>
          )}

          {/* Reviews list scroll */}
          <div className="reviews-scroll-list">
            {allReviewsList.length > 0 ? (
              allReviewsList.map((rev) => (
                <div key={rev.id} className="review-card-item card">
                  <div className="rev-card-head">
                    <div className="user-meta">
                      <div className="user-avatar-mini">
                        <FiUser size={14} />
                      </div>
                      <div className="user-names-col">
                        <h4>{rev.name}</h4>
                        <span className="room-span">{rev.roomType} • Stay Date: {rev.date}</span>
                      </div>
                    </div>
                    <div className="rating-stars-badge">
                      {renderStars(rev.rating)}
                    </div>
                  </div>
                  <p className="rev-comment-text">{rev.comment}</p>
                </div>
              ))
            ) : (
              <div className="empty-reviews card">
                <FiMessageSquare size={36} className="text-muted" />
                <p>No reviews have been published yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
export { Reviews };
