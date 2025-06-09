import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import ItemManagement from './pages/ItemManagement';
import InventoryManagement from './pages/InventoryManagement';
import OrderManagement from './pages/OrderManagement';
import ReturnOrders from './pages/ReturnOrders';
import WarehouseManagement from './pages/WarehouseManagement';
import PaymentManagement from './pages/PaymentManagement';
import Statistics from './pages/Statistics';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import { API_URL } from './config';

// Auth Context
export const AuthContext = React.createContext();

const App = () => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check if user is authenticated on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('adminToken');
      const savedUser = localStorage.getItem('adminUser');
      const savedRole = localStorage.getItem('adminRole');
      
      console.log('Initializing auth with:', { 
        hasToken: !!token, 
        hasSavedUser: !!savedUser, 
        savedRole 
      });

      if (token && savedUser && savedRole) {
        try {
          const userData = JSON.parse(savedUser);
          console.log('Parsed user data:', userData);
          
          // Set user data immediately (don't wait for verification)
          setUser(userData);
          setRole(savedRole);
          
          // Verify token in background
          await verifyToken(token, userData, savedRole);
        } catch (error) {
          console.error('Error parsing saved user:', error);
          logout();
        }
      } else {
        console.log('Missing auth data, logging out');
        logout();
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const verifyToken = async (token, fallbackUser, fallbackRole) => {
    try {
      console.log('Verifying token...');
      
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Token verification response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Token verification successful:', data);
        
        if (data.success && data.user && data.role) {
          // Update with fresh data from server
          setUser(data.user);
          setRole(data.role);
          localStorage.setItem('adminUser', JSON.stringify(data.user));
          localStorage.setItem('adminRole', data.role);
          console.log('Updated auth data from server');
        }
      } else {
        // Token is invalid, but don't logout immediately
        // Let user continue with cached data for now
        console.warn('Token verification failed, but keeping cached session');
        
        // Optionally, you could show a warning that they need to re-login soon
        // For now, we'll just log the issue
        
        // Only logout if it's a 401 Unauthorized
        if (response.status === 401) {
          console.log('Token expired or invalid, logging out');
          logout();
        }
      }
    } catch (error) {
      console.error('Token verification error:', error);
      // Don't logout on network errors - user might be offline
      console.log('Network error during token verification, keeping cached session');
    }
  };

  const login = (userData, userRole, token) => {
    console.log('Login called with:', { userData, userRole, hasToken: !!token });
    
    setUser(userData);
    setRole(userRole);
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(userData));
    localStorage.setItem('adminRole', userRole);
    
    console.log('Login successful, data saved to localStorage');
  };

  const logout = () => {
    console.log('Logout called');
    
    setUser(null);
    setRole(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminRole');
    
    console.log('Logout completed, localStorage cleared');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Debug: Log current state changes
  useEffect(() => {
    console.log('Auth state changed:', { 
      user: user?.username || user?.name, 
      role, 
      loading 
    });
  }, [user, role, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, role, login, logout }}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {user && role ? (
            <div className="flex h-screen overflow-hidden">
              {/* Sidebar */}
              <Sidebar collapsed={sidebarCollapsed} role={role} />
              
              {/* Main content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar 
                  user={user} 
                  role={role}
                  onToggleSidebar={toggleSidebar}
                  sidebarCollapsed={sidebarCollapsed}
                />
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    
                    {/* Owner-only routes */}
                    {role === 'owner' && (
                      <>
                        <Route path="/users" element={<UserManagement />} />
                        <Route path="/items" element={<ItemManagement />} />
                        <Route path="/warehouses" element={<WarehouseManagement />} />
                        <Route path="/payments" element={<PaymentManagement />} />
                        <Route path="/statistics" element={<Statistics />} />
                      </>
                    )}
                    
                    {/* Owner and Warehouse routes */}
                    {['owner', 'warehouse'].includes(role) && (
                      <>
                        <Route path="/inventory" element={<InventoryManagement />} />
                        <Route path="/orders" element={<OrderManagement />} />
                        <Route path="/returns" element={<ReturnOrders />} />
                      </>
                    )}
                    
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          ) : (
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          )}
        </div>
      </Router>
    </AuthContext.Provider>
  );
};

export default App;