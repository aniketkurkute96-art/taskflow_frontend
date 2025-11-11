import { useState } from 'react';
import api from '../services/api';

const TestLogin = () => {
  const [email, setEmail] = useState('admin@ex.com');
  const [password, setPassword] = useState('pass-word');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');

  const testBackend = async () => {
    try {
      setResponse('Testing backend connection...');
      const res = await api.get('/health');
      setResponse(`✅ Backend connected!\n${JSON.stringify(res.data, null, 2)}`);
    } catch (err: any) {
      setError(`❌ Backend error: ${err.message}`);
    }
  };

  const testLogin = async () => {
    try {
      setResponse('Attempting login...');
      setError('');
      
      console.log('Sending login request:', { email, password });
      
      const res = await api.post('/auth/login', { email, password });
      
      console.log('Login response:', res.data);
      setResponse(`✅ Login successful!\n${JSON.stringify(res.data, null, 2)}`);
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      
      const errorMsg = err.response?.data?.error || err.message;
      const status = err.response?.status;
      
      setError(`❌ Login failed (${status}): ${errorMsg}\n\nFull error:\n${JSON.stringify(err.response?.data || err.message, null, 2)}`);
    }
  };

  const testSignup = async () => {
    try {
      setResponse('Attempting signup...');
      setError('');
      
      const res = await api.post('/auth/signup', {
        name: 'Admin User',
        email,
        password,
        role: 'admin'
      });
      
      console.log('Signup response:', res.data);
      setResponse(`✅ Signup successful!\n${JSON.stringify(res.data, null, 2)}`);
    } catch (err: any) {
      console.error('Signup error:', err);
      const errorMsg = err.response?.data?.error || err.message;
      const status = err.response?.status;
      
      setError(`Signup result (${status}): ${errorMsg}\n\n${JSON.stringify(err.response?.data || err.message, null, 2)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Debug Login Issue</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Credentials</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Run Tests</h2>
          
          <div className="space-x-4">
            <button
              onClick={testBackend}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              1. Test Backend Connection
            </button>
            
            <button
              onClick={testSignup}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              2. Create User (Signup)
            </button>
            
            <button
              onClick={testLogin}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              3. Test Login
            </button>
          </div>
        </div>

        {response && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Response:</h3>
            <pre className="text-sm whitespace-pre-wrap text-green-900">{response}</pre>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error:</h3>
            <pre className="text-sm whitespace-pre-wrap text-red-900">{error}</pre>
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">📝 Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-900">
            <li><strong>Test Backend Connection</strong> - Check if backend is running</li>
            <li><strong>Create User</strong> - Create the admin@ex.com user in database</li>
            <li><strong>Test Login</strong> - Try logging in with the user</li>
            <li>Open browser console (F12) to see detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TestLogin;


