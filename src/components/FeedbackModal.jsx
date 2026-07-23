import React, { useState } from 'react';
import { MessageSquare, Star, Send, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { trackEvent, ANALYTICS_EVENTS } from '../utils/analytics';

export function FeedbackModal({ isOpen, onClose, onShowToast }) {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const formId = import.meta.env.VITE_FEEDBACK_FORM_ID;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    // If Formspree endpoint is unconfigured or a placeholder, simulate graceful submission or clear error
    if (!formId || formId === 'x...' || formId.includes('YOUR_')) {
      // Unconfigured placeholder fallback: simulate delay and display informative message
      setTimeout(() => {
        setIsSubmitting(false);
        setSubmittedSuccess(true);
        trackEvent(ANALYTICS_EVENTS.FEEDBACK_SUBMITTED, { rating, unconfigured: true });
        if (onShowToast) {
          onShowToast('success', 'Feedback submitted! (Placeholder form endpoint — set VITE_FEEDBACK_FORM_ID in .env for Formspree integration)');
        }
      }, 700);
      return;
    }

    try {
      const response = await fetch(`https://formspree.io/f/${formId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: name || 'Anonymous User',
          email: email || 'not-provided@rentstar.dapp',
          rating,
          feedback,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSubmittedSuccess(true);
        trackEvent(ANALYTICS_EVENTS.FEEDBACK_SUBMITTED, { rating });
        if (onShowToast) onShowToast('success', 'Thank you for your feedback!');
      } else {
        const data = await response.json();
        setSubmitError(data.error || 'Failed to send feedback to Formspree endpoint.');
      }
    } catch (err) {
      console.error('Feedback submit error:', err);
      setSubmitError('Network error. Unable to contact Formspree endpoint.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedSuccess(false);
    setSubmitError(null);
    setFeedback('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative space-y-5">
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close feedback modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-heading text-white">Send Product Feedback</h3>
            <p className="text-xs text-slate-400">Help us improve the RentStar experience</p>
          </div>
        </div>

        {submittedSuccess ? (
          <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl p-5 text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">Feedback Received!</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Thank you for evaluating RentStar. Your response has been logged.
            </p>
            <button
              onClick={handleReset}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rating Stars */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Rate your experience</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                    aria-label={`Rate ${star} star`}
                  >
                    <Star
                      className={`w-6 h-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Name (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">Feedback / Comments *</label>
              <textarea
                required
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts on UX, multi-wallet connect, or smart contract settlements..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-accent resize-none"
              />
            </div>

            {submitError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !feedback.trim()}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                'Submitting Feedback...'
              ) : (
                <>
                  <Send className="w-4 h-4" /> Submit Feedback
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default FeedbackModal;
