// Reviews.js - Reviews Component
const { useState, useEffect } = React;

function Reviews({ user, onNavigate }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    reviewee_uid: "",
    job_id: "",
    rating: 5,
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError("");
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      const res = await fetch(
        `https://workpro-api.onrender.com/api/reviews?user_id=${user.uid}`,
        { headers }
      );
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(data.reviews || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSubmitting(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        "x-user-id": user.uid,
      };
      const res = await fetch(
        "https://workpro-api.onrender.com/api/reviews",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            to_user_id: formData.reviewee_uid,
            job_id: formData.job_id,
            rating: parseInt(formData.rating),
            comment: formData.comment,
            reviewer_name: user.username,
          }),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to submit review");
      }
      alert("Review submitted successfully!");
      setShowForm(false);
      setFormData({ reviewee_uid: "", job_id: "", rating: 5, comment: "" });
      fetchReviews();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= rating ? "filled" : ""}`}
        >
          &#9733;
        </span>
      );
    }
    return stars;
  };

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Reviews & Ratings</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Write Review"}
        </button>
      </div>

      {/* Summary */}
      <div className="reviews-summary">
        <div className="rating-big">
          <span className="rating-number">{averageRating.toFixed(1)}</span>
          <div className="rating-stars">{renderStars(Math.round(averageRating))}</div>
          <span className="rating-count">{reviews.length} reviews</span>
        </div>
      </div>

      {/* Review Form */}
      {showForm && (
        <div className="form-card">
          <h3>Write a Review</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>User UID (who you&apos;re reviewing)</label>
              <input
                type="text"
                value={formData.reviewee_uid}
                onChange={(e) =>
                  setFormData({ ...formData, reviewee_uid: e.target.value })
                }
                placeholder="Enter user's Pi UID"
                required
              />
            </div>
            <div className="form-group">
              <label>Job ID</label>
              <input
                type="text"
                value={formData.job_id}
                onChange={(e) =>
                  setFormData({ ...formData, job_id: e.target.value })
                }
                placeholder="Enter job ID"
                required
              />
            </div>
            <div className="form-group">
              <label>Rating</label>
              <div className="star-rating-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= formData.rating ? "filled" : ""}`}
                    onClick={() =>
                      setFormData({ ...formData, rating: star })
                    }
                  >
                    &#9733;
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Comment</label>
              <textarea
                value={formData.comment}
                onChange={(e) =>
                  setFormData({ ...formData, comment: e.target.value })
                }
                rows={4}
                placeholder="Share your experience..."
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner"></span> Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button className="btn btn-primary" onClick={fetchReviews}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <span className="spinner large"></span>
          <p>Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="empty-state">
          <p>No reviews yet.</p>
          <p>Complete jobs and leave reviews to build your reputation.</p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review.id || review._id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="conv-avatar small">
                    <span className="avatar-letter">
                      {(review.reviewer_name || review.reviewer_uid || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <strong>
                      {review.reviewer_name || review.reviewer_uid}
                    </strong>
                    <div className="review-stars">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                </div>
                <span className="review-date">
                  {timeAgo(review.created_at)}
                </span>
              </div>
              {review.comment && (
                <p className="review-comment">{review.comment}</p>
              )}
              {review.job_title && (
                <p className="review-job">
                  Job: {review.job_title}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
