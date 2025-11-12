import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Form submitted with:', { email, password: '***' });

    try {
      await login(email, password);
      console.log('Login successful, navigating to dashboard...');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login failed:', err);
      
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please check if the backend is running.');
      } else if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.status === 500) {
        setError('Server error. Database might not be seeded. Check Render logs.');
      } else if (err.response?.status === 429 || /Server is busy/i.test(err?.message || '')) {
        // Friendly cooldown UX
        const retryAfterHeader = err.response?.headers?.['retry-after'];
        const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 5;
        setCooldown(retryAfter > 0 ? retryAfter : 5);
        setError('Server is busy. Please wait a moment and try again.');
        // Start countdown
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(err.response?.data?.error || err.message || 'Login failed. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">Nagrik TaskFlow</h2>
          <p className="mt-2 text-center text-gray-600">Sign in to your account</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading || cooldown > 0}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : cooldown > 0 ? `Please wait ${cooldown}s` : 'Sign in'}
            </button>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign up here
              </Link>
            </p>
          </div>

          <div className="text-sm text-gray-600 border-t pt-4">
            <p className="font-semibold mb-2">Admin Account:</p>
            <div className="bg-indigo-50 p-3 rounded-md mb-3">
              <p className="font-mono text-sm">📧 admin@example.com</p>
              <p className="font-mono text-sm">🔒 pass-word</p>
            </div>
            <p className="font-semibold mb-1">Test Accounts:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>creator@example.com</li>
              <li>hod@example.com</li>
              <li>cfo@example.com</li>
              <li>assignee@example.com</li>
            </ul>
            <p className="mt-2 text-xs">Password for test accounts: password</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

