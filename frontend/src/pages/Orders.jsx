import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import Layout from '../components/Layout';
import { API_URL } from '../config';

// Shadcn UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Package, Eye, CheckCircle, XCircle, Clock, Trash2, Edit2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('You are not authenticated');
      }
      
      const response = await fetch(`${API_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      toast.success('Order status updated successfully');
      fetchOrders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      toast.success('Order deleted successfully');
      setShowDeleteConfirm(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdateOrder = async (orderId, updatedData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      toast.success('Order updated successfully');
      setShowEditDialog(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4" /> },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-4 w-4" /> },
      completed: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-4 w-4" /> },
      cancelled: { color: 'bg-red-100 text-red-800', icon: <XCircle className="h-4 w-4" /> }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <Badge className={cn("flex items-center gap-1", config.color)}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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
              <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                View and manage orders from dealers and salesmen
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>
                View and manage all orders in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>#{order.id}</TableCell>
                      <TableCell>{order.user_name}</TableCell>
                      <TableCell>{order.phone_number}</TableCell>
                      <TableCell>₹{order.total_amount}</TableCell>
                      <TableCell>
                        <Select
                          defaultValue={order.status}
                          onValueChange={(value) => handleStatusChange(order.id, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue>
                              {getStatusBadge(order.status)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingOrder(order);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              View complete order information and items
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-500">Customer Information</h3>
                  <p className="mt-1">Name: {selectedOrder.user_name}</p>
                  <p>Phone: {selectedOrder.phone_number}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Order Information</h3>
                  <p className="mt-1">Status: {getStatusBadge(selectedOrder.status)}</p>
                  <p>Date: {new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-500 mb-2">Order Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price per Unit</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.price_per_unit}</TableCell>
                        <TableCell>₹{item.total_price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <p className="text-lg font-semibold">
                  Total Amount: ₹{selectedOrder.total_amount}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete order #{selectedOrder?.id}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDeleteOrder(selectedOrder?.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order #{editingOrder?.id}</DialogTitle>
            <DialogDescription>
              Update order details
            </DialogDescription>
          </DialogHeader>
          
          {editingOrder && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleUpdateOrder(editingOrder.id, {
                user_name: formData.get('user_name'),
                phone_number: formData.get('phone_number'),
                status: formData.get('status')
              });
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user_name">Customer Name</Label>
                  <Input
                    id="user_name"
                    name="user_name"
                    defaultValue={editingOrder.user_name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    defaultValue={editingOrder.phone_number}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={editingOrder.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" type="button" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Orders; 