import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Login from './pages/Login';
import { useAuth } from './contexts/AuthContext';

// Dashboard & Main Pages
import ItemForm from './pages/ItemForm';
import InventoryItem from './pages/InventoryItem';
import InventoryHistory from './pages/InventoryHistory';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="items" element={<Items />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="orders" element={<Orders />} />
        </Route>
        
        {/* Item Management */}
        <Route path="/items/new" element={<ItemForm />} />
        <Route path="/items/:id/edit" element={<ItemForm />} />
        
        {/* Inventory Management */}
        <Route path="/inventory/:id" element={<InventoryItem />} />
        <Route path="/inventory/history" element={<InventoryHistory />} />
        <Route path="/inventory/:id/history" element={<InventoryHistory />} />
      </Routes>
    </Router>
  );
}

export default App;