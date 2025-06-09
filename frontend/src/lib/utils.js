import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Tailwind CSS class utility
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Currency formatting utilities
export const currencyUtils = {
  format: (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '₹0';
    }
    
    const numAmount = parseFloat(amount);
    
    // For Indian currency formatting with commas
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(numAmount);
  },

  formatWithoutSymbol: (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0';
    }
    
    const numAmount = parseFloat(amount);
    
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(numAmount);
  },

  parse: (formattedAmount) => {
    if (typeof formattedAmount !== 'string') {
      return parseFloat(formattedAmount) || 0;
    }
    
    // Remove currency symbol and commas
    const cleanAmount = formattedAmount.replace(/[₹,\s]/g, '');
    return parseFloat(cleanAmount) || 0;
  }
};

// Date formatting utilities
export const dateUtils = {
  formatDate: (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  },

  formatDateTime: (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return '-';
    }
  },

  formatTime: (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '-';
    }
  },

  formatDateForInput: (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date for input:', error);
      return '';
    }
  },

  formatDateTimeForInput: (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting datetime for input:', error);
      return '';
    }
  },

  getRelativeTime: (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) {
        return 'Just now';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else if (diffInSeconds < 2592000) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
      } else {
        return dateUtils.formatDate(dateString);
      }
    } catch (error) {
      console.error('Error calculating relative time:', error);
      return '-';
    }
  },

  isToday: (dateString) => {
    if (!dateString) return false;
    
    try {
      const date = new Date(dateString);
      const today = new Date();
      
      return date.toDateString() === today.toDateString();
    } catch (error) {
      return false;
    }
  },

  isThisWeek: (dateString) => {
    if (!dateString) return false;
    
    try {
      const date = new Date(dateString);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      return date >= weekAgo && date <= today;
    } catch (error) {
      return false;
    }
  },

  isThisMonth: (dateString) => {
    if (!dateString) return false;
    
    try {
      const date = new Date(dateString);
      const today = new Date();
      
      return date.getMonth() === today.getMonth() && 
             date.getFullYear() === today.getFullYear();
    } catch (error) {
      return false;
    }
  }
};

// String utilities
export const stringUtils = {
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  capitalizeWords: (str) => {
    if (!str) return '';
    return str.split(' ').map(word => stringUtils.capitalize(word)).join(' ');
  },

  truncate: (str, length = 50) => {
    if (!str) return '';
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  },

  slugify: (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  initials: (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
};

// Number utilities
export const numberUtils = {
  formatLargeNumber: (num) => {
    if (num === null || num === undefined || isNaN(num)) {
      return '0';
    }
    
    const absNum = Math.abs(num);
    
    if (absNum >= 10000000) { // 1 crore
      return (num / 10000000).toFixed(1) + 'Cr';
    } else if (absNum >= 100000) { // 1 lakh
      return (num / 100000).toFixed(1) + 'L';
    } else if (absNum >= 1000) { // 1 thousand
      return (num / 1000).toFixed(1) + 'K';
    }
    
    return num.toString();
  },

  formatPercentage: (value, total) => {
    if (!total || total === 0) return '0%';
    const percentage = (value / total) * 100;
    return percentage.toFixed(1) + '%';
  },

  clamp: (value, min, max) => {
    return Math.min(Math.max(value, min), max);
  },

  isEven: (num) => {
    return num % 2 === 0;
  },

  isOdd: (num) => {
    return num % 2 !== 0;
  }
};

// Array utilities
export const arrayUtils = {
  groupBy: (array, key) => {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  sortBy: (array, key, direction = 'asc') => {
    return [...array].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];
      
      if (direction === 'desc') {
        return bValue > aValue ? 1 : -1;
      }
      
      return aValue > bValue ? 1 : -1;
    });
  },

  unique: (array, key = null) => {
    if (key) {
      const seen = new Set();
      return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) {
          return false;
        }
        seen.add(value);
        return true;
      });
    }
    
    return [...new Set(array)];
  },

  chunk: (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
};

// Validation utilities
export const validationUtils = {
  isEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isPhoneNumber: (phone) => {
    // Indian phone number format
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  },

  isPAN: (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
  },

  isAadhar: (aadhar) => {
    const aadharRegex = /^\d{12}$/;
    return aadharRegex.test(aadhar.replace(/\D/g, ''));
  },

  isPincode: (pincode) => {
    const pincodeRegex = /^\d{6}$/;
    return pincodeRegex.test(pincode);
  },

  isRequired: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },

  minLength: (value, min) => {
    return value && value.toString().length >= min;
  },

  maxLength: (value, max) => {
    return value && value.toString().length <= max;
  },

  isNumeric: (value) => {
    return !isNaN(value) && !isNaN(parseFloat(value));
  },

  isPositive: (value) => {
    return validationUtils.isNumeric(value) && parseFloat(value) > 0;
  }
};

// Local storage utilities
export const storageUtils = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

// API utilities
export const apiUtils = {
  buildQueryString: (params) => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, value);
      }
    });
    
    return searchParams.toString();
  },

  handleApiError: (error) => {
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with error status
      return error.response.data?.error || `Server error: ${error.response.status}`;
    } else if (error.request) {
      // Request was made but no response received
      return 'Network error: Please check your connection';
    } else {
      // Something else happened
      return error.message || 'An unexpected error occurred';
    }
  }
};

// Export all utilities as default
export default {
  currencyUtils,
  dateUtils,
  stringUtils,
  numberUtils,
  arrayUtils,
  validationUtils,
  storageUtils,
  apiUtils,
  cn
};