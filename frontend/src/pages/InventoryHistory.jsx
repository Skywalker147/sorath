import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import Layout from '../components/Layout';
import { API_URL } from '../config';

const InventoryHistory = () => {
  const { id } = useParams(); // Optional itemId if viewing history for a specific item
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [item, setItem] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    if (id) {
      fetchItem();
    }
    fetchHistory(currentPage);
  }, [id, currentPage]);

  const fetchItem = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('You are not authenticated');
      }
      
      const response = await fetch(`${API_URL}/items/${id}`, {
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
    }
  };

  const fetchHistory = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('You are not authenticated');
      }
      
      const limit = recordsPerPage;
      const offset = (page - 1) * limit;
      
      const url = id 
        ? `http://localhost:4000/inventory/${id}/history?limit=${limit}&offset=${offset}`
        : `http://localhost:4000/inventory/history?limit=${limit}&offset=${offset}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory history');
      }
      
      const data = await response.json();
      
      // For simplicity, this example assumes the total count would be in the response
      // In a real implementation, you might need to make a separate call to get the total count
      setHistoryData(data.records || data);
      setTotalPages(Math.ceil((data.total || data.length) / recordsPerPage));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading && !historyData.length) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full mt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
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
              <h1 className="text-2xl font-bold text-gray-900">
                {item ? `Inventory History: ${item.name}` : 'Inventory History'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {item 
                  ? `Track all stock changes for ${item.name}`
                  : 'Track all inventory changes across all items'}
              </p>
            </div>
            <div className="flex space-x-3">
              {id ? (
                <Link
                  to={`/inventory/${id}`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Item
                </Link>
              ) : (
                <Link
                  to="/inventory"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back to Inventory
                </Link>
              )}
            </div>
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

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {historyData.length === 0 ? (
              <div className="px-4 py-5 sm:p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No history available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no inventory changes recorded yet.
                </p>
              </div>
            ) : (
              <div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      {!id && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                      )}
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Change
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Updated By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historyData.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </td>
                        {!id && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {entry.item_name}
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full",
                            entry.quantity_change > 0 
                              ? "bg-green-100 text-green-800" 
                              : "bg-red-100 text-red-800"
                          )}>
                            {entry.quantity_change > 0 ? '+' : ''}{entry.quantity_change} units
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entry.admin_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={cn(
                          "relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md",
                          currentPage === 1
                            ? "bg-gray-100 text-gray-400"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={cn(
                          "ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md",
                          currentPage === totalPages
                            ? "bg-gray-100 text-gray-400"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{(currentPage - 1) * recordsPerPage + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * recordsPerPage, historyData.length + ((currentPage - 1) * recordsPerPage))}
                          </span>{' '}
                          of{' '}
                          <span className="font-medium">{historyData.length + ((currentPage - 1) * recordsPerPage)}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={cn(
                              "relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium",
                              currentPage === 1
                                ? "text-gray-300"
                                : "text-gray-500 hover:bg-gray-50"
                            )}
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          {/* Page numbers */}
                          {[...Array(totalPages)].map((_, index) => {
                            const pageNumber = index + 1;
                            
                            // Show ellipsis for many pages
                            if (totalPages > 7) {
                              if (
                                pageNumber === 1 ||
                                pageNumber === totalPages ||
                                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                              ) {
                                return (
                                  <button
                                    key={pageNumber}
                                    onClick={() => handlePageChange(pageNumber)}
                                    className={cn(
                                      "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                                      pageNumber === currentPage
                                        ? "z-10 bg-red-50 border-red-500 text-red-600"
                                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                    )}
                                  >
                                    {pageNumber}
                                  </button>
                                );
                              } else if (
                                pageNumber === 2 ||
                                pageNumber === totalPages - 1
                              ) {
                                return (
                                  <span key={pageNumber} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    ...
                                  </span>
                                );
                              }
                              return null;
                            }
                            
                            // Show all pages if there are fewer
                            return (
                              <button
                                key={pageNumber}
                                onClick={() => handlePageChange(pageNumber)}
                                className={cn(
                                  "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
                                  pageNumber === currentPage
                                    ? "z-10 bg-red-50 border-red-500 text-red-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                )}
                              >
                                {pageNumber}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={cn(
                              "relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium",
                              currentPage === totalPages
                                ? "text-gray-300"
                                : "text-gray-500 hover:bg-gray-50"
                            )}
                          >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InventoryHistory;