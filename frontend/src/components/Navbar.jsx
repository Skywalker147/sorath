import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ admin, onLogout }) => {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <img 
                src="/logo.jpg" 
                alt="Sorath Masala" 
                className="h-10 w-auto"
              />
            </Link>
            <h1 className="text-xl font-bold text-red-600">Sorath Masala</h1>
          </div>
          
          {admin && (
            <div className="flex items-center">
              <div className="flex flex-col items-end mr-4">
                <span className="text-sm text-gray-600">Welcome,</span>
                <span className="font-medium text-gray-900">{admin.name}</span>
              </div>
              <button
                onClick={onLogout}
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-150 ease-in-out flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;