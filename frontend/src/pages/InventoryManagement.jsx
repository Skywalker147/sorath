import React, { useState, useEffect, useContext } from 'react';
import { 
  Package, 
  Warehouse,
  Plus,
  Minus,
  Edit,
  Search,
  Filter,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Package2,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Eye,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Info
} from 'lucide-react';
import { AuthContext } from '../App';
import { API_URL } from '../config';
import { currencyUtils, dateUtils } from '../lib/utils';

const InventoryManagement = () => {
  const { role } = useContext(AuthContext);
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);

  // Check if user can modify inventory (only warehouse users)
  const canModifyInventory = role === 'warehouse';

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse, showLowStock]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const params = new URLSearchParams();
      if (selectedWarehouse !== 'all') {
        params.append('warehouseId', selectedWarehouse);
      }
      if (showLowStock) {
        params.append('lowStock', lowStockThreshold);
      }

      const [inventoryRes, statsRes, warehousesRes, itemsRes] = await Promise.all([
        fetch(`${API_URL}/inventory?${params}`, { headers }),
        fetch(`${API_URL}/inventory/stats?${selectedWarehouse !== 'all' ? `warehouseId=${selectedWarehouse}` : ''}`, { headers }),
        role === 'owner' ? fetch(`${API_URL}/users/warehouses`, { headers }) : Promise.resolve({ json: () => ({ data: [] }) }),
        fetch(`${API_URL}/items`, { headers })
      ]);

      const [inventoryData, statsData, warehousesData, itemsData] = await Promise.all([
        inventoryRes.json(),
        statsRes.json(),
        warehousesRes.json(),
        itemsRes.json()
      ]);

      setInventory(inventoryData.data || []);
      setStats(statsData.data || {});
      setWarehouses(warehousesData.data || []);
      setItems(itemsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateInventory = async (warehouseId, itemId, quantity, type = 'set') => {
    if (!canModifyInventory) {
      alert('Only warehouse users can modify inventory');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/inventory/warehouse/${warehouseId}/item/${itemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity, type })
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
        setShowUpdateModal(false);
        setSelectedInventory(null);
        alert('Inventory updated successfully');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert('Error updating inventory');
    }
  };

  const addInventory = async (itemId, quantity) => {
    if (!canModifyInventory) {
      alert('Only warehouse users can add inventory');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const { id: userId } = JSON.parse(localStorage.getItem('adminUser')); // Get warehouse ID
      
      const response = await fetch(`${API_URL}/inventory/warehouse/${userId}/item/${itemId}`, {
        method: 'POST', // Changed from PUT to POST for adding new items
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: parseInt(quantity) })
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
        setShowAddModal(false);
        alert('Inventory added successfully');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error adding inventory:', error);
      alert('Error adding inventory');
    }
  };

  const transferInventory = async (fromWarehouseId, toWarehouseId, itemId, quantity) => {
    if (role !== 'owner') {
      alert('Only owner can transfer inventory between warehouses');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/inventory/transfer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fromWarehouseId, toWarehouseId, itemId, quantity })
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
        setShowTransferModal(false);
        setSelectedInventory(null);
        alert('Inventory transferred successfully');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error transferring inventory:', error);
      alert('Error transferring inventory');
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.warehouse_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const UpdateInventoryModal = () => {
    const [updateType, setUpdateType] = useState('set');
    const [quantity, setQuantity] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!quantity || isNaN(quantity) || quantity < 0) {
        alert('Please enter a valid quantity');
        return;
      }
      updateInventory(
        selectedInventory.warehouse_id,
        selectedInventory.item_id,
        parseInt(quantity),
        updateType
      );
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-medium mb-4">Update Inventory</h3>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>Item:</strong> {selectedInventory?.item_name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Warehouse:</strong> {selectedInventory?.warehouse_name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Current Quantity:</strong> {selectedInventory?.quantity}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Update Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={updateType}
                onChange={(e) => setUpdateType(e.target.value)}
              >
                <option value="set">Set to</option>
                <option value="add">Add</option>
                <option value="subtract">Subtract</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelectedInventory(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AddInventoryModal = () => {
    const [selectedItemId, setSelectedItemId] = useState('');
    const [quantity, setQuantity] = useState('');

    // Get items that are not in current warehouse or have zero quantity
    const availableItems = items.filter(item => {
      const existingInventory = inventory.find(inv => inv.item_id === item.id);
      return !existingInventory || existingInventory.quantity === 0;
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!selectedItemId || !quantity || isNaN(quantity) || quantity <= 0) {
        alert('Please select an item and enter a valid quantity');
        return;
      }
      addInventory(selectedItemId, quantity);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-medium mb-4">Add Inventory Item</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Item</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                required
              >
                <option value="">Choose an item</option>
                {availableItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {currencyUtils.format(item.price)}
                  </option>
                ))}
              </select>
              {availableItems.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  All items are already in your inventory. Use edit to update quantities.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label>
              <input
                type="number"
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedItemId('');
                  setQuantity('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={availableItems.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add Item
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const TransferInventoryModal = () => {
    const [toWarehouseId, setToWarehouseId] = useState('');
    const [quantity, setQuantity] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!toWarehouseId || !quantity || isNaN(quantity) || quantity <= 0) {
        alert('Please fill all fields with valid values');
        return;
      }
      if (parseInt(quantity) > selectedInventory.quantity) {
        alert('Transfer quantity cannot exceed available quantity');
        return;
      }
      transferInventory(
        selectedInventory.warehouse_id,
        parseInt(toWarehouseId),
        selectedInventory.item_id,
        parseInt(quantity)
      );
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-medium mb-4">Transfer Inventory</h3>
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <strong>Item:</strong> {selectedInventory?.item_name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>From:</strong> {selectedInventory?.warehouse_name}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Available:</strong> {selectedInventory?.quantity}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Warehouse</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={toWarehouseId}
                onChange={(e) => setToWarehouseId(e.target.value)}
                required
              >
                <option value="">Select warehouse</option>
                {warehouses
                  .filter(w => w.id !== selectedInventory?.warehouse_id && w.status === 'active')
                  .map(warehouse => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))
                }
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                max={selectedInventory?.quantity}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity to transfer"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowTransferModal(false);
                  setSelectedInventory(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Transfer
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">
            {role === 'owner' 
              ? 'View warehouse stock and inventory levels' 
              : 'Manage warehouse stock and inventory levels'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          {canModifyInventory && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </button>
          )}
          <button
            onClick={fetchData}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Role-based Info Banner */}
      {role === 'owner' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Owner View Mode</h3>
              <p className="text-sm text-blue-700">
                You can view inventory across all warehouses. Only warehouse users can modify inventory quantities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_items || 0}</p>
              <p className="text-sm text-gray-600">Across {stats.total_warehouses || 0} warehouses</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Quantity</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_quantity?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600">Avg: {Math.round(stats.avg_quantity || 0)} per item</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencyUtils.format(stats.total_value || 0)}
              </p>
              <p className="text-sm text-gray-600">Inventory worth</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">{stats.lowStockCount || 0}</p>
              <p className="text-sm text-gray-600">{stats.outOfStockCount || 0} out of stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items or warehouses..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {role === 'owner' && (
            <div className="sm:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
              >
                <option value="all">All Warehouses</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="lowStock"
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
            />
            <label htmlFor="lowStock" className="text-sm text-gray-700">
              Low Stock Only
            </label>
          </div>

          <div className="sm:w-24">
            <input
              type="number"
              min="1"
              placeholder="Threshold"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Inventory ({filteredInventory.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={`${item.warehouse_id}-${item.item_id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <Package2 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                        <div className="text-sm text-gray-500">{currencyUtils.format(item.item_price)} per unit</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Warehouse className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.warehouse_name}</div>
                        <div className="text-sm text-gray-500">{item.warehouse_address}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-lg font-bold ${
                        item.quantity <= 5 ? 'text-red-600' : 
                        item.quantity <= 10 ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {item.quantity}
                      </span>
                      {item.quantity <= 10 && (
                        <AlertTriangle className="h-4 w-4 text-orange-500 ml-2" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {currencyUtils.format(item.quantity * item.item_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.quantity === 0 ? 'bg-red-100 text-red-800' :
                      item.quantity <= 5 ? 'bg-orange-100 text-orange-800' :
                      item.quantity <= 10 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.quantity === 0 ? 'Out of Stock' :
                       item.quantity <= 5 ? 'Critical' :
                       item.quantity <= 10 ? 'Low Stock' :
                       'In Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dateUtils.formatDateTime(item.updated_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {canModifyInventory && (
                        <button
                          onClick={() => {
                            setSelectedInventory(item);
                            setShowUpdateModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                          title="Update Inventory"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      
                      {!canModifyInventory && (
                        <button
                          className="p-2 text-gray-400 hover:bg-gray-50 rounded-md"
                          title="View Only (Owner Mode)"
                          disabled
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      
                      {role === 'owner' && (
                        <button
                          onClick={() => {
                            setSelectedInventory(item);
                            setShowTransferModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-md"
                          title="Transfer Inventory"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'No inventory items to display.'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && canModifyInventory && (
        <AddInventoryModal />
      )}

      {showUpdateModal && selectedInventory && canModifyInventory && (
        <UpdateInventoryModal />
      )}

      {showTransferModal && selectedInventory && role === 'owner' && (
        <TransferInventoryModal />
      )}
    </div>
  );
};

export default InventoryManagement;