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
    const token = localStorage.getItem('adminToken');
    const savedUser = localStorage.getItem('adminUser');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setRole('owner'); // For now, assuming admin is owner
        
        // Verify token with backend
        verifyToken(token);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        logout();
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    }
  };

  const login = (userData, userRole, token) => {
    setUser(userData);
    setRole(userRole);
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, role, login, logout }}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {user ? (
            <div className="flex h-screen overflow-hidden">
              {/* Sidebar */}
              <Sidebar collapsed={sidebarCollapsed} role={role} />
              
              {/* Main content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar 
                  user={user} 
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