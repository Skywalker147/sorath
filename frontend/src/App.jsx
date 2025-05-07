import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Authentication
import Login from './pages/Login';

// Dashboard & Main Pages
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import ItemForm from './pages/ItemForm';
import Inventory from './pages/Inventory';
import InventoryItem from './pages/InventoryItem';
import InventoryHistory from './pages/InventoryHistory';
import Orders from './pages/Orders';

function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        
        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Item Management */}
        <Route path="/items" element={<Items />} />
        <Route path="/items/new" element={<ItemForm />} />
        <Route path="/items/:id/edit" element={<ItemForm />} />
        
        {/* Inventory Management */}
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/inventory/:id" element={<InventoryItem />} />
        <Route path="/inventory/history" element={<InventoryHistory />} />
        <Route path="/inventory/:id/history" element={<InventoryHistory />} />
        
        {/* Orders */}
        <Route path="/orders" element={<Orders />} />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;