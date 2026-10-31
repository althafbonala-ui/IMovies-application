import React, { useEffect, useState, useRef } from 'react';

/**
 * Cinematic Toast Notification Component
 * Displays animated popup for login, account creation, logout, and profile updates.
 */
function ToastNotification({ toast, onClose }) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const duration = toast?.duration || 10000;

  // Reset progress when a new toast is passed
  useEffect(() => {
    if (!toast) return;
    setProgress(100);
  }, [toast]);

  // Smooth countdown timer
  useEffect(() => {
    if (!toast) return;

    const intervalTime = 50;
    const step = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (isPaused) return prev;
        if (prev <= 0) {
          clearInterval(timer);
          onCloseRef.current?.();
          return 0;
        }
        return Math.max(0, prev - step);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [toast, isPaused, duration]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  const accentColor = isSuccess ? '#10b981' : isError ? '#f84464' : '#38bdf8';
  const icon = toast.icon || (isSuccess ? '🎉' : isError ? '⚠️' : '🎬');

  return (
    <div
      className="toast-notification-wrapper"
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'fixed',
        top: '84px',
        right: '28px',
        zIndex: 99999,
        maxWidth: '440px',
        width: 'calc(100% - 56px)',
        animation: 'toastSlideIn 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        className="p-3 rounded-4 shadow-lg position-relative overflow-hidden"
        style={{
          background: '#090e1c',
          border: `1.5px solid ${accentColor}cc`,
          boxShadow: `0 24px 50px rgba(0, 0, 0, 0.95), 0 0 35px ${accentColor}44`,
        }}
      >
        <div className="d-flex align-items-start gap-3">
          {/* Animated Icon Avatar */}
          <div
            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: '46px',
              height: '46px',
              background: `${accentColor}25`,
              border: `1.5px solid ${accentColor}88`,
              boxShadow: `0 0 18px ${accentColor}66`,
              fontSize: '1.35rem',
            }}
          >
            {icon}
          </div>

          {/* Content */}
          <div className="flex-grow-1 pe-2">
            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <h6
                className="fw-bold mb-0 brand-font"
                style={{ color: '#ffffff', fontSize: '1.02rem', letterSpacing: '-0.01em' }}
              >
                {toast.title}
              </h6>
              {isSuccess && (
                <span
                  className="badge rounded-pill"
                  style={{
                    background: 'rgba(16, 185, 129, 0.22)',
                    color: '#10b981',
                    fontSize: '0.68rem',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                  }}
                >
                  ✓ Verified
                </span>
              )}
            </div>
            <p
              className="small text-light text-opacity-85 mb-0"
              style={{ fontSize: '0.88rem', lineHeight: '1.45' }}
            >
              {toast.message}
            </p>
          </div>

          {/* Close button */}
          <button
            type="button"
            className="btn btn-sm btn-link text-secondary text-decoration-none p-0 border-0 flex-shrink-0"
            onClick={onClose}
            aria-label="Close notification"
            style={{ fontSize: '1.25rem', lineHeight: 1, opacity: 0.75, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Progress Bar Timer */}
        <div
          className="position-absolute bottom-0 start-0"
          style={{
            height: '3px',
            width: `${progress}%`,
            background: accentColor,
            boxShadow: `0 0 12px ${accentColor}`,
            transition: 'width 0.05s linear',
          }}
        />
      </div>

      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(-24px) scale(0.94);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (max-width: 576px) {
          .toast-notification-wrapper {
            top: 16px !important;
            right: 16px !important;
            left: 16px !important;
            width: auto !important;
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ToastNotification;

