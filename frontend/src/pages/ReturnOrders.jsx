import React, { useState, useEffect, useContext } from 'react';
import { 
  RotateCcw, 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  Package,
  User,
  Building,
  Calendar,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { AuthContext } from '../App';
import { API_URL } from '../config';
import { currencyUtils, dateUtils } from '../lib/utils';

const ReturnOrders = () => {
  const { role } = useContext(AuthContext);
  const [returns, setReturns] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [selectedReturns, setSelectedReturns] = useState([]);

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const params = new URLSearchParams();
      if (selectedWarehouse) params.append('warehouseId', selectedWarehouse);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const [returnsRes, statsRes, warehousesRes, dealersRes, salesmenRes, itemsRes] = await Promise.all([
        fetch(`${API_URL}/returns?${params}`, { headers }),
        fetch(`${API_URL}/returns/stats?${selectedWarehouse ? `warehouseId=${selectedWarehouse}` : ''}`, { headers }),
        role === 'owner' ? fetch(`${API_URL}/users/warehouses`, { headers }) : Promise.resolve({ json: () => ({ data: [] }) }),
        fetch(`${API_URL}/users/dealers`, { headers }),
        fetch(`${API_URL}/users/salesmen`, { headers }),
        fetch(`${API_URL}/items`, { headers })
      ]);

      const [returnsData, statsData, warehousesData, dealersData, salesmenData, itemsData] = await Promise.all([
        returnsRes.json(),
        statsRes.json(),
        warehousesRes.json(),
        dealersRes.json(),
        salesmenRes.json(),
        itemsRes.json()
      ]);

      setReturns(returnsData.data || []);
      setStats(statsData.data || {});
      setWarehouses(warehousesData.data || []);
      setDealers(dealersData.data || []);
      setSalesmen(salesmenData.data || []);
      setItems(itemsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createReturn = async (returnData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/returns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(returnData)
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
        setShowCreateModal(false);
        alert(`Return order created successfully! Return Number: ${data.data.returnNumber}`);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error creating return:', error);
      alert('Error creating return order');
    }
  };

  const updateReturnStatus = async (returnId, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/returns/${returnId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteReturn = async (returnId) => {
    if (!confirm('Are you sure you want to delete this return order?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/returns/${returnId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
        alert('Return order deleted successfully');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error deleting return:', error);
      alert('Error deleting return order');
    }
  };

  const filteredReturns = returns.filter(returnOrder => {
    const matchesSearch = returnOrder.return_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnOrder.dealer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnOrder.salesman_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnOrder.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnOrder.warehouse_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const CreateReturnModal = () => {
    const [formData, setFormData] = useState({
      warehouseId: '',
      dealerId: '',
      salesmanId: '',
      itemId: '',
      quantity: '',
      reason: '',
      originalOrderId: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (!formData.warehouseId || !formData.itemId || !formData.quantity) {
        alert('Please fill all required fields');
        return;
      }

      if (!formData.dealerId && !formData.salesmanId) {
        alert('Please select either dealer or salesman');
        return;
      }

      createReturn({
        warehouseId: parseInt(formData.warehouseId),
        dealerId: formData.dealerId ? parseInt(formData.dealerId) : null,
        salesmanId: formData.salesmanId ? parseInt(formData.salesmanId) : null,
        itemId: parseInt(formData.itemId),
        quantity: parseInt(formData.quantity),
        reason: formData.reason.trim() || null,
        originalOrderId: formData.originalOrderId ? parseInt(formData.originalOrderId) : null
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-medium mb-4">Create Return Order</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.warehouseId}
                onChange={(e) => setFormData({...formData, warehouseId: e.target.value})}
                required
              >
                <option value="">Select warehouse</option>
                {warehouses.filter(w => w.status === 'active').map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dealer</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.dealerId}
                  onChange={(e) => setFormData({...formData, dealerId: e.target.value})}
                >
                  <option value="">Select dealer</option>
                  {dealers.filter(d => d.status === 'active').map(dealer => (
                    <option key={dealer.id} value={dealer.id}>
                      {dealer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salesman</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.salesmanId}
                  onChange={(e) => setFormData({...formData, salesmanId: e.target.value})}
                >
                  <option value="">Select salesman</option>
                  {salesmen.filter(s => s.status === 'active').map(salesman => (
                    <option key={salesman.id} value={salesman.id}>
                      {salesman.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.itemId}
                onChange={(e) => setFormData({...formData, itemId: e.target.value})}
                required
              >
                <option value="">Select item</option>
                {items.filter(i => i.status === 'active').map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} - {currencyUtils.format(item.price)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Order ID</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.originalOrderId}
                onChange={(e) => setFormData({...formData, originalOrderId: e.target.value})}
                placeholder="Enter original order ID (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                placeholder="Enter reason for return"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Create Return
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ViewReturnModal = () => {
    if (!selectedReturn) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Return Order Details</h3>
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedReturn(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <FileText className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Return Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Return Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Return Number:</span>
                    <span className="font-medium">{selectedReturn.return_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Return Date:</span>
                    <span>{dateUtils.formatDateTime(selectedReturn.return_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <StatusBadge status={selectedReturn.status} />
                  </div>
                  {selectedReturn.original_order_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Original Order:</span>
                      <span className="font-medium">{selectedReturn.original_order_number}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Return Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Item:</span>
                    <span className="font-medium">{selectedReturn.item_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-bold">{selectedReturn.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit Price:</span>
                    <span>{currencyUtils.format(selectedReturn.item_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Value:</span>
                    <span className="font-bold text-lg">
                      {currencyUtils.format(selectedReturn.quantity * selectedReturn.item_price)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Warehouse</h4>
                <div className="text-sm">
                  <p className="font-medium">{selectedReturn.warehouse_name}</p>
                  <p className="text-gray-600">{selectedReturn.warehouse_address}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Customer</h4>
                <div className="text-sm">
                  {selectedReturn.dealer_name && (
                    <div>
                      <p className="font-medium">{selectedReturn.dealer_name}</p>
                      <p className="text-gray-600">{selectedReturn.dealer_agency}</p>
                      <p className="text-gray-600">{selectedReturn.dealer_mobile}</p>
                    </div>
                  )}
                  {selectedReturn.salesman_name && (
                    <div className="mt-2">
                      <p className="text-gray-600">Salesman: {selectedReturn.salesman_name}</p>
                      <p className="text-gray-600">{selectedReturn.salesman_mobile}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Return Reason */}
            {selectedReturn.reason && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Return Reason</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-700">{selectedReturn.reason}</p>
                </div>
              </div>
            )}

            {/* Status Actions */}
            {selectedReturn.status === 'pending' && (
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    updateReturnStatus(selectedReturn.id, 'rejected');
                    setShowViewModal(false);
                    setSelectedReturn(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    updateReturnStatus(selectedReturn.id, 'approved');
                    setShowViewModal(false);
                    setSelectedReturn(null);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            )}
          </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Return Orders</h1>
          <p className="text-gray-600">Manage product returns and refunds</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Return
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <RotateCcw className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Returns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_returns || 0}</p>
              <p className="text-sm text-gray-600">{stats.pending_returns || 0} pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Return Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencyUtils.format(stats.total_return_value || 0)}
              </p>
              <p className="text-sm text-gray-600">
                Avg: {currencyUtils.format(stats.avg_return_value || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved_returns || 0}</p>
              <p className="text-sm text-gray-600">
                Value: {currencyUtils.format(stats.approved_value || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Returns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.recent_returns || 0}</p>
              <p className="text-sm text-gray-600">Last 30 days</p>
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
                placeholder="Search returns..."
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
                <option value="">All Warehouses</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="sm:w-40">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Return Orders ({filteredReturns.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Return
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
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
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReturns.map((returnOrder) => (
                <tr key={returnOrder.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-100 rounded-lg mr-3">
                        <RotateCcw className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{returnOrder.return_number}</div>
                        <div className="text-sm text-gray-500">ID: {returnOrder.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{returnOrder.item_name}</div>
                    <div className="text-sm text-gray-500">{currencyUtils.format(returnOrder.item_price)} per unit</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {returnOrder.dealer_name && (
                        <div className="text-sm font-medium text-gray-900">{returnOrder.dealer_name}</div>
                      )}
                      {returnOrder.dealer_agency && (
                        <div className="text-sm text-gray-500">{returnOrder.dealer_agency}</div>
                      )}
                      {returnOrder.salesman_name && (
                        <div className="text-sm text-gray-500">via {returnOrder.salesman_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{returnOrder.warehouse_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{returnOrder.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {currencyUtils.format(returnOrder.quantity * returnOrder.item_price)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={returnOrder.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dateUtils.formatDate(returnOrder.return_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedReturn(returnOrder);
                          setShowViewModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="View Return"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {returnOrder.status === 'pending' && (
                        <>
                          <select
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                            value={returnOrder.status}
                            onChange={(e) => updateReturnStatus(returnOrder.id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          
                          <button
                            onClick={() => deleteReturn(returnOrder.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                            title="Delete Return"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReturns.length === 0 && (
          <div className="text-center py-12">
            <RotateCcw className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No return orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating a new return order.'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && <CreateReturnModal />}
      {showViewModal && <ViewReturnModal />}
    </div>
  );
};

export default ReturnOrders;