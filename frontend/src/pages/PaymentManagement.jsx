import React, { useState, useEffect, useContext } from 'react';
import { 
  CreditCard, 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  FileText,
  Download,
  Building,
  Phone
} from 'lucide-react';
import { AuthContext } from '../App';
import { API_URL } from '../config';
import { currencyUtils, dateUtils } from '../lib/utils';

const PaymentManagement = () => {
  const { role } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stats, setStats] = useState({});
  const [overduePayments, setOverduePayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [showOverdue, setShowOverdue] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse, statusFilter, methodFilter, showOverdue]);

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
      if (statusFilter !== 'all') params.append('paymentStatus', statusFilter);
      if (methodFilter !== 'all') params.append('paymentMethod', methodFilter);
      if (showOverdue) params.append('overdue', 'true');

      const [paymentsRes, statsRes, warehousesRes, overdueRes] = await Promise.all([
        fetch(`${API_URL}/payments?${params}`, { headers }),
        fetch(`${API_URL}/payments/stats?${selectedWarehouse ? `warehouseId=${selectedWarehouse}` : ''}`, { headers }),
        role === 'owner' ? fetch(`${API_URL}/users/warehouses`, { headers }) : Promise.resolve({ json: () => ({ data: [] }) }),
        fetch(`${API_URL}/payments/overdue?${selectedWarehouse ? `warehouseId=${selectedWarehouse}` : ''}`, { headers })
      ]);

      const [paymentsData, statsData, warehousesData, overdueData] = await Promise.all([
        paymentsRes.json(),
        statsRes.json(),
        warehousesRes.json(),
        overdueRes.json()
      ]);

      setPayments(paymentsData.data || []);
      setStats(statsData.data || {});
      setWarehouses(warehousesData.data || []);
      setOverduePayments(overdueData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async (paymentData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
        setShowCreateModal(false);
        alert('Payment recorded successfully');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Error recording payment');
    }
  };

  const updatePaymentStatus = async (paymentId, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/payments/${paymentId}/status`, {
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
      console.error('Error updating payment status:', error);
    }
  };

  const deletePayment = async (paymentId) => {
    if (!confirm('Are you sure you want to delete this payment record?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/payments/${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchData();
        alert('Payment deleted successfully');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Error deleting payment');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.dealer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.salesman_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Paid' },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Failed' }
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

  const PaymentMethodBadge = ({ method }) => {
    const methodConfig = {
      cash: { color: 'bg-green-100 text-green-800', text: 'Cash' },
      cheque: { color: 'bg-blue-100 text-blue-800', text: 'Cheque' },
      bank_transfer: { color: 'bg-purple-100 text-purple-800', text: 'Bank Transfer' },
      upi: { color: 'bg-orange-100 text-orange-800', text: 'UPI' },
      card: { color: 'bg-indigo-100 text-indigo-800', text: 'Card' },
      other: { color: 'bg-gray-100 text-gray-800', text: 'Other' }
    };
    
    const config = methodConfig[method] || methodConfig.other;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const CreatePaymentModal = () => {
    const [formData, setFormData] = useState({
      orderId: '',
      amount: '',
      paymentMethod: 'cash',
      transactionId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      notes: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (!formData.orderId || !formData.amount) {
        alert('Please fill all required fields');
        return;
      }

      createPayment({
        orderId: parseInt(formData.orderId),
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        transactionId: formData.transactionId.trim() || null,
        paymentDate: formData.paymentDate,
        dueDate: formData.dueDate || null,
        notes: formData.notes.trim() || null
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-medium mb-4">Record Payment</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order ID *</label>
              <input
                type="number"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.orderId}
                onChange={(e) => setFormData({...formData, orderId: e.target.value})}
                placeholder="Enter order ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                required
              >
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.transactionId}
                onChange={(e) => setFormData({...formData, transactionId: e.target.value})}
                placeholder="Enter transaction ID (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Enter any notes"
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
                Record Payment
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
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Track and manage customer payments</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Received</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencyUtils.format(stats.received_amount || 0)}
              </p>
              <p className="text-sm text-gray-600">{stats.completed_payments || 0} payments</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencyUtils.format(stats.pending_amount || 0)}
              </p>
              <p className="text-sm text-gray-600">{stats.pending_payments || 0} payments</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencyUtils.format(stats.overdue_amount || 0)}
              </p>
              <p className="text-sm text-gray-600">{stats.overdue_payments || 0} payments</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Payment</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencyUtils.format(stats.avg_payment || 0)}
              </p>
              <p className="text-sm text-gray-600">{stats.total_payments || 0} total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Payments Alert */}
      {overduePayments.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-sm font-medium text-red-800">
                {overduePayments.length} Overdue Payment{overduePayments.length > 1 ? 's' : ''}
              </h3>
            </div>
            <button
              onClick={() => setShowOverdue(!showOverdue)}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              {showOverdue ? 'Hide' : 'View'} Overdue
            </button>
          </div>
          {showOverdue && (
            <div className="mt-3 space-y-2">
              {overduePayments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between bg-white p-3 rounded border">
                  <div>
                    <p className="text-sm font-medium">{payment.order_number}</p>
                    <p className="text-xs text-gray-600">
                      {payment.dealer_name} • {payment.days_overdue} days overdue
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">
                      {currencyUtils.format(payment.amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Due: {dateUtils.formatDate(payment.due_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search payments..."
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
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="sm:w-40">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Payments ({filteredPayments.length})
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
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg mr-3">
                        <CreditCard className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{payment.order_number}</div>
                        <div className="text-sm text-gray-500">
                          {payment.transaction_id && `TXN: ${payment.transaction_id}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      {payment.dealer_name && (
                        <div className="text-sm font-medium text-gray-900">{payment.dealer_name}</div>
                      )}
                      {payment.dealer_agency && (
                        <div className="text-sm text-gray-500">{payment.dealer_agency}</div>
                      )}
                      {payment.salesman_name && (
                        <div className="text-sm text-gray-500">via {payment.salesman_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {currencyUtils.format(payment.amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      of {currencyUtils.format(payment.order_total)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PaymentMethodBadge method={payment.payment_method} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={payment.payment_status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.payment_date ? dateUtils.formatDate(payment.payment_date) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.due_date ? (
                      <span className={new Date(payment.due_date) < new Date() && payment.payment_status !== 'paid' ? 'text-red-600 font-medium' : ''}>
                        {dateUtils.formatDate(payment.due_date)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {payment.payment_status === 'pending' && (
                        <select
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                          value={payment.payment_status}
                          onChange={(e) => updatePaymentStatus(payment.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                        </select>
                      )}
                      
                      <button
                        onClick={() => deletePayment(payment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Delete Payment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by recording a payment.'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && <CreatePaymentModal />}
    </div>
  );
};

export default PaymentManagement;