import React, { useContext } from 'react';
import { AuthContext } from '../App';

const DebugAuth = () => {
  const { user, role } = useContext(AuthContext);

  const localStorageData = {
    token: localStorage.getItem('adminToken'),
    user: localStorage.getItem('adminUser'),
    role: localStorage.getItem('adminRole')
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminRole');
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="text-sm font-bold text-gray-800 mb-2">Auth Debug Info</h3>
      
      <div className="text-xs space-y-1">
        <div>
          <strong>Context Role:</strong> 
          <span className={`ml-1 px-2 py-1 rounded ${
            role === 'owner' ? 'bg-blue-100 text-blue-800' : 
            role === 'warehouse' ? 'bg-green-100 text-green-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {role || 'null'}
          </span>
        </div>
        
        <div>
          <strong>Context User:</strong> 
          <span className="ml-1 text-gray-600">
            {user ? user.username || user.name : 'null'}
          </span>
        </div>
        
        <div>
          <strong>LocalStorage Role:</strong> 
          <span className="ml-1 text-gray-600">
            {localStorageData.role || 'null'}
          </span>
        </div>
        
        <div>
          <strong>LocalStorage User:</strong> 
          <span className="ml-1 text-gray-600">
            {localStorageData.user ? 'exists' : 'null'}
          </span>
        </div>
        
        <div>
          <strong>Token:</strong> 
          <span className="ml-1 text-gray-600">
            {localStorageData.token ? 'exists' : 'null'}
          </span>
        </div>
      </div>
      
      <button 
        onClick={clearLocalStorage}
        className="mt-2 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
      >
        Clear Storage & Reload
      </button>
    </div>
  );
};

export default DebugAuth;