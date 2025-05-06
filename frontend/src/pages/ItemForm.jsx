import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import Layout from '../components/Layout';
import { API_URL } from '../config';

// Shadcn UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Save } from 'lucide-react';

const ItemForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerGatha: '',
    packsPerGatha: 30,
    initialStock: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchItem();
    }
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
      
      setFormData({
        name: data.name,
        description: data.description || '',
        pricePerGatha: data.price_per_gatha,
        packsPerGatha: data.packs_per_gatha,
        currentStock: data.currentStock || 0
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
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
      
      const payload = {
        name: formData.name,
        description: formData.description,
        pricePerGatha: parseFloat(formData.pricePerGatha),
        packsPerGatha: parseInt(formData.packsPerGatha, 10)
      };
      
      // Add initial stock only for new items
      if (!isEditing && formData.initialStock) {
        payload.initialStock = parseInt(formData.initialStock, 10);
      }
      
      const url = isEditing 
        ? `${API_URL}/items/${id}`
        : `${API_URL}/items`;
        
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save item');
      }
      
      // Redirect to items list
      navigate('/items');
    } catch (err) {
      setError(err.message);
      setIsSaving(false);
    }
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
      <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Item' : 'Add New Masala'}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {isEditing 
                  ? 'Update item details and pricing information'
                  : 'Create a new masala product with pricing information'}
              </p>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate('/items')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Items
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{isEditing ? 'Edit Item' : 'New Item Details'}</CardTitle>
              <CardDescription>
                Fill in the details about your masala product
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Item Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Enter product name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Product description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="pricePerGatha" className="text-sm font-medium">
                      Price Per Gatha (₹) <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-500">₹</span>
                      </div>
                      <Input
                        id="pricePerGatha"
                        name="pricePerGatha"
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-7"
                        value={formData.pricePerGatha}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="packsPerGatha" className="text-sm font-medium">
                      Packs Per Gatha
                    </Label>
                    <Input
                      id="packsPerGatha"
                      name="packsPerGatha"
                      type="number"
                      min="1"
                      placeholder="30"
                      value={formData.packsPerGatha}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-gray-500 mt-1">Default is 30 packs per gatha</p>
                  </div>

                  {!isEditing && (
                    <div className="space-y-2">
                      <Label htmlFor="initialStock" className="text-sm font-medium">
                        Initial Stock Quantity
                      </Label>
                      <Input
                        id="initialStock"
                        name="initialStock"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={formData.initialStock}
                        onChange={handleChange}
                      />
                      <p className="text-xs text-gray-500 mt-1 mb-1">Optional: Set initial inventory quantity</p>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-end space-x-4 pt-4 border-gray-200 border-t px-6">
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => navigate('/items')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEditing ? 'Update Item' : 'Create Item'}
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ItemForm;