import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AdminRoute Guard Component
 *
 * Enforces authentication and administrator role access for protected admin pages.
 * Handles loading, unauthenticated, and unauthorized (non-admin) states.
 *
 * Props:
 * - user {object|null}: Current authenticated user state
 * - authLoading {boolean}: Flag indicating if session verification is in progress
 * - onOpenAuthModal {function}: Triggers login/register modal
 * - children {React.ReactNode}: Child components to render if user is authorized
 */
function AdminRoute({ user, authLoading, onOpenAuthModal, children }) {
  const navigate = useNavigate();

  // 1. Loading state while checking session
  if (authLoading) {
    return (
      <div className="container py-5 text-center my-5">
        <div
          className="spinner-border text-danger mb-3"
          role="status"
          style={{ width: '3rem', height: '3rem' }}
        >
          <span className="visually-hidden">Verifying privileges...</span>
        </div>
        <h5 className="text-white fw-bold mb-1 brand-font">Verifying Administrator Privileges</h5>
        <p className="text-secondary small">Connecting securely to iMovies services...</p>
      </div>
    );
  }

  // 2. Unauthenticated state (No user signed in)
  if (!user) {
    return (
      <div className="container py-5">
        <div
          className="text-center p-4 p-md-5 rounded-4 mx-auto my-4"
          style={{
            maxWidth: '560px',
            background: 'rgba(14, 21, 38, 0.9)',
            border: '1px solid rgba(248, 68, 100, 0.35)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: '72px',
              height: '72px',
              background: 'linear-gradient(135deg, rgba(248, 68, 100, 0.2) 0%, rgba(178, 16, 50, 0.3) 100%)',
              border: '1px solid rgba(248, 68, 100, 0.4)',
            }}
          >
            <span style={{ fontSize: '2.2rem' }} aria-hidden="true">🔒</span>
          </div>
          <h2 className="h4 fw-bold text-white mb-2 brand-font">
            Administrator Authentication Required
          </h2>
          <p className="text-secondary small mb-4" style={{ lineHeight: '1.6' }}>
            Access to the iMovies management console and cinema analytics is restricted. Please sign in
            with an authorized administrator account to continue.
          </p>
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
            <button
              type="button"
              className="btn btn-bms-primary py-2 px-4 rounded-pill d-flex align-items-center justify-content-center gap-2"
              onClick={onOpenAuthModal}
            >
              <span>🔑</span>
              <span>Sign In to Admin Account</span>
            </button>
            <button
              type="button"
              className="btn btn-outline-light py-2 px-4 rounded-pill"
              onClick={() => navigate('/')}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Unauthorized state (Authenticated, but role is NOT admin)
  if (user.role !== 'admin') {
    return (
      <div className="container py-5">
        <div
          className="text-center p-4 p-md-5 rounded-4 mx-auto my-4"
          style={{
            maxWidth: '560px',
            background: 'rgba(14, 21, 38, 0.9)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
            style={{
              width: '72px',
              height: '72px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ef4444',
            }}
          >
            <span style={{ fontSize: '2.2rem' }} aria-hidden="true">🛡️</span>
          </div>
          <h2 className="h4 fw-bold text-white mb-2 brand-font">
            403 - Access Denied
          </h2>
          <p className="text-secondary small mb-3" style={{ lineHeight: '1.6' }}>
            You are signed in as <strong className="text-white">{user.name}</strong> ({user.email}),
            which is registered with the <span className="badge bg-secondary text-white ms-1">{user.role}</span> role.
          </p>
          <p className="text-danger small mb-4">
            Administrator privileges are required to view cinema analytics and manage movies.
          </p>
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
            <button
              type="button"
              className="btn btn-bms-primary py-2 px-4 rounded-pill"
              onClick={() => navigate('/')}
            >
              Return to Movies
            </button>
            <button
              type="button"
              className="btn btn-outline-light py-2 px-4 rounded-pill"
              onClick={onOpenAuthModal}
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized: User is authenticated and role is admin
  return children;
}

export default AdminRoute;
