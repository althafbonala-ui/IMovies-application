import React, { useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/authService';

function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Clear password and transient states whenever modal is closed
  useEffect(() => {
    if (!isOpen) {
      setFormData((prev) => ({ ...prev, password: '' }));
      setShowPassword(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setFormData((prev) => ({ ...prev, password: '' }));
    setShowPassword(false);
    setErrorMessage('');
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMessage('');
    setShowPassword(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side quick checks
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!formData.password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (mode === 'register') {
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (formData.password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
    }

    setLoading(true);

    try {
      let result;
      if (mode === 'login') {
        result = await loginUser({
          email: trimmedEmail,
          password: formData.password, // Password is intentionally untrimmed
        });
      } else {
        result = await registerUser({
          name: formData.name.trim(),
          email: trimmedEmail,
          password: formData.password,
          phone: formData.phone.trim(),
        });
      }

      if (result.success && result.data) {
        // Clear password field after successful authentication (never before request completes)
        setFormData((prev) => ({ ...prev, password: '' }));

        // Explicitly handle localStorage write errors
        let storageFailed = false;
        if (result.data.token) {
          try {
            localStorage.setItem('imovies_token', result.data.token);
          } catch {
            storageFailed = true;
            try {
              localStorage.removeItem('imovies_token');
            } catch {
              // Ignore storage cleanup error
            }
          }
        } else {
          storageFailed = true;
        }

        if (!storageFailed) {
          // Pass user object without token to App.jsx in-memory state and close modal
          const { token: _token, ...user } = result.data;
          onAuthSuccess(user, mode);
          handleClose();
        } else {
          // Safe session state: do not report as auth failure, show clear storage message
          setErrorMessage(
            'Authentication succeeded on the server, but unable to save your session to browser storage. Please check your browser privacy or storage settings.'
          );
        }
      } else {
        setErrorMessage(result.message || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      const backendMsg =
        err.response?.data?.message ||
        (err.request
          ? 'Unable to reach backend server. Please check your connection or continue with demo login below.'
          : err.message || 'An unexpected error occurred.');
      setErrorMessage(backendMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAuth = (demoRole = 'member') => {
    const rawName = formData.name.trim();
    const fallbackName = mode === 'register' ? 'Allu Arjun Fan' : 'Mahesh Reddy';
    const demoUser = {
      _id: 'demo-user-' + Date.now(),
      name: rawName || fallbackName,
      email: formData.email.trim() || 'demo.user@imovies.com',
      phone: formData.phone.trim() || '9876543210',
      role: demoRole,
    };
    try {
      localStorage.setItem('imovies_token', 'demo_token_' + Date.now());
    } catch {}
    onAuthSuccess(demoUser, mode);
    handleClose();
  };

  return (
    <div className="modal-backdrop-custom" onClick={handleClose} role="dialog" aria-modal="true">
      <div
        className="modal-dialog-custom p-4"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px' }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <span style={{ fontSize: '1.4rem' }} aria-hidden="true">🎬</span>
            <h5 className="fw-bold mb-0 text-white brand-font">
              {mode === 'login' ? 'Sign In to iMovies' : 'Create iMovies Account'}
            </h5>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary text-light border-0"
            onClick={handleClose}
            aria-label="Close"
            style={{ fontSize: '1.25rem', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="d-flex rounded-3 p-1 mb-4" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            className={`btn btn-sm flex-fill fw-semibold py-2 rounded-2 ${mode === 'login' ? 'btn-danger shadow-sm text-white' : 'btn-transparent text-secondary border-0'}`}
            onClick={() => switchMode('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`btn btn-sm flex-fill fw-semibold py-2 rounded-2 ${mode === 'register' ? 'btn-danger shadow-sm text-white' : 'btn-transparent text-secondary border-0'}`}
            onClick={() => switchMode('register')}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            className="alert alert-danger py-2 px-3 small rounded-3 mb-3"
            role="alert"
            style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5' }}
          >
            <div className="d-flex align-items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
            {errorMessage.includes('backend server') && (
              <button
                type="button"
                className="btn btn-sm btn-outline-light w-100 mt-2 py-1"
                style={{ fontSize: '0.78rem', borderColor: 'rgba(255,255,255,0.3)' }}
                onClick={() => handleDemoAuth('member')}
              >
                ⚡ Instant Demo {mode === 'login' ? 'Sign In' : 'Account Creation'}
              </button>
            )}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="mb-3">
              <label className="form-label text-secondary small fw-bold text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>
                Full Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="name"
                className="search-input w-100"
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={handleInputChange}
                required
                autoFocus={mode === 'register'}
                style={{ paddingLeft: '1rem', borderRadius: '10px' }}
              />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label text-secondary small fw-bold text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>
              Email Address <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              name="email"
              className="search-input w-100"
              placeholder="e.g. rahul@example.com"
              value={formData.email}
              onChange={handleInputChange}
              required
              autoFocus={mode === 'login'}
              style={{ paddingLeft: '1rem', borderRadius: '10px' }}
            />
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label text-secondary small fw-bold text-uppercase mb-0" style={{ letterSpacing: '0.05em' }}>
                Password <span className="text-danger">*</span>
              </label>
              <button
                type="button"
                className="btn btn-sm btn-link p-0 text-secondary text-decoration-none small"
                onClick={() => setShowPassword(!showPassword)}
                style={{ fontSize: '0.75rem' }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              className="search-input w-100"
              placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
              value={formData.password}
              onChange={handleInputChange}
              required
              style={{ paddingLeft: '1rem', borderRadius: '10px' }}
            />
          </div>

          {mode === 'register' && (
            <div className="mb-4">
              <label className="form-label text-secondary small fw-bold text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>
                Phone Number <span className="text-secondary opacity-75">(Optional)</span>
              </label>
              <input
                type="tel"
                name="phone"
                className="search-input w-100"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleInputChange}
                style={{ paddingLeft: '1rem', borderRadius: '10px' }}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-danger w-100 py-2 fw-semibold rounded-3 d-flex align-items-center justify-content-center gap-2 mt-2"
            disabled={loading}
            style={{ backgroundColor: '#f84464', borderColor: '#f84464' }}
          >
            {loading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
            <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>

        {/* Footer switch prompt */}
        <div className="text-center mt-3 pt-3 border-top border-secondary border-opacity-25 text-secondary small">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                className="btn btn-link p-0 text-danger text-decoration-none small fw-semibold"
                onClick={() => switchMode('register')}
              >
                Register now
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                className="btn btn-link p-0 text-danger text-decoration-none small fw-semibold"
                onClick={() => switchMode('login')}
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
