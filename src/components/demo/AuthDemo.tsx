import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AuthDemo: React.FC = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  const handleTestLogin = () => {
    // Simulate a successful login
    const mockUser = {
      id: '12345',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user'
    };
    const mockToken = 'mock-jwt-token-' + Date.now();
    login(mockUser, mockToken);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Auth Middleware Demo</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          <strong>Status:</strong> {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
        </p>
      </div>

      {user && (
        <div className="mb-4 p-3 bg-green-50 rounded-md">
          <p className="text-sm font-medium text-green-800">User Info:</p>
          <p className="text-sm text-green-700">ID: {user.id}</p>
          <p className="text-sm text-green-700">Email: {user.email}</p>
          <p className="text-sm text-green-700">Name: {user.name}</p>
          <p className="text-sm text-green-700">Role: {user.role}</p>
        </div>
      )}

      <div className="space-y-2">
        {!isAuthenticated ? (
          <button
            onClick={handleTestLogin}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Test Login
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>Try navigating to protected routes like:</p>
        <ul className="list-disc list-inside mt-1">
          <li>/dashboard</li>
          <li>/my-reservations</li>
          <li>/profile</li>
        </ul>
        <p className="mt-2">
          When not authenticated, you'll be redirected to /signin.
          When authenticated, visiting /signin will redirect to /dashboard.
        </p>
      </div>
    </div>
  );
};

export default AuthDemo;