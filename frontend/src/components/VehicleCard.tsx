import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Loader2, PackageX, Package, Edit, Trash2, Plus } from 'lucide-react';
import type { Vehicle } from '../api/vehicles';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPurchase: (id: string) => void;
  isPurchasing: boolean;
  isAdmin: boolean;
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (id: string) => void;
  onRestock?: (id: string) => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ 
  vehicle, 
  onPurchase, 
  isPurchasing, 
  isAdmin,
  onEdit,
  onDelete,
  onRestock
}) => {
  const isOutOfStock = vehicle.quantity === 0;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      className="glass-card rounded-2xl overflow-hidden flex flex-col group"
    >
      <div className="aspect-video bg-gradient-to-br from-white/5 to-white/10 relative overflow-hidden flex items-center justify-center">
        {/* Placeholder for real images */}
        <CarPlaceholder category={vehicle.category} />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground px-4 py-1.5 rounded-full font-semibold tracking-wide text-sm flex items-center gap-2">
              <PackageX size={16} /> Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg text-foreground">{vehicle.make} {vehicle.model}</h3>
            <p className="text-muted-foreground text-sm">{vehicle.category}</p>
          </div>
          <span className="font-bold text-xl text-white">
            ${vehicle.price.toLocaleString()}
          </span>
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
            <Package size={14} />
            <span className={vehicle.quantity < 3 && !isOutOfStock ? 'text-amber-400 font-medium' : ''}>
              {vehicle.quantity} left
            </span>
          </div>
          
          {!isAdmin ? (
            <motion.button
              whileHover={{ scale: isOutOfStock ? 1 : 1.05 }}
              whileTap={{ scale: isOutOfStock ? 1 : 0.95 }}
              onClick={() => onPurchase(vehicle.id)}
              disabled={isOutOfStock || isPurchasing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isOutOfStock 
                  ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                  : 'bg-white text-black hover:bg-white/90'
              }`}
            >
              {isPurchasing ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
              Buy
            </motion.button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => onRestock?.(vehicle.id)}
                className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                title="Restock"
              >
                <Plus size={18} />
              </button>
              <button 
                onClick={() => onEdit?.(vehicle)}
                className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                title="Edit"
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={() => onDelete?.(vehicle.id)}
                className="p-2 bg-destructive/20 text-destructive-foreground rounded-lg hover:bg-destructive/30 transition-colors"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Simple aesthetic placeholder based on category
const CarPlaceholder = ({ category }: { category: string }) => {
  const isSUV = category.toLowerCase().includes('suv');
  const isTruck = category.toLowerCase().includes('truck');
  
  return (
    <div className="opacity-20 group-hover:opacity-40 transition-opacity duration-500 transform group-hover:scale-110">
      <svg width="120" height="60" viewBox="0 0 120 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        {isTruck ? (
          <path d="M10 40H110V30C110 25 105 20 100 20H70L60 10H20C15 10 10 15 10 20V40ZM25 50C25 55 20 60 15 60C10 60 5 55 5 50C5 45 10 40 15 40C20 40 25 45 25 50ZM95 50C95 55 90 60 85 60C80 60 75 55 75 50C75 45 80 40 85 40C90 40 95 45 95 50Z" fill="currentColor"/>
        ) : isSUV ? (
          <path d="M10 40H110V25C110 20 105 15 100 15H80L65 5H20C15 5 10 10 10 15V40ZM25 50C25 55 20 60 15 60C10 60 5 55 5 50C5 45 10 40 15 40C20 40 25 45 25 50ZM105 50C105 55 100 60 95 60C90 60 85 55 85 50C85 45 90 40 95 40C100 40 105 45 105 50Z" fill="currentColor"/>
        ) : (
          <path d="M10 40H110V25C110 20 105 15 100 15H75L60 5H30C25 5 20 10 15 15L10 25V40ZM25 50C25 55 20 60 15 60C10 60 5 55 5 50C5 45 10 40 15 40C20 40 25 45 25 50ZM105 50C105 55 100 60 95 60C90 60 85 55 85 50C85 45 90 40 95 40C100 40 105 45 105 50Z" fill="currentColor"/>
        )}
      </svg>
    </div>
  );
};

export default VehicleCard;
