import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`${
                activeTab === 'items'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Item Management
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`${
                activeTab === 'inventory'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Inventory
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`${
                activeTab === 'orders'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`${
                activeTab === 'reports'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Reports
            </button>
          </nav>
        </div>

        <div className="px-4 py-6 sm:px-0">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-red-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Dashboard Overview</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 rounded-full bg-red-100 text-red-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Welcome to Sorath Masala Dashboard</h2>
                    <p className="mt-4 text-md text-gray-600">
                      Use the sidebar to navigate through different sections of the admin panel.
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      This is your central command center for managing inventory, orders, and business operations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Item Management Tab */}
          {activeTab === 'items' && (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-red-600 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Item Management</h2>
                <Link 
                  to="/items/new"
                  className="bg-white text-red-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50"
                >
                  Add New Item
                </Link>
              </div>
              <div className="p-6">
                <p className="text-gray-500 mb-4">
                  Manage your masala items and pricing here. You can add, edit, and remove items from your catalog.
                </p>
                <Link
                  to="/items"
                  className="inline-flex items-center px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Go to Item Management
                </Link>
              </div>
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-red-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Inventory Management</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-500 mb-4">
                  Track and manage your inventory levels. Update stock quantities and view inventory history.
                </p>
                <Link
                  to="/inventory"
                  className="inline-flex items-center px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Go to Inventory Management
                </Link>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-red-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Order Management</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-500 mb-4">
                  This feature is coming soon. You'll be able to manage orders from salesmen and dealers here.
                </p>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="bg-red-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Sales Reports</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-500 mb-4">
                  This feature is coming soon. You'll be able to view sales reports and analytics here.
                </p>
              </div>
            </div>
          )}
          
          {activeTab === 'overview' && (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                      <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Inventory Management</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">Available</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <button 
                      onClick={() => setActiveTab('inventory')}
                      className="font-medium text-red-600 hover:text-red-500"
                    >
                      View inventory
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                      <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Order Management</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">Coming Soon</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <button 
                      className="font-medium text-red-600 hover:text-red-500"
                      disabled
                    >
                      Not available yet
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                      <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Sales Analytics</dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">Coming Soon</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <div className="text-sm">
                    <button 
                      className="font-medium text-red-600 hover:text-red-500"
                      disabled
                    >
                      Not available yet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;