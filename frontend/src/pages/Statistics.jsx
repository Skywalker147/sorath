import React, { useState, useEffect, useContext } from 'react';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  Target,
  Award,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { AuthContext } from '../App';
import { API_URL } from '../config';
import { currencyUtils, dateUtils } from '../lib/utils';

const Statistics = () => {
  const { role } = useContext(AuthContext);
  const [stats, setStats] = useState({});
  const [monthlySales, setMonthlySales] = useState([]);
  const [monthlyReturns, setMonthlyReturns] = useState([]);
  const [monthlyPayments, setMonthlyPayments] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchStatistics();
  }, [selectedYear, selectedWarehouse]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const warehouseParam = selectedWarehouse ? `warehouseId=${selectedWarehouse}` : '';
      const yearParam = `year=${selectedYear}`;

      const [
        orderStatsRes,
        returnStatsRes,
        paymentStatsRes,
        inventoryStatsRes,
        userStatsRes,
        monthlySalesRes,
        monthlyReturnsRes,
        monthlyPaymentsRes,
        topCustomersRes,
        itemStatsRes,
        warehousesRes
      ] = await Promise.all([
        fetch(`${API_URL}/orders/stats?${warehouseParam}`, { headers }),
        fetch(`${API_URL}/returns/stats?${warehouseParam}`, { headers }),
        fetch(`${API_URL}/payments/stats?${warehouseParam}`, { headers }),
        fetch(`${API_URL}/inventory/stats?${warehouseParam}`, { headers }),
        role === 'owner' ? fetch(`${API_URL}/users/stats`, { headers }) : null,
        fetch(`${API_URL}/orders/monthly-sales?${warehouseParam}&${yearParam}`, { headers }),
        fetch(`${API_URL}/returns/monthly-returns?${warehouseParam}&${yearParam}`, { headers }),
        fetch(`${API_URL}/payments/monthly-payments?${warehouseParam}&${yearParam}`, { headers }),
        fetch(`${API_URL}/payments/top-customers?${warehouseParam}&limit=10`, { headers }),
        fetch(`${API_URL}/items/stats`, { headers }),
        role === 'owner' ? fetch(`${API_URL}/users/warehouses`, { headers }) : null
      ]);

      const [
        orderStatsData,
        returnStatsData,
        paymentStatsData,
        inventoryStatsData,
        userStatsData,
        monthlySalesData,
        monthlyReturnsData,
        monthlyPaymentsData,
        topCustomersData,
        itemStatsData,
        warehousesData
      ] = await Promise.all([
        orderStatsRes.json(),
        returnStatsRes.json(),
        paymentStatsRes.json(),
        inventoryStatsRes.json(),
        userStatsRes ? userStatsRes.json() : { data: {} },
        monthlySalesRes.json(),
        monthlyReturnsRes.json(),
        monthlyPaymentsRes.json(),
        topCustomersRes.json(),
        itemStatsRes.json(),
        warehousesRes ? warehousesRes.json() : { data: [] }
      ]);

      setStats({
        orders: orderStatsData.data || {},
        returns: returnStatsData.data || {},
        payments: paymentStatsData.data || {},
        inventory: inventoryStatsData.data || {},
        users: userStatsData.data || {},
        items: itemStatsData.data || {}
      });

      setMonthlySales(monthlySalesData.data || []);
      setMonthlyReturns(monthlyReturnsData.data || []);
      setMonthlyPayments(monthlyPaymentsData.data || []);
      setTopCustomers(topCustomersData.data || []);
      setTopItems(itemStatsData.data?.topItems || []);
      setWarehouses(warehousesData.data || []);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthNumber) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNumber - 1];
  };

  const calculateGrowth = (data, field) => {
    if (data.length < 2) return { value: 0, trend: 'neutral' };
    
    const currentMonth = data[data.length - 1];
    const previousMonth = data[data.length - 2];
    
    if (!currentMonth || !previousMonth || previousMonth[field] === 0) {
      return { value: 0, trend: 'neutral' };
    }
    
    const growth = ((currentMonth[field] - previousMonth[field]) / previousMonth[field] * 100);
    return {
      value: Math.abs(growth).toFixed(1),
      trend: growth > 0 ? 'up' : growth < 0 ? 'down' : 'neutral'
    };
  };

  const StatCard = ({ title, value, subtext, icon: Icon, color, growth, format = 'number' }) => {
    const formattedValue = format === 'currency' ? currencyUtils.format(value) : 
                          format === 'number' ? (value || 0).toLocaleString() : value;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{formattedValue}</p>
            {subtext && (
              <p className="text-sm text-gray-500 mt-1">{subtext}</p>
            )}
            {growth && growth.trend !== 'neutral' && (
              <div className={`flex items-center mt-2 text-sm ${
                growth.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {growth.trend === 'up' ? 
                  <TrendingUp className="h-4 w-4 mr-1" /> : 
                  <TrendingDown className="h-4 w-4 mr-1" />
                }
                <span>{growth.value}% from last month</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    );
  };

  const ChartCard = ({ title, children }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );

  const BarChart = ({ data, dataKey, label, color = "bg-red-500" }) => {
    const maxValue = Math.max(...data.map(item => item[dataKey] || 0));
    
    return (
      <div className="space-y-3">
        {data.slice(-6).map((item) => (
          <div key={item.month} className="flex items-center">
            <div className="w-12 text-sm text-gray-600">
              {getMonthName(item.month)}
            </div>
            <div className="flex-1 mx-3">
              <div className="bg-gray-200 rounded-full h-3">
                <div 
                  className={`${color} h-3 rounded-full transition-all duration-300`}
                  style={{ 
                    width: `${maxValue > 0 ? Math.max(5, (item[dataKey] / maxValue) * 100) : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            <div className="w-24 text-right text-sm font-medium">
              {label === 'currency' ? currencyUtils.format(item[dataKey]) : (item[dataKey] || 0).toLocaleString()}
            </div>
          </div>
        ))}
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

  const salesGrowth = calculateGrowth(monthlySales, 'revenue');
  const orderGrowth = calculateGrowth(monthlySales, 'order_count');
  const returnGrowth = calculateGrowth(monthlyReturns, 'return_count');
  const paymentGrowth = calculateGrowth(monthlyPayments, 'received_amount');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistics & Analytics</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {[2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          {role === 'owner' && (
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
          )}
          
          <button
            onClick={fetchStatistics}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'sales', label: 'Sales Analysis', icon: TrendingUp },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'performance', label: 'Performance', icon: Target }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue"
              value={stats.orders?.total_revenue || 0}
              format="currency"
              subtext={`${stats.orders?.total_orders || 0} orders`}
              icon={DollarSign}
              color="bg-green-500"
              growth={salesGrowth}
            />
            
            <StatCard
              title="Monthly Orders"
              value={monthlySales[monthlySales.length - 1]?.order_count || 0}
              subtext={`${stats.orders?.pending_orders || 0} pending`}
              icon={ShoppingCart}
              color="bg-blue-500"
              growth={orderGrowth}
            />
            
            <StatCard
              title="Total Returns"
              value={stats.returns?.total_returns || 0}
              subtext={`${currencyUtils.format(stats.returns?.total_return_value || 0)} value`}
              icon={Activity}
              color="bg-orange-500"
              growth={returnGrowth}
            />
            
            <StatCard
              title="Payments Received"
              value={stats.payments?.received_amount || 0}
              format="currency"
              subtext={`${stats.payments?.pending_amount || 0} pending`}
              icon={CheckCircle}
              color="bg-purple-500"
              growth={paymentGrowth}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Monthly Sales Revenue">
              <BarChart 
                data={monthlySales} 
                dataKey="revenue" 
                label="currency"
                color="bg-green-500"
              />
            </ChartCard>
            
            <ChartCard title="Monthly Order Count">
              <BarChart 
                data={monthlySales} 
                dataKey="order_count" 
                label="number"
                color="bg-blue-500"
              />
            </ChartCard>
          </div>
        </div>
      )}

      {/* Sales Analysis Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Average Order Value"
              value={stats.orders?.avg_order_value || 0}
              format="currency"
              icon={Target}
              color="bg-indigo-500"
            />
            
            <StatCard
              title="Orders This Month"
              value={monthlySales[monthlySales.length - 1]?.order_count || 0}
              subtext="Current month"
              icon={Calendar}
              color="bg-blue-500"
            />
            
            <StatCard
              title="Revenue Growth"
              value={`${salesGrowth.value}%`}
              subtext="Month over month"
              icon={salesGrowth.trend === 'up' ? TrendingUp : TrendingDown}
              color={salesGrowth.trend === 'up' ? 'bg-green-500' : 'bg-red-500'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Sales vs Returns">
              <div className="space-y-3">
                {monthlySales.slice(-6).map((month, index) => {
                  const returnData = monthlyReturns.find(r => r.month === month.month) || { return_value: 0 };
                  const maxValue = Math.max(month.revenue, returnData.return_value);
                  
                  return (
                    <div key={month.month} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{getMonthName(month.month)}</span>
                        <span>Sales: {currencyUtils.format(month.revenue)}</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${maxValue > 0 ? (month.revenue / maxValue) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span></span>
                        <span className="text-red-600">Returns: {currencyUtils.format(returnData.return_value)}</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${maxValue > 0 ? (returnData.return_value / maxValue) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ChartCard>

            <ChartCard title="Top Selling Items">
              <div className="space-y-3">
                {topItems.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 rounded-lg mr-3">
                        <Award className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.item_name}</p>
                        <p className="text-xs text-gray-500">#{index + 1} best seller</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{item.total_quantity}</p>
                      <p className="text-xs text-gray-500">{currencyUtils.format(item.total_revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          {role === 'owner' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Dealers"
                value={stats.users?.dealers?.total || 0}
                subtext={`${stats.users?.dealers?.active || 0} active`}
                icon={Users}
                color="bg-green-500"
              />
              
              <StatCard
                title="Total Salesmen"
                value={stats.users?.salesmen?.total || 0}
                subtext={`${stats.users?.salesmen?.active || 0} active`}
                icon={Users}
                color="bg-blue-500"
              />
              
              <StatCard
                title="Total Warehouses"
                value={stats.users?.warehouses?.total || 0}
                subtext={`${stats.users?.warehouses?.active || 0} active`}
                icon={Package}
                color="bg-purple-500"
              />
            </div>
          )}

          <ChartCard title="Top Paying Customers">
            <div className="space-y-3">
              {topCustomers.slice(0, 10).map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.customer_name}</p>
                      <p className="text-xs text-gray-500">
                        {customer.customer_type} • {customer.mobile_number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{currencyUtils.format(customer.total_paid)}</p>
                    <p className="text-xs text-gray-500">{customer.total_orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Total Items"
              value={stats.inventory?.total_items || 0}
              subtext="Unique products"
              icon={Package}
              color="bg-blue-500"
            />
            
            <StatCard
              title="Total Quantity"
              value={stats.inventory?.total_quantity || 0}
              subtext="All warehouses"
              icon={Package2}
              color="bg-green-500"
            />
            
            <StatCard
              title="Inventory Value"
              value={stats.inventory?.total_value || 0}
              format="currency"
              subtext="Current stock worth"
              icon={DollarSign}
              color="bg-purple-500"
            />
            
            <StatCard
              title="Low Stock Items"
              value={stats.inventory?.lowStockCount || 0}
              subtext="Need restocking"
              icon={AlertTriangle}
              color="bg-orange-500"
            />
          </div>

          <ChartCard title="Inventory Distribution">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Stock Levels</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Well Stocked</span>
                    <span className="font-medium">{(stats.inventory?.total_items || 0) - (stats.inventory?.lowStockCount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>Low Stock</span>
                    <span className="font-medium">{stats.inventory?.lowStockCount || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Out of Stock</span>
                    <span className="font-medium">{stats.inventory?.outOfStockCount || 0}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Value Distribution</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Average Value per Item</span>
                    <span className="font-medium">{currencyUtils.format((stats.inventory?.total_value || 0) / Math.max(1, stats.inventory?.total_items || 1))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Quantity per Item</span>
                    <span className="font-medium">{Math.round((stats.inventory?.avg_quantity || 0))}</span>
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Order Fulfillment"
              value={`${Math.round(((stats.orders?.delivered_orders || 0) / Math.max(1, stats.orders?.total_orders || 1)) * 100)}%`}
              subtext={`${stats.orders?.delivered_orders || 0} of ${stats.orders?.total_orders || 0} delivered`}
              icon={CheckCircle}
              color="bg-green-500"
            />
            
            <StatCard
              title="Payment Collection"
              value={`${Math.round(((stats.payments?.received_amount || 0) / Math.max(1, stats.payments?.total_amount || 1)) * 100)}%`}
              subtext="Amount collected"
              icon={DollarSign}
              color="bg-blue-500"
            />
            
            <StatCard
              title="Return Rate"
              value={`${Math.round(((stats.returns?.total_returns || 0) / Math.max(1, stats.orders?.total_orders || 1)) * 100)}%`}
              subtext={`${stats.returns?.total_returns || 0} returns`}
              icon={Activity}
              color="bg-orange-500"
            />
            
            <StatCard
              title="Customer Satisfaction"
              value={`${100 - Math.round(((stats.returns?.total_returns || 0) / Math.max(1, stats.orders?.total_orders || 1)) * 100)}%`}
              subtext="Based on return rate"
              icon={Award}
              color="bg-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Monthly Performance Trends">
              <BarChart 
                data={monthlySales} 
                dataKey="delivered_revenue" 
                label="currency"
                color="bg-green-500"
              />
            </ChartCard>

            <ChartCard title="Payment Collection Trends">
              <BarChart 
                data={monthlyPayments} 
                dataKey="received_amount" 
                label="currency"
                color="bg-blue-500"
              />
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;