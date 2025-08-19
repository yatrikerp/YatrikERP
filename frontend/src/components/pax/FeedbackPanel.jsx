import React, { useState } from 'react';
import { Star, MessageSquare, ThumbsUp } from 'lucide-react';

const FeedbackPanel = () => {
  const [formData, setFormData] = useState({
    rating: 0,
    category: '',
    text: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const categories = [
    { value: 'ux', label: 'User Experience', icon: '🎨' },
    { value: 'price', label: 'Pricing', icon: '💰' },
    { value: 'staff', label: 'Staff Service', icon: '👥' },
    { value: 'app', label: 'Mobile App', icon: '📱' },
    { value: 'general', label: 'General', icon: '💬' }
  ];

  const handleRatingClick = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.rating === 0) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/support/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowSuccess(true);
        setFormData({ rating: 0, category: '', text: '' });
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ThumbsUp className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h3>
          <p className="text-gray-600 mb-4">Your feedback has been submitted successfully.</p>
          <button
            onClick={() => setShowSuccess(false)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Submit More Feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Feedback</h2>
          <p className="text-gray-600">Help us improve your experience</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How would you rate your experience?
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRatingClick(star)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                  formData.rating >= star
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                <Star className={`w-6 h-6 ${formData.rating >= star ? 'fill-current' : ''}`} />
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-3">
            Category
          </label>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  formData.category === category.value
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{category.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Text */}
        <div>
          <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-3">
            Tell us more (Optional)
          </label>
          <textarea
            id="text"
            rows={4}
            value={formData.text}
            onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            placeholder="Share your thoughts, suggestions, or concerns..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || formData.rating === 0}
          className="w-full bg-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Submitting...
            </>
          ) : (
            <>
              <MessageSquare className="w-5 h-5" />
              Submit Feedback
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
        <h4 className="font-medium text-purple-900 mb-2">Why your feedback matters</h4>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>• Helps us improve our services</li>
          <li>• Identifies areas for enhancement</li>
          <li>• Ensures better customer experience</li>
          <li>• Guides future development priorities</li>
        </ul>
      </div>
    </div>
  );
};

export default FeedbackPanel;
