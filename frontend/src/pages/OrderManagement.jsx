import React, { useState, useEffect, useContext } from 'react';
import { 
  ShoppingCart, 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  Package,
  Truck,
  Check,
  X,
  Clock,
  DollarSign,
  User,
  Building,
  Calendar,
  FileText,
  Download,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { AuthContext } from '../App';
import { API_URL } from '../config';
import { currencyUtils, dateUtils } from '../lib/utils';

const OrderManagement = () => {
  const { role } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [transportFilter, setTransportFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrders, setSelectedOrders] = useState([]);

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse, transportFilter, paymentFilter]);

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
      if (transportFilter !== 'all') params.append('transportStatus', transportFilter);
      if (paymentFilter !== 'all') params.append('paymentStatus', paymentFilter);

      const [ordersRes, statsRes, warehousesRes, dealersRes, salesmenRes, itemsRes] = await Promise.all([
        fetch(`${API_URL}/orders?${params}`, { headers }),
        fetch(`${API_URL}/orders/stats?${selectedWarehouse ? `warehouseId=${selectedWarehouse}` : ''}`, { headers }),
        role === 'owner' ? fetch(`${API_URL}/users/warehouses`, { headers }) : Promise.resolve({ json: () => ({ data: [] }) }),
        fetch(`${API_URL}/users/dealers`, { headers }),
        fetch(`${API_URL}/users/salesmen`, { headers }),
        fetch(`${API_URL}/items`, { headers })
      ]);

      const [ordersData, statsData, warehousesData, dealersData, salesmenData, itemsData] = await Promise.all([
        ordersRes.json(),
        statsRes.json(),
        warehousesRes.json(),
        dealersRes.json(),
        salesmenRes.json(),
        itemsRes.json()
      ]);

      setOrders(ordersData.data || []);
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

  const createOrder = async (orderData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
        setShowCreateModal(false);
        alert(`Order created successfully! Order Number: ${data.data.orderNumber}`);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order');
    }
  };

  const updateOrderStatus = async (orderId, statusData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusData)
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

  const deleteOrder = async (orderId) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
        alert('Order deleted successfully');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Error deleting order');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.dealer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.salesman_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.warehouse_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const StatusBadge = ({ status, type }) => {
    const getConfig = () => {
      if (type === 'transport') {
        const configs = {
          pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
          dispatched: { color: 'bg-blue-100 text-blue-800', icon: Truck, text: 'Dispatched' },
          delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Delivered' },
          cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Cancelled' }
        };
        return configs[status] || configs.pending;
      } else {
        const configs = {
          pending: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, text: 'Pending' },
          partial: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Partial' },
          paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Paid' }
        };
        return configs[status] || configs.pending;
      }
    };
    
    const config = getConfig();
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const CreateOrderModal = () => {
    const [formData, setFormData] = useState({
      warehouseId: '',
      dealerId: '',
      salesmanId: '',
      items: [{ item_id: '', quantity: '', price_per_item: '' }]
    });

    const addItem = () => {
      setFormData({
        ...formData,
        items: [...formData.items, { item_id: '', quantity: '', price_per_item: '' }]
      });
    };

    const removeItem = (index) => {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    };

    const updateItem = (index, field, value) => {
      const newItems = formData.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      );
      setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (!formData.warehouseId || (!formData.dealerId && !formData.salesmanId)) {
        alert('Please select warehouse and either dealer or salesman');
        return;
      }

      const validItems = formData.items.filter(item => 
        item.item_id && item.quantity && item.price_per_item
      );

      if (validItems.length === 0) {
        alert('Please add at least one valid item');
        return;
      }

      createOrder({
        warehouseId: parseInt(formData.warehouseId),
        dealerId: formData.dealerId ? parseInt(formData.dealerId) : null,
        salesmanId: formData.salesmanId ? parseInt(formData.salesmanId) : null,
        items: validItems.map(item => ({
          item_id: parseInt(item.item_id),
          quantity: parseInt(item.quantity),
          price_per_item: parseFloat(item.price_per_item)
        }))
      });
    };

    const calculateTotal = () => {
      return formData.items.reduce((total, item) => {
        if (item.quantity && item.price_per_item) {
          return total + (parseInt(item.quantity) * parseFloat(item.price_per_item));
        }
        return total;
      }, 0);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-medium mb-4">Create New Order</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse</label>
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
                      {dealer.name} ({dealer.agency_name})
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
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">Order Items</label>
                <button
                  type="button"
                  onClick={addItem}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Add Item
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-gray-200 rounded-md">
                    <div>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                        value={item.item_id}
                        onChange={(e) => {
                          const selectedItem = items.find(i => i.id === parseInt(e.target.value));
                          updateItem(index, 'item_id', e.target.value);
                          if (selectedItem) {
                            updateItem(index, 'price_per_item', selectedItem.price);
                          }
                        }}
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
                      <input
                        type="number"
                        min="1"
                        placeholder="Quantity"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Price per item"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
                        value={item.price_per_item}
                        onChange={(e) => updateItem(index, 'price_per_item', e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {item.quantity && item.price_per_item ? 
                          currencyUtils.format(parseInt(item.quantity) * parseFloat(item.price_per_item)) : 
                          '₹0'
                        }
                      </span>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-3 text-right">
                <span className="text-lg font-bold text-gray-900">
                  Total: {currencyUtils.format(calculateTotal())}
                </span>
              </div>
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
                Create Order
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ViewOrderModal = () => {
    if (!selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Order Details</h3>
            <button
              onClick={() => {
                setShowViewModal(false);
                setSelectedOrder(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Order Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Order Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium">{selectedOrder.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span>{dateUtils.formatDateTime(selectedOrder.order_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-lg">{currencyUtils.format(selectedOrder.total_amount)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Transport:</span>
                    <StatusBadge status={selectedOrder.transport_status} type="transport" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment:</span>
                    <StatusBadge status={selectedOrder.payment_status} type="payment" />
                  </div>
                  {selectedOrder.dispatch_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dispatched:</span>
                      <span>{dateUtils.formatDateTime(selectedOrder.dispatch_date)}</span>
                    </div>
                  )}
                  {selectedOrder.delivery_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivered:</span>
                      <span>{dateUtils.formatDateTime(selectedOrder.delivery_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Warehouse</h4>
                <div className="text-sm">
                  <p className="font-medium">{selectedOrder.warehouse_name}</p>
                  <p className="text-gray-600">{selectedOrder.warehouse_address}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Customer</h4>
                <div className="text-sm">
                  {selectedOrder.dealer_name && (
                    <div>
                      <p className="font-medium">{selectedOrder.dealer_name}</p>
                      <p className="text-gray-600">{selectedOrder.dealer_agency}</p>
                      <p className="text-gray-600">{selectedOrder.dealer_mobile}</p>
                    </div>
                  )}
                  {selectedOrder.salesman_name && (
                    <div className="mt-2">
                      <p className="text-gray-600">Salesman: {selectedOrder.salesman_name}</p>
                      <p className="text-gray-600">{selectedOrder.salesman_mobile}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            {selectedOrder.items && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.item_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{currencyUtils.format(item.price_per_item)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{currencyUtils.format(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600">Manage customer orders and track deliveries</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Order
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_orders || 0}</p>
              <p className="text-sm text-gray-600">{stats.pending_orders || 0} pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencyUtils.format(stats.total_revenue || 0)}
              </p>
              <p className="text-sm text-gray-600">
                Avg: {currencyUtils.format(stats.avg_order_value || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Truck className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dispatched</p>
              <p className="text-2xl font-bold text-gray-900">{stats.dispatched_orders || 0}</p>
              <p className="text-sm text-gray-600">{stats.delivered_orders || 0} delivered</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending_payments || 0}</p>
              <p className="text-sm text-gray-600">{stats.partial_payments || 0} partial</p>
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
                placeholder="Search orders..."
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
              value={transportFilter}
              onChange={(e) => setTransportFilter(e.target.value)}
            >
              <option value="all">All Transport</option>
              <option value="pending">Pending</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="sm:w-40">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Orders ({filteredOrders.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouse
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transport
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
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
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                        <div className="text-sm text-gray-500">ID: {order.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {order.dealer_name && (
                        <div className="text-sm font-medium text-gray-900">{order.dealer_name}</div>
                      )}
                      {order.dealer_agency && (
                        <div className="text-sm text-gray-500">{order.dealer_agency}</div>
                      )}
                      {order.salesman_name && (
                        <div className="text-sm text-gray-500">via {order.salesman_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.warehouse_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {currencyUtils.format(order.total_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={order.transport_status} type="transport" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={order.payment_status} type="payment" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dateUtils.formatDate(order.order_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('adminToken');
                            const response = await fetch(`${API_URL}/orders/${order.id}`, {
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              }
                            });
                            const data = await response.json();
                            if (data.success) {
                              setSelectedOrder(data.data);
                              setShowViewModal(true);
                            }
                          } catch (error) {
                            console.error('Error fetching order details:', error);
                          }
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="View Order"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      {(order.transport_status === 'pending' || order.transport_status === 'dispatched') && (
                        <select
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                          value={order.transport_status}
                          onChange={(e) => updateOrderStatus(order.id, { transportStatus: e.target.value })}
                        >
                          <option value="pending">Pending</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                      
                      {order.transport_status === 'pending' && (
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          title="Delete Order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating a new order.'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && <CreateOrderModal />}
      {showViewModal && <ViewOrderModal />}
    </div>
  );
};

export default OrderManagement;