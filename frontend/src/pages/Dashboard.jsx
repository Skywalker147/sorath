import React, { useState, useEffect, useContext } from 'react';

import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  Warehouse,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  MapPin,
  Package2
} from 'lucide-react';
import { AuthContext } from '../App';
import { API_URL } from '../config';
import { currencyUtils, dateUtils } from '../lib/utils';

const Dashboard = () => {
  const { role, user } = useContext(AuthContext);
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentReturns, setRecentReturns] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Determine warehouse filter based on role
      const warehouseParam = role === 'warehouse' ? `?warehouseId=${user?.id}` : '';

      const [
        userStatsRes,
        itemStatsRes,
        inventoryStatsRes,
        orderStatsRes,
        returnStatsRes,
        recentOrdersRes,
        recentReturnsRes,
        lowStockRes,
        monthlySalesRes
      ] = await Promise.all([
        role === 'owner' ? fetch(`${API_URL}/users/stats`, { headers }) : null,
        fetch(`${API_URL}/items/stats`, { headers }),
        fetch(`${API_URL}/inventory/stats${warehouseParam}`, { headers }),
        fetch(`${API_URL}/orders/stats${warehouseParam}`, { headers }),
        fetch(`${API_URL}/returns/stats${warehouseParam}`, { headers }),
        fetch(`${API_URL}/orders/pending${warehouseParam}&limit=5`, { headers }),
        fetch(`${API_URL}/returns/pending${warehouseParam}&limit=5`, { headers }),
        fetch(`${API_URL}/inventory/low-stock${warehouseParam}&threshold=10&limit=5`, { headers }),
        fetch(`${API_URL}/orders/monthly-sales${warehouseParam}`, { headers })
      ]);

      const [
        userStatsData,
        itemStatsData,
        inventoryStatsData,
        orderStatsData,
        returnStatsData,
        recentOrdersData,
        recentReturnsData,
        lowStockData,
        monthlySalesData
      ] = await Promise.all([
        userStatsRes ? userStatsRes.json() : { data: {} },
        itemStatsRes.json(),
        inventoryStatsRes.json(),
        orderStatsRes.json(),
        returnStatsRes.json(),
        recentOrdersRes.json(),
        recentReturnsRes.json(),
        lowStockRes.json(),
        monthlySalesRes.json()
      ]);

      setStats({
        users: userStatsData.data || {},
        items: itemStatsData.data || {},
        inventory: inventoryStatsData.data || {},
        orders: orderStatsData.data || {},
        returns: returnStatsData.data || {}
      });

      setRecentOrders(recentOrdersData.data || []);
      setRecentReturns(recentReturnsData.data || []);
      setLowStockItems(lowStockData.data || []);
      setMonthlySales(monthlySalesData.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNumber) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNumber - 1];
  };

  const calculateGrowth = () => {
    if (monthlySales.length < 2) return 0;
    const currentMonth = monthlySales[monthlySales.length - 1];
    const previousMonth = monthlySales[monthlySales.length - 2];
    
    if (previousMonth.revenue === 0) return currentMonth.revenue > 0 ? 100 : 0;
    return ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100).toFixed(1);
  };

  const StatCard = ({ title, value, subtext, icon: Icon, color, trend, trendValue }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtext && (
            <p className="text-sm text-gray-500 mt-1">{subtext}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              <span>{trendValue}% from last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${color} mr-3`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const growth = calculateGrowth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {role === 'owner' ? 'Business Dashboard' : 'Warehouse Dashboard'}
          </h1>
          <p className="text-gray-600">
            {role === 'owner' 
              ? 'Overview of your entire business operations' 
              : `Warehouse operations overview`
            }
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-sm font-medium">{dateUtils.formatDateTime(new Date())}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={currencyUtils.format(stats.orders?.total_revenue || 0)}
          subtext={`From ${stats.orders?.total_orders || 0} orders`}
          icon={DollarSign}
          color="bg-green-500"
          trend={growth > 0 ? 'up' : growth < 0 ? 'down' : null}
          trendValue={Math.abs(growth)}
        />

        <StatCard
          title="Active Orders"
          value={stats.orders?.pending_orders || 0}
          subtext={`${stats.orders?.dispatched_orders || 0} dispatched`}
          icon={ShoppingCart}
          color="bg-blue-500"
        />

        <StatCard
          title="Inventory Items"
          value={stats.inventory?.total_items || 0}
          subtext={`Worth ${currencyUtils.format(stats.inventory?.total_value || 0)}`}
          icon={Package}
          color="bg-purple-500"
        />

        <StatCard
          title="Pending Returns"
          value={stats.returns?.pending_returns || 0}
          subtext={`${stats.returns?.total_returns || 0} total returns`}
          icon={RotateCcw}
          color="bg-orange-500"
        />
      </div>

      {/* Owner-specific Stats */}
      {role === 'owner' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Warehouses"
            value={stats.users?.warehouses?.total || 0}
            subtext={`${stats.users?.warehouses?.active || 0} active`}
            icon={Warehouse}
            color="bg-indigo-500"
          />

          <StatCard
            title="Active Dealers"
            value={stats.users?.dealers?.active || 0}
            subtext={`${stats.users?.dealers?.total || 0} total registered`}
            icon={Users}
            color="bg-green-500"
          />

          <StatCard
            title="Active Salesmen"
            value={stats.users?.salesmen?.active || 0}
            subtext={`${stats.users?.salesmen?.total || 0} total registered`}
            icon={Users}
            color="bg-blue-500"
          />
        </div>
      )}

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Monthly Sales</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {monthlySales.slice(-6).map((month) => (
              <div key={month.month} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-16 text-sm text-gray-600">
                    {getMonthName(month.month)}
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ 
                          width: `${Math.max(5, (month.revenue / Math.max(...monthlySales.map(m => m.revenue))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{currencyUtils.format(month.revenue)}</div>
                  <div className="text-xs text-gray-500">{month.order_count} orders</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <QuickActionCard
              title="Create New Order"
              description="Add a new customer order"
              icon={ShoppingCart}
              color="bg-blue-500"
              onClick={() => window.location.href = '/orders'}
            />
            <QuickActionCard
              title="Update Inventory"
              description="Manage stock levels"
              icon={Package}
              color="bg-green-500"
              onClick={() => window.location.href = '/inventory'}
            />
            <QuickActionCard
              title="Process Returns"
              description="Handle return requests"
              icon={RotateCcw}
              color="bg-orange-500"
              onClick={() => window.location.href = '/returns'}
            />
            {role === 'owner' && (
              <QuickActionCard
                title="Add New Item"
                description="Expand product catalog"
                icon={Package2}
                color="bg-purple-500"
                onClick={() => window.location.href = '/items'}
              />
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
            <button 
              onClick={() => window.location.href = '/orders'}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {recentOrders.length > 0 ? recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <ShoppingCart className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.order_number}</p>
                    <p className="text-xs text-gray-500">
                      {order.dealer_name || order.salesman_name} • {dateUtils.formatDate(order.order_date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{currencyUtils.format(order.total_amount)}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </span>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">No recent orders</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
            <button 
              onClick={() => window.location.href = '/inventory'}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {lowStockItems.length > 0 ? lowStockItems.map((item) => (
              <div key={`${item.warehouse_id}-${item.item_id}`} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg mr-3">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.item_name}</p>
                    <p className="text-xs text-gray-500">
                      {item.warehouse_name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-600">{item.quantity} left</p>
                  <p className="text-xs text-gray-500">{currencyUtils.format(item.item_price)}</p>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">All items well stocked</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Returns */}
      {recentReturns.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Return Requests</h3>
            <button 
              onClick={() => window.location.href = '/returns'}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentReturns.map((returnOrder) => (
              <div key={returnOrder.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{returnOrder.return_number}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">{returnOrder.item_name}</p>
                <p className="text-xs text-gray-500">
                  Qty: {returnOrder.quantity} • {returnOrder.dealer_name || returnOrder.salesman_name}
                </p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {currencyUtils.format(returnOrder.quantity * returnOrder.item_price)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Dashboard;