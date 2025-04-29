import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import Layout from '../components/Layout';

// Shadcn UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Package, Plus, Pencil, Trash2, Package2, ArrowRightCircle } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

const Items = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('You are not authenticated');
      }
      
      const response = await fetch('http://localhost:4000/items/with-inventory', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (itemId) => {
    setDeleteItemId(itemId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('You are not authenticated');
      }
      
      const response = await fetch(`http://localhost:4000/items/${deleteItemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete item');
      }
      
      // Remove item from list
      setItems(items.filter(item => item.id !== deleteItemId));
      
      // Close modal
      setShowDeleteModal(false);
      setDeleteItemId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteItemId(null);
  };

  const getStockStatusVariant = (quantity) => {
    if (quantity > 10) return "success";
    if (quantity > 0) return "warning";
    return "destructive";
  };

  const getStockStatusText = (quantity) => {
    if (quantity > 10) return 'In Stock';
    if (quantity > 0) return 'Low Stock';
    return 'Out of Stock';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full mt-20">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin" />
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
              <h1 className="text-2xl font-bold text-gray-900">Item Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your masala products and their pricing
              </p>
            </div>
            <Button asChild className="bg-red-600 hover:bg-red-700">
              <Link to="/items/new" className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Add New Item
              </Link>
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {items.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent className="pt-6 flex flex-col items-center">
                <Package2 className="h-12 w-12 text-gray-400 mb-4" />
                <CardTitle className="text-xl mb-2">No items</CardTitle>
                <CardDescription className="mb-6">
                  Get started by creating a new masala product.
                </CardDescription>
                <Button asChild className="bg-red-600 hover:bg-red-700">
                  <Link to="/items/new" className="flex items-center">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Item
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-1" title={item.name}>
                        {item.name}
                      </CardTitle>
                      <Badge variant={getStockStatusVariant(item.currentStock || 0)}>
                        {getStockStatusText(item.currentStock || 0)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4">
                    <div className="min-h-[40px] mb-3">
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {item.description || 'No description available'}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase">Price</p>
                        <p className="text-sm font-semibold">₹{item.price_per_gatha} / gatha</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase">Packs</p>
                        <p className="text-sm font-semibold">{item.packs_per_gatha} / gatha</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1 mt-4">
                      <p className="text-xs font-medium text-gray-500 uppercase">Current Stock</p>
                      <p className="text-sm font-semibold">{item.currentStock || 0} units</p>
                    </div>
                  </CardContent>
                  
                  <Separator />
                  
                  <CardFooter className="p-3 flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild
                      className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <Link to={`/inventory/${item.id}`} className="flex items-center">
                        <Package className="mr-1 h-3.5 w-3.5" />
                        Stock
                      </Link>
                    </Button>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Link to={`/items/${item.id}/edit`} className="flex items-center">
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Items;