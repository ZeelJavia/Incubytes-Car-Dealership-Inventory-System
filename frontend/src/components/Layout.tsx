import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Car } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="glass sticky top-0 z-50 px-6 py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
              <Car size={24} />
            </div>
            <span className="font-semibold text-xl tracking-tight">Incubytes Auto</span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {user?.email} 
              <span className="bg-white/10 text-white text-xs px-2 py-0.5 rounded-full ml-2 uppercase font-medium tracking-wider">
                {user?.role}
              </span>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
            >
              <LogOut size={20} />
              <span className="text-sm font-medium">Sign Out</span>
            </motion.button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 py-12">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
