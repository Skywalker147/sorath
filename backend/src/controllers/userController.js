const bcrypt = require('bcrypt');
const UserModel = require('../models/userModel');

// Warehouse Management
const getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await UserModel.getAllWarehouses();
    res.json({
      success: true,
      data: warehouses
    });
  } catch (error) {
    console.error('Get warehouses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await UserModel.getWarehouseById(id);
    
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    
    res.json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    console.error('Get warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createWarehouse = async (req, res) => {
  try {
    const { name, address, pincode, username, password } = req.body;

    // Validation
    if (!name || !address || !pincode || !username || !password) {
      return res.status(400).json({ 
        error: 'All fields are required: name, address, pincode, username, password' 
      });
    }

    // Check if username already exists
    const usernameExists = await UserModel.checkWarehouseUsername(username);
    if (usernameExists) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create warehouse
    const warehouseId = await UserModel.createWarehouse({
      name,
      address,
      pincode,
      username,
      password: hashedPassword
    });

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: { id: warehouseId }
    });
  } catch (error) {
    console.error('Create warehouse error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, pincode, username } = req.body;

    // Validation
    if (!name || !address || !pincode || !username) {
      return res.status(400).json({ 
        error: 'All fields are required: name, address, pincode, username' 
      });
    }

    // Check if warehouse exists
    const warehouse = await UserModel.getWarehouseById(id);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    // Check if username already exists (excluding current warehouse)
    const usernameExists = await UserModel.checkWarehouseUsername(username, id);
    if (usernameExists) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Update warehouse
    await UserModel.updateWarehouse(id, { name, address, pincode, username });

    res.json({
      success: true,
      message: 'Warehouse updated successfully'
    });
  } catch (error) {
    console.error('Update warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateWarehouseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or inactive' });
    }

    const affected = await UserModel.updateWarehouseStatus(id, status);
    
    if (affected === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({
      success: true,
      message: `Warehouse ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Update warehouse status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;

    const affected = await UserModel.deleteWarehouse(id);
    
    if (affected === 0) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }

    res.json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    console.error('Delete warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Dealer Management
const getAllDealers = async (req, res) => {
  try {
    const dealers = await UserModel.getAllDealers();
    res.json({
      success: true,
      data: dealers
    });
  } catch (error) {
    console.error('Get dealers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getDealerById = async (req, res) => {
  try {
    const { id } = req.params;
    const dealer = await UserModel.getDealerById(id);
    
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }
    
    res.json({
      success: true,
      data: dealer
    });
  } catch (error) {
    console.error('Get dealer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateDealer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, agency_name, address, pincode, mobile_number, warehouse_id } = req.body;

    // Validation
    if (!name || !agency_name || !address || !pincode || !mobile_number) {
      return res.status(400).json({ 
        error: 'All fields are required: name, agency_name, address, pincode, mobile_number' 
      });
    }

    // Check if dealer exists
    const dealer = await UserModel.getDealerById(id);
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    // Check if mobile number already exists (excluding current dealer)
    const mobileExists = await UserModel.checkDealerMobile(mobile_number, id);
    if (mobileExists) {
      return res.status(400).json({ error: 'Mobile number already exists' });
    }

    // Update dealer
    await UserModel.updateDealer(id, { 
      name, 
      agency_name, 
      address, 
      pincode, 
      mobile_number, 
      warehouse_id: warehouse_id || null 
    });

    res.json({
      success: true,
      message: 'Dealer updated successfully'
    });
  } catch (error) {
    console.error('Update dealer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateDealerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or inactive' });
    }

    const affected = await UserModel.updateDealerStatus(id, status);
    
    if (affected === 0) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    res.json({
      success: true,
      message: `Dealer ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Update dealer status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteDealer = async (req, res) => {
  try {
    const { id } = req.params;

    const affected = await UserModel.deleteDealer(id);
    
    if (affected === 0) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    res.json({
      success: true,
      message: 'Dealer deleted successfully'
    });
  } catch (error) {
    console.error('Delete dealer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Salesman Management
const getAllSalesmen = async (req, res) => {
  try {
    const salesmen = await UserModel.getAllSalesmen();
    res.json({
      success: true,
      data: salesmen
    });
  } catch (error) {
    console.error('Get salesmen error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getSalesmanById = async (req, res) => {
  try {
    const { id } = req.params;
    const salesman = await UserModel.getSalesmanById(id);
    
    if (!salesman) {
      return res.status(404).json({ error: 'Salesman not found' });
    }
    
    res.json({
      success: true,
      data: salesman
    });
  } catch (error) {
    console.error('Get salesman error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateSalesman = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, aadhar_number, pan_number, mobile_number, warehouse_id } = req.body;

    // Validation
    if (!name || !aadhar_number || !pan_number || !mobile_number) {
      return res.status(400).json({ 
        error: 'All fields are required: name, aadhar_number, pan_number, mobile_number' 
      });
    }

    // Check if salesman exists
    const salesman = await UserModel.getSalesmanById(id);
    if (!salesman) {
      return res.status(404).json({ error: 'Salesman not found' });
    }

    // Check if mobile number already exists (excluding current salesman)
    const mobileExists = await UserModel.checkSalesmanMobile(mobile_number, id);
    if (mobileExists) {
      return res.status(400).json({ error: 'Mobile number already exists' });
    }

    // Check if aadhar already exists (excluding current salesman)
    const aadharExists = await UserModel.checkSalesmanAadhar(aadhar_number, id);
    if (aadharExists) {
      return res.status(400).json({ error: 'Aadhar number already exists' });
    }

    // Check if PAN already exists (excluding current salesman)
    const panExists = await UserModel.checkSalesmanPan(pan_number, id);
    if (panExists) {
      return res.status(400).json({ error: 'PAN number already exists' });
    }

    // Update salesman
    await UserModel.updateSalesman(id, { 
      name, 
      aadhar_number, 
      pan_number, 
      mobile_number, 
      warehouse_id: warehouse_id || null 
    });

    res.json({
      success: true,
      message: 'Salesman updated successfully'
    });
  } catch (error) {
    console.error('Update salesman error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateSalesmanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or inactive' });
    }

    const affected = await UserModel.updateSalesmanStatus(id, status);
    
    if (affected === 0) {
      return res.status(404).json({ error: 'Salesman not found' });
    }

    res.json({
      success: true,
      message: `Salesman ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Update salesman status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteSalesman = async (req, res) => {
  try {
    const { id } = req.params;

    const affected = await UserModel.deleteSalesman(id);
    
    if (affected === 0) {
      return res.status(404).json({ error: 'Salesman not found' });
    }

    res.json({
      success: true,
      message: 'Salesman deleted successfully'
    });
  } catch (error) {
    console.error('Delete salesman error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Registration Code Management
const getRegistrationCodes = async (req, res) => {
  try {
    const codes = await UserModel.getRegistrationCodes();
    res.json({
      success: true,
      data: codes
    });
  } catch (error) {
    console.error('Get registration codes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const cleanupExpiredCodes = async (req, res) => {
  try {
    const deleted = await UserModel.deleteExpiredCodes();
    res.json({
      success: true,
      message: `${deleted} expired codes deleted`,
      deletedCount: deleted
    });
  } catch (error) {
    console.error('Cleanup expired codes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Statistics
const getUserStats = async (req, res) => {
  try {
    const stats = await UserModel.getUserStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  // Warehouse
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  updateWarehouseStatus,
  deleteWarehouse,
  
  // Dealer
  getAllDealers,
  getDealerById,
  updateDealer,
  updateDealerStatus,
  deleteDealer,
  
  // Salesman
  getAllSalesmen,
  getSalesmanById,
  updateSalesman,
  updateSalesmanStatus,
  deleteSalesman,
  
  // Registration Codes
  getRegistrationCodes,
  cleanupExpiredCodes,
  
  // Statistics
  getUserStats
};