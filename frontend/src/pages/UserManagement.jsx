import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Warehouse, 
  UserCheck, 
  UserX,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  MapPin,
  Phone,
  Building,
  UserCog,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Link,
  X
} from 'lucide-react';
import { API_URL } from '../config';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('warehouses');
  const [warehouses, setWarehouses] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [registrationCodes, setRegistrationCodes] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUserType, setEditUserType] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [
        warehousesRes,
        dealersRes,
        salesmenRes,
        codesRes,
        statsRes
      ] = await Promise.all([
        fetch(`${API_URL}/users/warehouses`, { headers }),
        fetch(`${API_URL}/users/dealers`, { headers }),
        fetch(`${API_URL}/users/salesmen`, { headers }),
        fetch(`${API_URL}/users/registration-codes`, { headers }),
        fetch(`${API_URL}/users/stats`, { headers })
      ]);

      const [
        warehousesData,
        dealersData,
        salesmenData,
        codesData,
        statsData
      ] = await Promise.all([
        warehousesRes.json(),
        dealersRes.json(),
        salesmenRes.json(),
        codesRes.json(),
        statsRes.json()
      ]);

      setWarehouses(warehousesData.data || []);
      setDealers(dealersData.data || []);
      setSalesmen(salesmenData.data || []);
      setRegistrationCodes(codesData.data || []);
      setStats(statsData.data || {});
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRegistrationCode = async (role, warehouseId = null) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/auth/generate-code`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role, warehouse_id: warehouseId })
      });

      const data = await response.json();
      if (data.success) {
        fetchData(); // Refresh data
        alert(`Registration code generated: ${data.code}`);
      }
    } catch (error) {
      console.error('Error generating code:', error);
    }
  };

  const updateUserStatus = async (userType, id, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      const endpoint = userType === 'warehouse' ? 'warehouses' 
                     : userType === 'dealer' ? 'dealers' 
                     : 'salesmen';
      
      const response = await fetch(`${API_URL}/users/${endpoint}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (data.success) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteUser = async (userType, id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const endpoint = userType === 'warehouse' ? 'warehouses' 
                     : userType === 'dealer' ? 'dealers' 
                     : 'salesmen';
      
      const response = await fetch(`${API_URL}/users/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const updateUserWarehouse = async (userType, userId, warehouseId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const endpoint = userType === 'dealer' ? 'dealers' : 'salesmen';
      
      const currentUser = userType === 'dealer' 
        ? dealers.find(d => d.id === userId)
        : salesmen.find(s => s.id === userId);

      if (!currentUser) return;

      const updateData = userType === 'dealer' 
        ? {
            name: currentUser.name,
            agency_name: currentUser.agency_name,
            address: currentUser.address,
            pincode: currentUser.pincode,
            mobile_number: currentUser.mobile_number,
            warehouse_id: warehouseId
          }
        : {
            name: currentUser.name,
            aadhar_number: currentUser.aadhar_number,
            pan_number: currentUser.pan_number,
            mobile_number: currentUser.mobile_number,
            warehouse_id: warehouseId
          };

      const response = await fetch(`${API_URL}/users/${endpoint}/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      if (data.success) {
        fetchData(); // Refresh data
        alert('Warehouse assignment updated successfully');
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Error updating warehouse assignment:', error);
      alert('Error updating warehouse assignment');
    }
  };

  const cleanupExpiredCodes = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/users/registration-codes/cleanup`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        fetchData(); // Refresh data
        alert(`${data.deletedCount} expired codes deleted`);
      }
    } catch (error) {
      console.error('Error cleaning up codes:', error);
    }
  };

  const filterUsers = (users) => {
    return users.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.agency_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.mobile_number?.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  };

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Active' },
      inactive: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Inactive' }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  const WarehouseSelector = ({ currentWarehouseId, onSelect, userType, userId }) => {
    return (
      <div className="flex items-center space-x-2">
        <select
          value={currentWarehouseId || ''}
          onChange={(e) => {
            const warehouseId = e.target.value ? parseInt(e.target.value) : null;
            onSelect(userType, userId, warehouseId);
          }}
          className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          <option value="">No Warehouse</option>
          {warehouses.filter(w => w.status === 'active').map(warehouse => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const CreateWarehouseModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      address: '',
      pincode: '',
      username: '',
      password: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_URL}/users/warehouses`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        const data = await response.json();
        if (data.success) {
          setShowCreateModal(false);
          setFormData({ name: '', address: '', pincode: '', username: '', password: '' });
          fetchData();
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error('Error creating warehouse:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-medium mb-4">Create New Warehouse</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.pincode}
                onChange={(e) => setFormData({...formData, pincode: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div className="flex justify-end space-x-3">
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
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'warehouses', label: 'Warehouses', icon: Warehouse, count: stats.warehouses?.total || 0 },
    { id: 'dealers', label: 'Dealers', icon: Users, count: stats.dealers?.total || 0 },
    { id: 'salesmen', label: 'Salesmen', icon: UserCheck, count: stats.salesmen?.total || 0 },
    { id: 'codes', label: 'Registration Codes', icon: Shield, count: registrationCodes.length }
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage warehouses, dealers, and salesmen</p>
        </div>
        <div className="flex space-x-3">
          {activeTab === 'warehouses' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Warehouse
            </button>
          )}
          {activeTab === 'codes' && (
            <button
              onClick={cleanupExpiredCodes}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Cleanup Expired
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Warehouse className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Warehouses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.warehouses?.total || 0}</p>
              <p className="text-sm text-green-600">{stats.warehouses?.active || 0} active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Dealers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.dealers?.total || 0}</p>
              <p className="text-sm text-green-600">{stats.dealers?.active || 0} active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <UserCheck className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Salesmen</p>
              <p className="text-2xl font-bold text-gray-900">{stats.salesmen?.total || 0}</p>
              <p className="text-sm text-green-600">{stats.salesmen?.active || 0} active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Codes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.registrationCodes?.active || 0}</p>
              <p className="text-sm text-gray-600">{stats.registrationCodes?.used || 0} used</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filters */}
        {activeTab !== 'codes' && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Warehouses Tab */}
          {activeTab === 'warehouses' && (
            <div className="space-y-4">
              {filterUsers(warehouses).map((warehouse) => (
                <div key={warehouse.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Warehouse className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{warehouse.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {warehouse.address}, {warehouse.pincode}
                          </span>
                          <span className="flex items-center">
                            <UserCog className="h-4 w-4 mr-1" />
                            {warehouse.username}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <StatusBadge status={warehouse.status} />
                      <button
                        onClick={() => updateUserStatus('warehouse', warehouse.id, warehouse.status === 'active' ? 'inactive' : 'active')}
                        className={`px-3 py-1 rounded-md text-sm ${
                          warehouse.status === 'active' 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {warehouse.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteUser('warehouse', warehouse.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dealers Tab */}
          {activeTab === 'dealers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Dealers</h3>
                <button
                  onClick={() => generateRegistrationCode('dealer')}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Registration Code
                </button>
              </div>
              {filterUsers(dealers).map((dealer) => (
                <div key={dealer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{dealer.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Building className="h-4 w-4 mr-1" />
                            {dealer.agency_name}
                          </span>
                          <span className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {dealer.mobile_number}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="text-sm text-gray-600 flex items-center">
                            <Link className="h-4 w-4 mr-1" />
                            Warehouse:
                          </span>
                          <WarehouseSelector
                            currentWarehouseId={dealer.warehouse_id}
                            onSelect={updateUserWarehouse}
                            userType="dealer"
                            userId={dealer.id}
                          />
                          {dealer.warehouse_name && (
                            <span className="text-sm text-blue-600 font-medium">
                              {dealer.warehouse_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <StatusBadge status={dealer.status} />
                      <button
                        onClick={() => updateUserStatus('dealer', dealer.id, dealer.status === 'active' ? 'inactive' : 'active')}
                        className={`px-3 py-1 rounded-md text-sm ${
                          dealer.status === 'active' 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {dealer.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteUser('dealer', dealer.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Salesmen Tab */}
          {activeTab === 'salesmen' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Salesmen</h3>
                <button
                  onClick={() => generateRegistrationCode('salesman')}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Registration Code
                </button>
              </div>
              {filterUsers(salesmen).map((salesman) => (
                <div key={salesman.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <UserCheck className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{salesman.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Aadhar: {salesman.aadhar_number}</span>
                          <span>PAN: {salesman.pan_number}</span>
                          <span className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {salesman.mobile_number}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="text-sm text-gray-600 flex items-center">
                            <Link className="h-4 w-4 mr-1" />
                            Warehouse:
                          </span>
                          <WarehouseSelector
                            currentWarehouseId={salesman.warehouse_id}
                            onSelect={updateUserWarehouse}
                            userType="salesman"
                            userId={salesman.id}
                          />
                          {salesman.warehouse_name && (
                            <span className="text-sm text-blue-600 font-medium">
                              {salesman.warehouse_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <StatusBadge status={salesman.status} />
                      <button
                        onClick={() => updateUserStatus('salesman', salesman.id, salesman.status === 'active' ? 'inactive' : 'active')}
                        className={`px-3 py-1 rounded-md text-sm ${
                          salesman.status === 'active' 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {salesman.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteUser('salesman', salesman.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Registration Codes Tab */}
          {activeTab === 'codes' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Registration Codes</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => generateRegistrationCode('warehouse')}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Warehouse Code
                  </button>
                  <button
                    onClick={() => generateRegistrationCode('dealer')}
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Dealer Code
                  </button>
                  <button
                    onClick={() => generateRegistrationCode('salesman')}
                    className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Salesman Code
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {registrationCodes.map((code) => {
                  const isExpired = new Date(code.expires_at) < new Date();
                  const isUsed = code.is_used;
                  
                  return (
                    <div key={code.id} className={`border rounded-lg p-4 ${
                      isUsed ? 'bg-gray-50 border-gray-300' : 
                      isExpired ? 'bg-red-50 border-red-300' : 
                      'bg-green-50 border-green-300'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-mono font-bold">{code.code}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isUsed ? 'bg-gray-200 text-gray-700' :
                          isExpired ? 'bg-red-200 text-red-700' :
                          'bg-green-200 text-green-700'
                        }`}>
                          {isUsed ? 'Used' : isExpired ? 'Expired' : 'Active'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="flex items-center">
                          <UserCog className="h-4 w-4 mr-1" />
                          Role: <span className="capitalize ml-1 font-medium">{code.role}</span>
                        </p>
                        {code.warehouse_name && (
                          <p className="flex items-center">
                            <Warehouse className="h-4 w-4 mr-1" />
                            {code.warehouse_name}
                          </p>
                        )}
                        <p className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Expires: {new Date(code.expires_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && <CreateWarehouseModal />}
    </div>
  );
};

export default UserManagement;