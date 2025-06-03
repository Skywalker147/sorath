import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import {
  Home,
  Users,
  Package,
  Warehouse,
  ShoppingCart,
  RotateCcw,
  CreditCard,
  BarChart3,
  Menu,
  Package2,
  Settings
} from 'lucide-react';

const Sidebar = ({ collapsed, role }) => {
  const location = useLocation();

  // Navigation items based on role
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['owner', 'warehouse'] }
    ];

    const ownerItems = [
      { name: 'User Management', href: '/users', icon: Users, roles: ['owner'] },
      { name: 'Item Management', href: '/items', icon: Package2, roles: ['owner'] },
      { name: 'Warehouse Management', href: '/warehouses', icon: Warehouse, roles: ['owner'] },
      { name: 'Payment Management', href: '/payments', icon: CreditCard, roles: ['owner'] },
      { name: 'Statistics', href: '/statistics', icon: BarChart3, roles: ['owner'] }
    ];

    const sharedItems = [
      { name: 'Inventory', href: '/inventory', icon: Package, roles: ['owner', 'warehouse'] },
      { name: 'Orders', href: '/orders', icon: ShoppingCart, roles: ['owner', 'warehouse'] },
      { name: 'Return Orders', href: '/returns', icon: RotateCcw, roles: ['owner', 'warehouse'] }
    ];

    const allItems = [...baseItems, ...ownerItems, ...sharedItems];
    
    return allItems.filter(item => item.roles.includes(role));
  };

  const navigationItems = getNavigationItems();

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <img 
            src="/logo.jpg" 
            alt="Sorath Masala" 
            className={cn(
              "transition-all duration-300",
              collapsed ? "w-8 h-8" : "w-10 h-10"
            )}
          />
          {!collapsed && (
            <div className="ml-3">
              <h1 className="text-lg font-bold text-red-600">Sorath Masala</h1>
              <p className="text-xs text-gray-500 capitalize">{role} Portal</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out",
                    isActive
                      ? "bg-red-50 text-red-700 border-r-2 border-red-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    collapsed && "justify-center"
                  )}
                >
                  <Icon className={cn(
                    "flex-shrink-0",
                    collapsed ? "h-5 w-5" : "h-5 w-5 mr-3"
                  )} />
                  {!collapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Settings */}
      <div className="border-t border-gray-200 p-2">
        <Link
          to="/settings"
          className={cn(
            "flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150 ease-in-out",
            collapsed && "justify-center"
          )}
        >
          <Settings className={cn(
            "flex-shrink-0",
            collapsed ? "h-5 w-5" : "h-5 w-5 mr-3"
          )} />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* Collapse Toggle */}
      <div className="border-t border-gray-200 p-2">
        <button
          onClick={() => {}}
          className={cn(
            "flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150 ease-in-out",
            collapsed && "justify-center"
          )}
        >
          <Menu className={cn(
            "flex-shrink-0",
            collapsed ? "h-5 w-5" : "h-5 w-5 mr-3"
          )} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;