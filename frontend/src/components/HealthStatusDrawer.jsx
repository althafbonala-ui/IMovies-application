import React, { useState } from 'react';
import { checkHealth } from '../services/api';

function HealthStatusDrawer({
  backendStatus,
  setBackendStatus,
  isOpen,
  onClose,
  onOpen,
}) {
  const [testing, setTesting] = useState(false);

  const retestHealth = async () => {
    setTesting(true);
    try {
      const data = await checkHealth();
      setBackendStatus({
        loading: false,
        connected: true,
        data,
        error: null,
      });
    } catch (err) {
      const responseData = err.response?.data;
      setBackendStatus({
        loading: false,
        connected: false,
        data: responseData || null,
        error:
          responseData?.message ||
          err.message ||
          'Unable to connect to backend server',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      {/* Diagnostic Modal Drawer */}
      {isOpen && (
        <div className="modal-backdrop-custom" onClick={onClose} role="dialog" aria-modal="true">
          <div
            className="modal-dialog-custom p-4"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '620px' }}
          >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom border-secondary border-opacity-25">
              <div className="d-flex align-items-center gap-2">
                <span style={{ fontSize: '1.4rem' }}>🛠️</span>
                <div>
                  <h5 className="fw-bold mb-0 text-white">Developer Diagnostics & Health Check</h5>
                  <small className="text-secondary">Express API (/api/health) ➔ MongoDB Monitor</small>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary text-light border-0"
                onClick={onClose}
                aria-label="Close health drawer"
                style={{ fontSize: '1.25rem', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Connection Status Badge */}
            <div className="mb-4">
              <div className="p-3 rounded-3" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-secondary small fw-bold">API HEALTH STATUS</span>
                  {backendStatus.loading ? (
                    <span className="badge bg-warning bg-opacity-25 text-warning border border-warning">
                      Probing Endpoint...
                    </span>
                  ) : backendStatus.connected ? (
                    <span className="badge bg-success bg-opacity-25 text-success border border-success">
                      ✓ HTTP 200 OK — Backend Connected
                    </span>
                  ) : backendStatus.data?.database?.status ? (
                    <span className="badge bg-warning bg-opacity-25 text-warning border border-warning">
                      ⚠️ HTTP 503 — Database {backendStatus.data.database.status}
                    </span>
                  ) : (
                    <span className="badge bg-danger bg-opacity-25 text-danger border border-danger">
                      ✕ Disconnected (Backend Server Unreachable)
                    </span>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-secondary small fw-bold">MONGODB DATABASE</span>
                  <span className="text-white small font-monospace">
                    {backendStatus.data?.database?.name || 'imovies'} (
                    <span className={backendStatus.data?.database?.status === 'Connected' ? 'text-success fw-bold' : 'text-warning'}>
                      {backendStatus.data?.database?.status || 'Unknown / Offline'}
                    </span>
                    )
                  </span>
                </div>
              </div>
            </div>

            {/* Server Details */}
            {backendStatus.data && (
              <div className="mb-4">
                <div className="text-secondary small fw-bold mb-2">SERVER RESPONSE DETAILS</div>
                <div
                  className="p-3 rounded-3 font-monospace small"
                  style={{
                    background: '#0a0e18',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#38bdf8',
                    maxHeight: '160px',
                    overflowY: 'auto',
                  }}
                >
                  <pre className="m-0" style={{ fontSize: '0.8rem' }}>
                    {JSON.stringify(backendStatus.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {backendStatus.error && (
              <div className="mb-4 p-3 rounded-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger small">
                <strong>Connection Status:</strong> {backendStatus.error}
                <div className="mt-2 text-secondary">
                  {backendStatus.data?.database?.status
                    ? 'Tip: Please ensure MongoDB Community Server is started and listening locally on port 27017.'
                    : 'Tip: Start the Express backend by navigating to backend/ and executing npm run dev.'}
                </div>
              </div>
            )}

            {/* Architecture Data Flow Note */}
            <div className="p-3 rounded-3 mb-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-secondary small fw-bold mb-1">ARCHITECTURE DATA FLOW</div>
              <p className="font-monospace text-info mb-0" style={{ fontSize: '0.78rem' }}>
                React Client (5173) ➔ Express Routes (/api/health) ➔ Mongoose Models ➔ MongoDB (imovies)
              </p>
            </div>

            {/* Actions */}
            <div className="d-flex justify-content-between align-items-center">
              <button
                type="button"
                className="btn btn-sm btn-outline-info d-inline-flex align-items-center gap-2"
                onClick={retestHealth}
                disabled={testing}
              >
                <span>{testing ? '⏳ Checking...' : '🔄 Re-test /api/health'}</span>
              </button>

              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={onClose}
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default HealthStatusDrawer;
