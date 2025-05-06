import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import Layout from '../components/Layout';
import { API_URL } from '../config';

// Shadcn UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Package, History, Pencil, PlusCircle, ClipboardList } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('table');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('You are not authenticated');
      }
      
      const response = await fetch(`${API_URL}/items/with-inventory`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      
      const data = await response.json();
      setInventory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStockStatusVariant = (quantity) => {
    if (quantity > 20) return "success";
    if (quantity > 5) return "warning";
    if (quantity > 0) return "destructive";
    return "outline";
  };

  const getStockStatusText = (quantity) => {
    if (quantity > 20) return 'In Stock';
    if (quantity > 5) return 'Low Stock';
    if (quantity > 0) return 'Very Low';
    return 'Out of Stock';
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderTableView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item Name</TableHead>
          <TableHead>Price (₹ per gatha)</TableHead>
          <TableHead>Current Stock</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredInventory.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-gray-500">{item.packs_per_gatha} packs/gatha</div>
            </TableCell>
            <TableCell>₹{item.price_per_gatha}</TableCell>
            <TableCell>{item.currentStock || 0}</TableCell>
            <TableCell>
              <Badge variant={getStockStatusVariant(item.currentStock || 0)}>
                {getStockStatusText(item.currentStock || 0)}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <Button asChild variant="outline" size="sm" className="h-8">
                  <Link to={`/inventory/${item.id}`}>
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Update
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-8">
                  <Link to={`/inventory/${item.id}/history`}>
                    <ClipboardList className="mr-1 h-3.5 w-3.5" />
                    History
                  </Link>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredInventory.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base line-clamp-1" title={item.name}>
                {item.name}
              </CardTitle>
              <Badge variant={getStockStatusVariant(item.currentStock || 0)}>
                {getStockStatusText(item.currentStock || 0)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <div>
                <p className="text-gray-500">Price:</p>
                <p className="font-medium">₹{item.price_per_gatha}</p>
              </div>
              <div>
                <p className="text-gray-500">Packs:</p>
                <p className="font-medium">{item.packs_per_gatha}/gatha</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Current Stock:</p>
                <p className="font-bold">{item.currentStock || 0} units</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between pt-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/inventory/${item.id}`}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Update Stock
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={`/inventory/${item.id}/history`}>
                <ClipboardList className="mr-1 h-3.5 w-3.5" />
                History
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );

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
              <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track and update stock levels for all masala items
              </p>
            </div>
            <div className="flex space-x-3">
              <Button asChild variant="default" className="bg-indigo-600 hover:bg-indigo-700">
                <Link to="/inventory/history" className="flex items-center">
                  <History className="mr-2 h-4 w-4" />
                  Inventory History
                </Link>
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {inventory.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent className="pt-6 flex flex-col items-center">
                <Package className="h-12 w-12 text-gray-400 mb-4" />
                <CardTitle className="text-xl mb-2">No inventory items</CardTitle>
                <CardDescription className="mb-6">
                  Get started by adding some items to your catalog.
                </CardDescription>
                <Button asChild className="bg-red-600 hover:bg-red-700">
                  <Link to="/items/new" className="flex items-center">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Item
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl flex items-center">
                    <Package className="mr-2 h-5 w-5" />
                    Inventory Items
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-500 mr-2">View:</div>
                    <div className="flex border rounded-md overflow-hidden">
                      <Button 
                        variant={view === 'table' ? 'secondary' : 'ghost'} 
                        className="rounded-none h-8 px-3" 
                        onClick={() => setView('table')}
                      >
                        Table
                      </Button>
                      <Button 
                        variant={view === 'cards' ? 'secondary' : 'ghost'} 
                        className="rounded-none h-8 px-3" 
                        onClick={() => setView('cards')}
                      >
                        Cards
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <CardDescription>
                    Showing {filteredInventory.length} of {inventory.length} items
                  </CardDescription>
                  <div className="w-[250px]">
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {view === 'table' ? renderTableView() : renderCardView()}
              </CardContent>
              <CardFooter className="bg-muted/50 border-t">
                <div className="flex w-full items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Total Items: {inventory.length}
                  </p>
                  <p className="text-sm text-gray-500">
                    Low Stock Items: {inventory.filter(item => (item.currentStock || 0) <= 5).length}
                  </p>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Inventory;