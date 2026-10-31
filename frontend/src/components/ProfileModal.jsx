import React, { useState, useEffect } from 'react';
import { updateUserProfile, logoutUser } from '../services/authService';

/**
 * ProfileModal Component
 *
 * Props:
 * - isOpen {boolean}: Controls modal visibility
 * - onClose {function}: Callback when modal is closed
 * - user {object}: In-memory user profile data ({ _id, name, email, phone, role, createdAt })
 * - onProfileUpdated {function}: Callback when profile is successfully updated, receives updated user object
 * - onLogout {function}: Optional callback when user logs out from inside the modal
 */
function ProfileModal({ isOpen, onClose, user, onProfileUpdated, onLogout }) {
  const [tab, setTab] = useState('view'); // 'view' | 'edit'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
      });
      setErrorMessage('');
      setSuccessMessage('');
      setTab('view');
      setConfirmLogout(false);
      setShowPassword(false);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleClose = () => {
    setFormData((prev) => ({ ...prev, password: '' }));
    setShowPassword(false);
    setErrorMessage('');
    setSuccessMessage('');
    setConfirmLogout(false);
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
    if (successMessage) setSuccessMessage('');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setErrorMessage('Name cannot be empty.');
      return;
    }

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    const payload = {};
    if (trimmedName !== user.name) payload.name = trimmedName;
    if (trimmedEmail !== user.email) payload.email = trimmedEmail;
    if (formData.phone.trim() !== (user.phone || '')) payload.phone = formData.phone.trim();
    if (formData.password) payload.password = formData.password;

    if (Object.keys(payload).length === 0) {
      setErrorMessage('No changes detected to save.');
      return;
    }

    setLoading(true);

    try {
      const result = await updateUserProfile(payload);
      if (result.success && result.data) {
        // Handle profile-update token storage errors explicitly
        // Do not assume a new token exists; check actual contract
        let storageErrorOccurred = false;
        if (result.data.token) {
          try {
            localStorage.setItem('imovies_token', result.data.token);
          } catch {
            storageErrorOccurred = true;
          }
        }

        // Never keep or store the password in profile state
        setFormData((prev) => ({ ...prev, password: '' }));

        // Extract updated user object without token so token is never stored in React state
        const { token: _updatedToken, ...updatedFields } = result.data;
        const mergedUser = { ...user, ...updatedFields };

        // Notify parent with updated user object (preserving original fields like createdAt)
        if (typeof onProfileUpdated === 'function') {
          onProfileUpdated(mergedUser);
        }

        // Return immediately to view tab without timers
        setTab('view');

        if (storageErrorOccurred) {
          setErrorMessage(
            'Profile updated, but unable to save new session token to browser storage. Please check storage settings.'
          );
        } else {
          setSuccessMessage('Profile updated successfully!');
        }
      } else {
        setErrorMessage(result.message || 'Failed to update profile.');
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await logoutUser();
    } catch {
      // Safe error handling: network/server errors during logout must not prevent local session termination
    } finally {
      try {
        localStorage.removeItem('imovies_token');
      } catch {
        // Ignore storage errors
      }
      setLoggingOut(false);
      setConfirmLogout(false);
      if (typeof onLogout === 'function') {
        onLogout();
      }
      onClose();
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Member';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Member';
    }
  };

  return (
    <div className="modal-backdrop-custom" onClick={handleClose} role="dialog" aria-modal="true">
      <div
        className="modal-dialog-custom p-4"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
              style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, #f84464 0%, #c4183c 100%)',
                fontSize: '0.9rem',
              }}
            >
              {user.name ? user.name.slice(0, 2).toUpperCase() : 'IM'}
            </div>
            <div>
              <h5 className="fw-bold mb-0 text-white brand-font">{user.name}</h5>
              <span className="text-secondary small">{user.email}</span>
            </div>
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

        {/* Tab switch */}
        <div className="d-flex rounded-3 p-1 mb-4" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            className={`btn btn-sm flex-fill fw-semibold py-2 rounded-2 ${tab === 'view' ? 'btn-danger shadow-sm text-white' : 'btn-transparent text-secondary border-0'}`}
            onClick={() => {
              setTab('view');
              setErrorMessage('');
              setSuccessMessage('');
              setConfirmLogout(false);
            }}
          >
            Account Overview
          </button>
          <button
            type="button"
            className={`btn btn-sm flex-fill fw-semibold py-2 rounded-2 ${tab === 'edit' ? 'btn-danger shadow-sm text-white' : 'btn-transparent text-secondary border-0'}`}
            onClick={() => {
              setTab('edit');
              setErrorMessage('');
              setSuccessMessage('');
              setConfirmLogout(false);
            }}
          >
            Edit Profile
          </button>
        </div>

        {/* Feedback messages */}
        {errorMessage && (
          <div className="alert alert-danger py-2 px-3 small rounded-3 mb-3" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5' }}>
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="alert alert-success py-2 px-3 small rounded-3 mb-3" style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#6ee7b7' }}>
            {successMessage}
          </div>
        )}

        {/* Tab 1: Account Overview */}
        {tab === 'view' ? (
          <div>
            <div className="p-3 rounded-3 mb-3" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div className="row g-3">
                <div className="col-6">
                  <span className="text-secondary small d-block mb-1">Account Role</span>
                  <span className={`badge ${user.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary bg-opacity-50 text-white'} px-2 py-1`}>
                    {user.role === 'admin' ? '🛡️ Administrator' : '🎬 Moviegoer'}
                  </span>
                </div>
                <div className="col-6">
                  <span className="text-secondary small d-block mb-1">Member Since</span>
                  <span className="text-white small fw-medium">{formatDate(user.createdAt)}</span>
                </div>
                <div className="col-12 border-top border-secondary border-opacity-25 pt-2">
                  <span className="text-secondary small d-block mb-1">Email Address</span>
                  <span className="text-white small fw-medium">{user.email}</span>
                </div>
                <div className="col-12 border-top border-secondary border-opacity-25 pt-2">
                  <span className="text-secondary small d-block mb-1">Contact Phone</span>
                  <span className="text-white small fw-medium">{user.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>

            <div className="d-flex flex-column gap-2 mt-3">
              <button
                type="button"
                className="btn btn-outline-light w-100 py-2 small fw-semibold rounded-3 d-flex align-items-center justify-content-center gap-2"
                onClick={() => {
                  setTab('edit');
                  setConfirmLogout(false);
                }}
              >
                <span>✏️</span>
                <span>Edit Account Information</span>
              </button>

              {/* Logout button & confirmation step */}
              {!confirmLogout ? (
                <button
                  type="button"
                  className="btn btn-outline-danger w-100 py-2 small fw-semibold rounded-3 d-flex align-items-center justify-content-center gap-2"
                  onClick={() => setConfirmLogout(true)}
                >
                  <span>🚪</span>
                  <span>Sign Out</span>
                </button>
              ) : (
                <div
                  className="p-3 rounded-3 border border-danger border-opacity-25"
                  style={{ background: 'rgba(239, 68, 68, 0.08)' }}
                >
                  <div className="text-white small fw-semibold mb-2 text-center">
                    Are you sure you want to sign out?
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary text-light flex-fill py-1 rounded-2"
                      onClick={() => setConfirmLogout(false)}
                      disabled={loggingOut}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger flex-fill py-1 rounded-2 d-flex align-items-center justify-content-center gap-1 fw-semibold"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      style={{ backgroundColor: '#f84464', borderColor: '#f84464' }}
                    >
                      {loggingOut && (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      )}
                      <span>Confirm Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Tab 2: Edit Profile Form */
          <form onSubmit={handleUpdate}>
            <div className="mb-3">
              <label className="form-label text-secondary small fw-bold text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                className="search-input w-100"
                value={formData.name}
                onChange={handleInputChange}
                required
                style={{ paddingLeft: '1rem', borderRadius: '10px' }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-secondary small fw-bold text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                className="search-input w-100"
                value={formData.email}
                onChange={handleInputChange}
                required
                style={{ paddingLeft: '1rem', borderRadius: '10px' }}
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-secondary small fw-bold text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>
                Phone Number
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

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label text-secondary small fw-bold text-uppercase mb-0" style={{ letterSpacing: '0.05em' }}>
                  New Password <span className="text-secondary opacity-75">(Leave blank to keep current)</span>
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
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleInputChange}
                style={{ paddingLeft: '1rem', borderRadius: '10px' }}
              />
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary text-light flex-fill py-2 rounded-3"
                onClick={() => {
                  setTab('view');
                  setFormData((prev) => ({ ...prev, password: '' }));
                  setErrorMessage('');
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-danger flex-fill py-2 fw-semibold rounded-3 d-flex align-items-center justify-content-center gap-2"
                disabled={loading}
                style={{ backgroundColor: '#f84464', borderColor: '#f84464' }}
              >
                {loading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ProfileModal;
