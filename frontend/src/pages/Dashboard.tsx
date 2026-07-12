import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVehicles, searchVehicles, purchaseVehicle, restockVehicle, deleteVehicle, type Vehicle } from '../api/vehicles';
import { useAuth } from '../context/AuthContext';
import VehicleCard from '../components/VehicleCard';
import { Search, Loader2, FilterX, Plus, Car } from 'lucide-react';
import toast from 'react-hot-toast';


const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  const [searchParams, setSearchParams] = useState({
    make: '',
    category: '',
    minPrice: '',
    maxPrice: ''
  });

  const [activeFilters, setActiveFilters] = useState({});

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles', activeFilters],
    queryFn: () => Object.keys(activeFilters).length > 0 ? searchVehicles(activeFilters) : getVehicles(),
  });

  const purchaseMutation = useMutation({
    mutationFn: purchaseVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle purchased successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to purchase vehicle');
    }
  });

  const restockMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string, amount: number }) => restockVehicle(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle restocked successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to restock');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle deleted');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete');
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const filters: any = {};
    if (searchParams.make) filters.make = searchParams.make;
    if (searchParams.category) filters.category = searchParams.category;
    if (searchParams.minPrice) filters.minPrice = Number(searchParams.minPrice);
    if (searchParams.maxPrice) filters.maxPrice = Number(searchParams.maxPrice);
    setActiveFilters(filters);
  };

  const handleClearFilters = () => {
    setSearchParams({ make: '', category: '', minPrice: '', maxPrice: '' });
    setActiveFilters({});
  };

  const handleRestock = (id: string) => {
    const amount = prompt('Enter restock amount:');
    if (amount && !isNaN(Number(amount)) && Number(amount) > 0) {
      restockMutation.mutate({ id, amount: Number(amount) });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1">Browse our premium selection of vehicles.</p>
        </div>
        {isAdmin && (
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
            <Plus size={18} />
            Add Vehicle
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearch} className="glass p-4 rounded-xl flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Make/Model</label>
          <input 
            type="text" 
            placeholder="e.g. Toyota" 
            value={searchParams.make}
            onChange={e => setSearchParams(prev => ({ ...prev, make: e.target.value }))}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/30"
          />
        </div>
        <div className="space-y-1.5 w-full md:w-48">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</label>
          <select 
            value={searchParams.category}
            onChange={e => setSearchParams(prev => ({ ...prev, category: e.target.value }))}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/30 text-white"
          >
            <option value="">All Categories</option>
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="Truck">Truck</option>
            <option value="Coupe">Coupe</option>
          </select>
        </div>
        <div className="space-y-1.5 w-full sm:w-32">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Min Price</label>
          <input 
            type="number" 
            placeholder="0" 
            value={searchParams.minPrice}
            onChange={e => setSearchParams(prev => ({ ...prev, minPrice: e.target.value }))}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/30"
          />
        </div>
        <div className="space-y-1.5 w-full sm:w-32">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Max Price</label>
          <input 
            type="number" 
            placeholder="Unlimited" 
            value={searchParams.maxPrice}
            onChange={e => setSearchParams(prev => ({ ...prev, maxPrice: e.target.value }))}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white/30"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
          <button type="submit" className="flex-1 md:flex-none bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
            <Search size={16} /> Search
          </button>
          {Object.keys(activeFilters).length > 0 && (
            <button type="button" onClick={handleClearFilters} className="px-4 py-2 rounded-lg font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center justify-center gap-2">
              <FilterX size={16} />
            </button>
          )}
        </div>
      </form>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 size={48} className="animate-spin text-muted-foreground" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-24 glass-card rounded-2xl">
          <Car size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No vehicles found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search criteria.</p>
          {Object.keys(activeFilters).length > 0 && (
            <button onClick={handleClearFilters} className="mt-4 text-sm font-medium text-white hover:underline">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {vehicles.map((vehicle: Vehicle) => (
            <VehicleCard 
              key={vehicle.id} 
              vehicle={vehicle} 
              isAdmin={isAdmin}
              isPurchasing={purchaseMutation.isPending && purchaseMutation.variables === vehicle.id}
              onPurchase={(id) => purchaseMutation.mutate(id)}
              onDelete={(id) => {
                if (confirm('Are you sure you want to delete this vehicle?')) {
                  deleteMutation.mutate(id);
                }
              }}
              onRestock={handleRestock}
              onEdit={() => toast.error('Edit modal not implemented in this demo')}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
