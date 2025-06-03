import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Validation utilities
export const validation = {
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  phone: (phone) => /^[6-9]\d{9}$/.test(phone),
  pincode: (pincode) => /^\d{6}$/.test(pincode),
  aadhar: (aadhar) => /^\d{12}$/.test(aadhar),
  pan: (pan) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan),
  username: (username) => /^[a-zA-Z0-9_]{3,20}$/.test(username),
  password: (password) => password.length >= 6
};

// Date utilities
export const dateUtils = {
  formatDate: (date) => new Date(date).toLocaleDateString('en-IN'),
  formatDateTime: (date) => new Date(date).toLocaleString('en-IN'),
  formatTime: (date) => new Date(date).toLocaleTimeString('en-IN'),
  isExpired: (date) => new Date(date) < new Date(),
  addHours: (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000),
  addDays: (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
};

// Currency utilities
export const currencyUtils = {
  format: (amount) => {
    if (amount === null || amount === undefined) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  },
  
  formatNumber: (number) => {
    if (number === null || number === undefined) return '0';
    return new Intl.NumberFormat('en-IN').format(number);
  },

  parse: (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.-]/g, '');
      return parseFloat(cleaned) || 0;
    }
    return 0;
  }
};

// Storage utilities
export const storage = {
  setToken: (token) => localStorage.setItem('adminToken', token),
  getToken: () => localStorage.getItem('adminToken'),
  removeToken: () => localStorage.removeItem('adminToken'),
  
  setUser: (user) => localStorage.setItem('adminUser', JSON.stringify(user)),
  getUser: () => {
    try {
      const user = localStorage.getItem('adminUser');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },
  removeUser: () => localStorage.removeItem('adminUser'),
  
  clear: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  }
};

// String utilities
export const stringUtils = {
  capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1),
  truncate: (str, length = 50) => str.length > length ? `${str.substring(0, length)}...` : str,
  kebabCase: (str) => str.replace(/\s+/g, '-').toLowerCase(),
  camelCase: (str) => str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : ''),
  generateId: () => Math.random().toString(36).substr(2, 9),
  generateCode: (length = 8) => Math.random().toString(36).substring(2, 2 + length).toUpperCase()
};

// Array utilities
export const arrayUtils = {
  groupBy: (array, key) => {
    return array.reduce((groups, item) => {
      const group = item[key];
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(item);
      return groups;
    }, {});
  },
  
  sortBy: (array, key, direction = 'asc') => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (direction === 'desc') {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });
  },
  
  filterBy: (array, filters) => {
    return array.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === '' || value === null || value === undefined) return true;
        if (typeof value === 'string') {
          return item[key]?.toString().toLowerCase().includes(value.toLowerCase());
        }
        return item[key] === value;
      });
    });
  },
  
  unique: (array, key) => {
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    return [...new Set(array)];
  }
};

// Status utilities
export const statusUtils = {
  getStatusColor: (status) => {
    const colors = {
      active: 'green',
      inactive: 'red',
      pending: 'yellow',
      approved: 'green',
      rejected: 'red',
      dispatched: 'blue',
      delivered: 'green',
      cancelled: 'red',
      paid: 'green',
      partial: 'yellow',
      overdue: 'red'
    };
    return colors[status] || 'gray';
  },
  
  getStatusBadgeClass: (status) => {
    const color = statusUtils.getStatusColor(status);
    return `bg-${color}-100 text-${color}-800`;
  }
};

// Form utilities
export const formUtils = {
  validateForm: (data, rules) => {
    const errors = {};
    
    Object.entries(rules).forEach(([field, rule]) => {
      const value = data[field];
      
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors[field] = `${rule.label || field} is required`;
        return;
      }
      
      if (value && rule.validator && !rule.validator(value)) {
        errors[field] = rule.message || `Invalid ${rule.label || field}`;
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },
  
  sanitizeInput: (value) => {
    if (typeof value !== 'string') return value;
    return value.trim().replace(/[<>]/g, '');
  }
};

// Notification utilities (for future implementation with toast library)
export const notify = {
  success: (message) => console.log('SUCCESS:', message),
  error: (message) => console.error('ERROR:', message),
  warning: (message) => console.warn('WARNING:', message),
  info: (message) => console.log('INFO:', message)
};

// Role-based utilities
export const roleUtils = {
  hasPermission: (userRole, requiredRoles) => {
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(userRole);
    }
    return userRole === requiredRoles;
  },
  
  getMenuItems: (role) => {
    const allItems = {
      dashboard: { roles: ['owner', 'warehouse'] },
      users: { roles: ['owner'] },
      items: { roles: ['owner'] },
      warehouses: { roles: ['owner'] },
      inventory: { roles: ['owner', 'warehouse'] },
      orders: { roles: ['owner', 'warehouse'] },
      returns: { roles: ['owner', 'warehouse'] },
      payments: { roles: ['owner'] },
      statistics: { roles: ['owner'] }
    };
    
    return Object.entries(allItems)
      .filter(([key, config]) => config.roles.includes(role))
      .map(([key]) => key);
  }
};

// Export all utilities
export default {
  cn,
  validation,
  dateUtils,
  currencyUtils,
  storage,
  stringUtils,
  arrayUtils,
  statusUtils,
  formUtils,
  notify,
  roleUtils
};