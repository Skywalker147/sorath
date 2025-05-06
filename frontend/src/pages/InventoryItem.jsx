import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import Layout from '../components/Layout';
import { API_URL } from '../config';

// Shadcn UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  ArrowLeft, 
  RefreshCw, 
  Plus, 
  Minus, 
  Clock, 
  User,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  Clipboard
} from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const InventoryItem = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  
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
      
      const response = await fetch(`${API_URL}/items/${id}/with-inventory`, {
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
      
      const response = await fetch(`${API_URL}/inventory/${id}/history?limit=5`, {
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
    setSuccessMessage(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('You are not authenticated');
      }
      
      // Calculate actual adjustment based on type
      const adjustment = adjustmentType === 'add' 
        ? parseInt(adjustmentQuantity, 10) 
        : -parseInt(adjustmentQuantity, 10);
      
      const response = await fetch(`${API_URL}/inventory/${id}/adjust`, {
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
      
      // Set success message
      setSuccessMessage(`Successfully ${adjustmentType === 'add' ? 'added' : 'removed'} ${adjustmentQuantity} units.`);
      
      // Refresh data
      fetchItem();
      fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setAdjustmentQuantity('');
    setAdjustmentReason('');
    setAdjustmentType('add');
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
  
  if (!item) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Card className="text-center py-8 max-w-md mx-auto">
            <CardContent className="pt-6 flex flex-col items-center">
              <Package className="h-12 w-12 text-gray-400 mb-4" />
              <CardTitle className="text-xl mb-2">Item not found</CardTitle>
              <CardDescription className="mb-6">
                The item you're looking for doesn't exist or has been removed.
              </CardDescription>
              <Button asChild className="bg-red-600 hover:bg-red-700">
                <Link to="/inventory">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Return to Inventory
                </Link>
              </Button>
            </CardContent>
          </Card>
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
            <Button 
              variant="outline" 
              onClick={() => navigate('/inventory')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Inventory
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert variant="success" className="mb-6 bg-green-50 border border-green-200 text-green-800">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Item Details Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center">
                  <Package className="mr-2 h-5 w-5" /> Item Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Current Stock</h3>
                    <Badge variant={getStockStatusVariant(item.currentStock || 0)} className="text-sm px-3 py-1">
                      {getStockStatusText(item.currentStock || 0)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-sm font-medium">{item.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Current Stock</p>
                      <p className="text-sm font-bold">{item.currentStock || 0} units</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Price per Gatha</p>
                      <p className="text-sm font-medium">₹{item.price_per_gatha}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Packs per Gatha</p>
                      <p className="text-sm font-medium">{item.packs_per_gatha}</p>
                    </div>
                  </div>

                  <Separator />
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-sm">{item.description || 'No description available'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stock Adjustment Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center">
                  {adjustmentType === 'add' ? 
                    <Plus className="mr-2 h-6 w-6 text-green-500" /> : 
                    <Minus className="mr-2 h-6 w-6 text-red-500" />
                  }
                  Adjust Stock
                </CardTitle>
                <CardDescription>
                  Add or remove inventory and record the reason
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="adjustmentType">Adjustment Type</Label>
                    <RadioGroup 
                      id="adjustmentType" 
                      value={adjustmentType} 
                      onValueChange={setAdjustmentType}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="add" id="add" />
                        <Label htmlFor="add" className="flex items-center">
                          <ArrowUpCircle className="mr-0 h-6 w-6 text-green-500" />
                          Add Stock
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="remove" id="remove" />
                        <Label htmlFor="remove" className="flex items-center">
                          <ArrowDownCircle className="mr-0 h-6 w-6 text-red-500" />
                          Remove Stock
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adjustmentQuantity">Quantity</Label>
                    <Input
                      id="adjustmentQuantity"
                      type="number"
                      required
                      min="1"
                      placeholder="Enter quantity"
                      value={adjustmentQuantity}
                      onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adjustmentReason">Reason</Label>
                    <Input
                      id="adjustmentReason"
                      required
                      placeholder="E.g., New stock arrival, Damaged goods, etc."
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSaving}
                      onClick={resetForm}
                      className="flex items-center"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className={cn(
                        "bg-red-600 hover:bg-red-700 text-white",
                        adjustmentType === 'add' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                      )}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {adjustmentType === 'add' ? <Plus className="mr-2 h-4 w-4" /> : <Minus className="mr-2 h-4 w-4" />}
                          Update Stock
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Recent History Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center">
                <Clipboard className="mr-2 h-5 w-5" />
                <CardTitle className="text-xl">Recent Inventory Changes</CardTitle>
              </div>
              <Button asChild variant="link" className="text-red-600 hover:text-red-700">
                <Link to={`/inventory/${id}/history`}>
                  View Full History
                </Link>
              </Button>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {isLoadingHistory ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 text-red-600 animate-spin" />
                </div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">No history available yet.</p>
                </div>
              ) : (
                <ScrollArea className="h-[250px]">
                  <div className="space-y-4">
                    {historyData.map((entry) => (
                      <div key={entry.id} className="flex items-start justify-between pb-4 border-b border-gray-100 last:border-0">
                        <div className="flex items-start">
                          <div className={cn(
                            "flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center",
                            entry.quantity_change > 0 ? 'bg-green-100' : 'bg-red-100'
                          )}>
                            {entry.quantity_change > 0 ? (
                              <ArrowUpCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <ArrowDownCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium">
                              {entry.quantity_change > 0 ? 'Added' : 'Removed'} {Math.abs(entry.quantity_change)} units
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">{entry.reason}</div>
                            <div className="flex items-center mt-1 text-xs text-gray-400">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                          <User className="h-3 w-3 mr-1" />
                          {entry.admin_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default InventoryItem;
