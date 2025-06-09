import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { cn } from '../lib/utils';
import { API_URL } from '../config';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('admin'); // 'admin' or 'warehouse'
  
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = loginType === 'admin' ? '/auth/admin/login' : '/auth/warehouse/login';
      
      console.log('Attempting login:', { loginType, endpoint, username }); // Debug log
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('Login response:', data); // Debug log

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Extract user data and role from response
      const userData = data.admin || data.warehouse || data.user;
      const userRole = data.role;
      const token = data.token;

      console.log('Extracted login data:', { userData, userRole, token }); // Debug log

      if (!userData || !userRole || !token) {
        throw new Error('Invalid login response format');
      }

      // Use the login function from AuthContext
      login(userData, userRole, token);
      
      console.log('Login completed, navigating to dashboard...'); // Debug log
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err); // Debug log
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-lg">
        <div className="flex flex-col items-center">
          <img 
            src="/logo.jpg" 
            alt="Sorath Masala" 
            className="w-48 mx-auto mb-4"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <h2 className="text-center text-2xl font-bold text-red-600">
            {loginType === 'admin' ? 'Owner Portal' : 'Warehouse Portal'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your credentials to access the dashboard
          </p>
        </div>

        {/* Login Type Toggle */}
        <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setLoginType('admin');
              setError(''); // Clear any existing errors
            }}
            className={cn(
              "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors",
              loginType === 'admin'
                ? "bg-white text-red-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Owner
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginType('warehouse');
              setError(''); // Clear any existing errors
            }}
            className={cn(
              "flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors",
              loginType === 'warehouse'
                ? "bg-white text-red-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Warehouse
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
            <p className="font-medium">Login Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className={cn(
                  "appearance-none relative block w-full px-4 py-3 border",
                  "border-gray-300 placeholder-gray-400 text-gray-900 rounded-md",
                  "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                )}
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={cn(
                  "appearance-none relative block w-full px-4 py-3 border",
                  "border-gray-300 placeholder-gray-400 text-gray-900 rounded-md",
                  "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                )}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md",
                "text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500",
                "transition duration-150 ease-in-out",
                loading && "opacity-70 cursor-not-allowed"
              )}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : `Sign in as ${loginType === 'admin' ? 'Owner' : 'Warehouse'}`}
            </button>
          </div>
        </form>

        {/* Debug information in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <p>Login Type: {loginType}</p>
            <p>API URL: {API_URL}</p>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;