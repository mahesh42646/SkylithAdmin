'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { login } from '@/utils/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.message);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during login');
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #5B21B6 0%, #8B5CF6 100%)'
      }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold text-purple mb-2">Admin Dashboard</h2>
                  <p className="text-muted">Sign in to your account</p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <div className="position-relative">
                      <FaEnvelope
                        className="position-absolute"
                        style={{
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#6B7280',
                          zIndex: 10
                        }}
                      />
                      <input
                        type="email"
                        className="form-control ps-5"
                        id="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <div className="position-relative">
                      <FaLock
                        className="position-absolute"
                        style={{
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#6B7280',
                          zIndex: 10
                        }}
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control ps-5 pe-5"
                        id="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="btn btn-link position-absolute end-0"
                        style={{
                          top: '50%',
                          transform: 'translateY(-50%)',
                          padding: '0.375rem 0.75rem',
                          color: '#6B7280',
                          border: 'none',
                          background: 'none'
                        }}
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="remember"
                      />
                      <label className="form-check-label" htmlFor="remember">
                        Remember me
                      </label>
                    </div>
                    <a href="#" className="text-purple text-decoration-none small">
                      Forgot password?
                    </a>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <p className="text-muted small mb-0">
                    Admin Credentials:
                  </p>
                  <div className="mt-2 p-3 bg-light rounded">
                    <p className="small mb-0">
                      <strong>Email:</strong> admin@gmail.com
                    </p>
                    <p className="small mb-0">
                      <strong>Password:</strong> admin@123
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
