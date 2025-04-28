import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import Layout from '../components/Layout';

const InventoryItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  
  const [historyData, setHistoryData] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    fetchItem();
    fetchHistory();
  }, [id]);

  const fetchItem = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('You are not authenticated');
      }
      
      const response = await fetch(`http://localhost:4000/items/${id}/with-inventory`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch item');
      }
      
      const data = await response.json();
      setItem(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('You are not authenticated');
      }
      
      const response = await fetch(`http://localhost:4000/inventory/${id}/history?limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      
      const data = await response.json();
      setHistoryData(data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('You are not authenticated');
      }
      
      // Calculate actual adjustment based on type
      const adjustment = adjustmentType === 'add' 
        ? parseInt(adjustmentQuantity, 10) 
        : -parseInt(adjustmentQuantity, 10);
      
      const response = await fetch(`http://localhost:4000/inventory/${id}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          adjustment,
          reason: adjustmentReason
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update inventory');
      }
      
      // Reset form
      setAdjustmentQuantity('');
      setAdjustmentReason('');
      
      // Refresh data
      fetchItem();
      fetchHistory();
      
      // Show success message or notification
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full mt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
        </div>
      </Layout>
    );
  }
  
  if (!item) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center mt-20">
            <h2 className="text-xl font-semibold text-gray-700">Item not found</h2>
            <p className="mt-2 text-gray-500">The item you're looking for doesn't exist or has been removed.</p>
            <Link
              to="/inventory"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Return to Inventory
            </Link>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Update Inventory: {item.name}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Adjust stock levels and view recent inventory changes
              </p>
            </div>
            <Link
              to="/inventory"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Inventory
            </Link>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Item Details Card */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Item Details
                </h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{item.name}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Price per Gatha</dt>
                    <dd className="mt-1 text-sm text-gray-900">₹{item.price_per_gatha}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Packs per Gatha</dt>
                    <dd className="mt-1 text-sm text-gray-900">{item.packs_per_gatha}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Current Stock</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-bold">{item.currentStock || 0}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900">{item.description || 'No description available'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Stock Adjustment Form */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Adjust Stock
                </h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Adjustment Type</label>
                      <div className="mt-2 flex items-center space-x-4">
                        <div className="flex items-center">
                          <input
                            id="add"
                            name="adjustmentType"
                            type="radio"
                            checked={adjustmentType === 'add'}
                            onChange={() => setAdjustmentType('add')}
                            className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300"
                          />
                          <label htmlFor="add" className="ml-2 block text-sm text-gray-700">
                            Add Stock
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="remove"
                            name="adjustmentType"
                            type="radio"
                            checked={adjustmentType === 'remove'}
                            onChange={() => setAdjustmentType('remove')}
                            className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300"
                          />
                          <label htmlFor="remove" className="ml-2 block text-sm text-gray-700">
                            Remove Stock
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="adjustmentQuantity" className="block text-sm font-medium text-gray-700">
                        Quantity
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          name="adjustmentQuantity"
                          id="adjustmentQuantity"
                          required
                          min="1"
                          className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          value={adjustmentQuantity}
                          onChange={(e) => setAdjustmentQuantity(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="adjustmentReason" className="block text-sm font-medium text-gray-700">
                        Reason
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="adjustmentReason"
                          id="adjustmentReason"
                          required
                          className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="E.g., New stock arrival, Damaged goods, etc."
                          value={adjustmentReason}
                          onChange={(e) => setAdjustmentReason(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="pt-5">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setAdjustmentQuantity('');
                            setAdjustmentReason('');
                            setAdjustmentType('add');
                          }}
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Reset
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className={cn(
                            "ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500",
                            isSaving && "opacity-70 cursor-not-allowed"
                          )}
                        >
                          {isSaving ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            'Update Stock'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Recent History Section */}
          <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Inventory Changes
              </h3>
              <Link
                to={`/inventory/${id}/history`}
                className="text-sm font-medium text-red-600 hover:text-red-500"
              >
                View Full History
              </Link>
            </div>
            <div className="border-t border-gray-200">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-600"></div>
                </div>
              ) : historyData.length === 0 ? (
                <div className="px-4 py-5 sm:px-6 text-center">
                  <p className="text-sm text-gray-500">No history available yet.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {historyData.map((entry) => (
                    <li key={entry.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={cn(
                            "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                            entry.quantity_change > 0 ? 'bg-green-100' : 'bg-red-100'
                          )}>
                            {entry.quantity_change > 0 ? (
                              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 00-.707.293l-4 4a1 1 0 001.414 1.414L10 5.414l3.293 3.293a1 1 0 001.414-1.414l-4-4A1 1 0 0010 3z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M10 17a1 1 0 00.707-.293l4-4a1 1 0 00-1.414-1.414L10 14.586l-3.293-3.293a1 1 0 00-1.414 1.414l4 4A1 1 0 0010 17z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 00-.707.293l-4 4a1 1 0 001.414 1.414L10 5.414l3.293 3.293a1 1 0 001.414-1.414l-4-4A1 1 0 0010 3z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M10 17a1 1 0 00.707-.293l4-4a1 1 0 00-1.414-1.414L10 14.586l-3.293-3.293a1 1 0 00-1.414 1.414l4 4A1 1 0 0010 17z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {entry.quantity_change > 0 ? 'Added' : 'Removed'} {Math.abs(entry.quantity_change)} units
                            </div>
                            <div className="text-sm text-gray-500">{entry.reason}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-sm text-gray-900">
                            By {entry.admin_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(entry.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InventoryItem;