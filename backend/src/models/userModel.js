const db = require('../config/db');

class UserModel {
  // Get all warehouses
  static async getAllWarehouses() {
    const [rows] = await db.execute(
      `SELECT id, name, address, pincode, username, status, created_at, updated_at 
       FROM warehouses ORDER BY created_at DESC`
    );
    return rows;
  }

  // Get warehouse by ID
  static async getWarehouseById(id) {
    const [rows] = await db.execute(
      `SELECT id, name, address, pincode, username, status, created_at, updated_at 
       FROM warehouses WHERE id = ?`,
      [id]
    );
    return rows[0];
  }

  // Create warehouse
  static async createWarehouse(warehouseData) {
    const { name, address, pincode, username, password } = warehouseData;
    const [result] = await db.execute(
      `INSERT INTO warehouses (name, address, pincode, username, password) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, address, pincode, username, password]
    );
    return result.insertId;
  }

  // Update warehouse
  static async updateWarehouse(id, warehouseData) {
    const { name, address, pincode, username } = warehouseData;
    const [result] = await db.execute(
      `UPDATE warehouses SET name = ?, address = ?, pincode = ?, username = ? 
       WHERE id = ?`,
      [name, address, pincode, username, id]
    );
    return result.affectedRows;
  }

  // Update warehouse status
  static async updateWarehouseStatus(id, status) {
    const [result] = await db.execute(
      `UPDATE warehouses SET status = ? WHERE id = ?`,
      [status, id]
    );
    return result.affectedRows;
  }

  // Delete warehouse
  static async deleteWarehouse(id) {
    const [result] = await db.execute(
      `DELETE FROM warehouses WHERE id = ?`,
      [id]
    );
    return result.affectedRows;
  }

  // Get all dealers
  static async getAllDealers() {
    const [rows] = await db.execute(
      `SELECT d.id, d.name, d.agency_name, d.address, d.pincode, d.mobile_number, 
              d.status, d.created_at, d.updated_at,
              w.name as warehouse_name, w.id as warehouse_id
       FROM dealers d
       LEFT JOIN warehouses w ON d.warehouse_id = w.id
       ORDER BY d.created_at DESC`
    );
    return rows;
  }

  // Get dealer by ID
  static async getDealerById(id) {
    const [rows] = await db.execute(
      `SELECT d.id, d.name, d.agency_name, d.address, d.pincode, d.mobile_number, 
              d.status, d.created_at, d.updated_at,
              w.name as warehouse_name, w.id as warehouse_id
       FROM dealers d
       LEFT JOIN warehouses w ON d.warehouse_id = w.id
       WHERE d.id = ?`,
      [id]
    );
    return rows[0];
  }

  // Update dealer
  static async updateDealer(id, dealerData) {
    const { name, agency_name, address, pincode, mobile_number, warehouse_id } = dealerData;
    const [result] = await db.execute(
      `UPDATE dealers SET name = ?, agency_name = ?, address = ?, pincode = ?, 
       mobile_number = ?, warehouse_id = ? WHERE id = ?`,
      [name, agency_name, address, pincode, mobile_number, warehouse_id, id]
    );
    return result.affectedRows;
  }

  // Update dealer status
  static async updateDealerStatus(id, status) {
    const [result] = await db.execute(
      `UPDATE dealers SET status = ? WHERE id = ?`,
      [status, id]
    );
    return result.affectedRows;
  }

  // Delete dealer
  static async deleteDealer(id) {
    const [result] = await db.execute(
      `DELETE FROM dealers WHERE id = ?`,
      [id]
    );
    return result.affectedRows;
  }

  // Get all salesmen
  static async getAllSalesmen() {
    const [rows] = await db.execute(
      `SELECT s.id, s.name, s.aadhar_number, s.pan_number, s.mobile_number, 
              s.status, s.created_at, s.updated_at,
              w.name as warehouse_name, w.id as warehouse_id
       FROM salesmen s
       LEFT JOIN warehouses w ON s.warehouse_id = w.id
       ORDER BY s.created_at DESC`
    );
    return rows;
  }

  // Get salesman by ID
  static async getSalesmanById(id) {
    const [rows] = await db.execute(
      `SELECT s.id, s.name, s.aadhar_number, s.pan_number, s.mobile_number, 
              s.status, s.created_at, s.updated_at,
              w.name as warehouse_name, w.id as warehouse_id
       FROM salesmen s
       LEFT JOIN warehouses w ON s.warehouse_id = w.id
       WHERE s.id = ?`,
      [id]
    );
    return rows[0];
  }

  // Update salesman
  static async updateSalesman(id, salesmanData) {
    const { name, aadhar_number, pan_number, mobile_number, warehouse_id } = salesmanData;
    const [result] = await db.execute(
      `UPDATE salesmen SET name = ?, aadhar_number = ?, pan_number = ?, 
       mobile_number = ?, warehouse_id = ? WHERE id = ?`,
      [name, aadhar_number, pan_number, mobile_number, warehouse_id, id]
    );
    return result.affectedRows;
  }

  // Update salesman status
  static async updateSalesmanStatus(id, status) {
    const [result] = await db.execute(
      `UPDATE salesmen SET status = ? WHERE id = ?`,
      [status, id]
    );
    return result.affectedRows;
  }

  // Delete salesman
  static async deleteSalesman(id) {
    const [result] = await db.execute(
      `DELETE FROM salesmen WHERE id = ?`,
      [id]
    );
    return result.affectedRows;
  }

  // Get registration codes
  static async getRegistrationCodes() {
    const [rows] = await db.execute(
      `SELECT rc.id, rc.code, rc.role, rc.expires_at, rc.is_used, rc.created_at,
              w.name as warehouse_name
       FROM registration_codes rc
       LEFT JOIN warehouses w ON rc.warehouse_id = w.id
       ORDER BY rc.created_at DESC`
    );
    return rows;
  }

  // Delete expired registration codes
  static async deleteExpiredCodes() {
    const [result] = await db.execute(
      `DELETE FROM registration_codes WHERE expires_at < NOW()`
    );
    return result.affectedRows;
  }

  // Get user statistics
  static async getUserStats() {
    const [warehouseStats] = await db.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
       FROM warehouses`
    );

    const [dealerStats] = await db.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
       FROM dealers`
    );

    const [salesmanStats] = await db.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
       FROM salesmen`
    );

    const [codeStats] = await db.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_used = 0 AND expires_at > NOW() THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used,
        SUM(CASE WHEN expires_at <= NOW() THEN 1 ELSE 0 END) as expired
       FROM registration_codes`
    );

    return {
      warehouses: warehouseStats[0],
      dealers: dealerStats[0],
      salesmen: salesmanStats[0],
      registrationCodes: codeStats[0]
    };
  }

  // Check if username exists for warehouse
  static async checkWarehouseUsername(username, excludeId = null) {
    let query = `SELECT id FROM warehouses WHERE username = ?`;
    let params = [username];
    
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    
    const [rows] = await db.execute(query, params);
    return rows.length > 0;
  }

  // Check if mobile number exists for dealer
  static async checkDealerMobile(mobile, excludeId = null) {
    let query = `SELECT id FROM dealers WHERE mobile_number = ?`;
    let params = [mobile];
    
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    
    const [rows] = await db.execute(query, params);
    return rows.length > 0;
  }

  // Check if mobile number exists for salesman
  static async checkSalesmanMobile(mobile, excludeId = null) {
    let query = `SELECT id FROM salesmen WHERE mobile_number = ?`;
    let params = [mobile];
    
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    
    const [rows] = await db.execute(query, params);
    return rows.length > 0;
  }

  // Check if aadhar exists for salesman
  static async checkSalesmanAadhar(aadhar, excludeId = null) {
    let query = `SELECT id FROM salesmen WHERE aadhar_number = ?`;
    let params = [aadhar];
    
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    
    const [rows] = await db.execute(query, params);
    return rows.length > 0;
  }

  // Check if PAN exists for salesman
  static async checkSalesmanPan(pan, excludeId = null) {
    let query = `SELECT id FROM salesmen WHERE pan_number = ?`;
    let params = [pan];
    
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    
    const [rows] = await db.execute(query, params);
    return rows.length > 0;
  }
}

module.exports = UserModel;