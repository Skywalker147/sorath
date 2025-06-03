const db = require('../config/db');

class InventoryModel {
  // Get inventory for all warehouses or specific warehouse
  static async getInventory(warehouseId = null, filters = {}) {
    let query = `
      SELECT 
        inv.id,
        inv.warehouse_id,
        inv.item_id,
        inv.quantity,
        inv.updated_at,
        w.name as warehouse_name,
        w.address as warehouse_address,
        i.name as item_name,
        i.price as item_price,
        i.status as item_status
      FROM inventory inv
      JOIN warehouses w ON inv.warehouse_id = w.id
      JOIN items i ON inv.item_id = i.id
    `;
    
    let params = [];
    let conditions = [];

    if (warehouseId) {
      conditions.push('inv.warehouse_id = ?');
      params.push(warehouseId);
    }

    if (filters.lowStock) {
      conditions.push('inv.quantity <= ?');
      params.push(filters.lowStock);
    }

    if (filters.search) {
      conditions.push('(i.name LIKE ? OR w.name LIKE ?)');
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.warehouseStatus) {
      conditions.push('w.status = ?');
      params.push(filters.warehouseStatus);
    }

    if (filters.itemStatus) {
      conditions.push('i.status = ?');
      params.push(filters.itemStatus);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY w.name, i.name`;

    const [rows] = await db.execute(query, params);
    return rows;
  }

  // Get inventory for specific item across all warehouses
  static async getItemInventory(itemId) {
    const [rows] = await db.execute(
      `SELECT 
        inv.id,
        inv.warehouse_id,
        inv.quantity,
        inv.updated_at,
        w.name as warehouse_name,
        w.address as warehouse_address,
        w.status as warehouse_status
       FROM inventory inv
       JOIN warehouses w ON inv.warehouse_id = w.id
       WHERE inv.item_id = ?
       ORDER BY w.name`,
      [itemId]
    );
    return rows;
  }

  // Get inventory for specific warehouse and item
  static async getSpecificInventory(warehouseId, itemId) {
    const [rows] = await db.execute(
      `SELECT 
        inv.id,
        inv.warehouse_id,
        inv.item_id,
        inv.quantity,
        inv.updated_at,
        w.name as warehouse_name,
        i.name as item_name,
        i.price as item_price
       FROM inventory inv
       JOIN warehouses w ON inv.warehouse_id = w.id
       JOIN items i ON inv.item_id = i.id
       WHERE inv.warehouse_id = ? AND inv.item_id = ?`,
      [warehouseId, itemId]
    );
    return rows[0];
  }

  // Update inventory quantity
  static async updateInventory(warehouseId, itemId, quantity, type = 'set') {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if inventory record exists
      const [existing] = await connection.execute(
        `SELECT quantity FROM inventory WHERE warehouse_id = ? AND item_id = ?`,
        [warehouseId, itemId]
      );

      let newQuantity = quantity;
      
      if (existing.length > 0) {
        // Update existing record
        if (type === 'add') {
          newQuantity = existing[0].quantity + quantity;
        } else if (type === 'subtract') {
          newQuantity = existing[0].quantity - quantity;
        }
        
        // Ensure quantity doesn't go below 0
        newQuantity = Math.max(0, newQuantity);
        
        await connection.execute(
          `UPDATE inventory SET quantity = ? WHERE warehouse_id = ? AND item_id = ?`,
          [newQuantity, warehouseId, itemId]
        );
      } else {
        // Create new record (only if quantity > 0)
        if (newQuantity > 0) {
          await connection.execute(
            `INSERT INTO inventory (warehouse_id, item_id, quantity) VALUES (?, ?, ?)`,
            [warehouseId, itemId, newQuantity]
          );
        }
      }

      await connection.commit();
      return newQuantity;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Bulk update inventory
  static async bulkUpdateInventory(updates) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      for (const update of updates) {
        const { warehouseId, itemId, quantity, type = 'set' } = update;
        
        // Check if inventory record exists
        const [existing] = await connection.execute(
          `SELECT quantity FROM inventory WHERE warehouse_id = ? AND item_id = ?`,
          [warehouseId, itemId]
        );

        let newQuantity = quantity;
        
        if (existing.length > 0) {
          if (type === 'add') {
            newQuantity = existing[0].quantity + quantity;
          } else if (type === 'subtract') {
            newQuantity = existing[0].quantity - quantity;
          }
          
          newQuantity = Math.max(0, newQuantity);
          
          await connection.execute(
            `UPDATE inventory SET quantity = ? WHERE warehouse_id = ? AND item_id = ?`,
            [newQuantity, warehouseId, itemId]
          );
        } else {
          if (newQuantity > 0) {
            await connection.execute(
              `INSERT INTO inventory (warehouse_id, item_id, quantity) VALUES (?, ?, ?)`,
              [warehouseId, itemId, newQuantity]
            );
          }
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Transfer inventory between warehouses
  static async transferInventory(fromWarehouseId, toWarehouseId, itemId, quantity) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check source warehouse has enough quantity
      const [source] = await connection.execute(
        `SELECT quantity FROM inventory WHERE warehouse_id = ? AND item_id = ?`,
        [fromWarehouseId, itemId]
      );

      if (source.length === 0 || source[0].quantity < quantity) {
        throw new Error('Insufficient quantity in source warehouse');
      }

      // Subtract from source
      const newSourceQuantity = source[0].quantity - quantity;
      await connection.execute(
        `UPDATE inventory SET quantity = ? WHERE warehouse_id = ? AND item_id = ?`,
        [newSourceQuantity, fromWarehouseId, itemId]
      );

      // Add to destination
      const [destination] = await connection.execute(
        `SELECT quantity FROM inventory WHERE warehouse_id = ? AND item_id = ?`,
        [toWarehouseId, itemId]
      );

      if (destination.length > 0) {
        const newDestQuantity = destination[0].quantity + quantity;
        await connection.execute(
          `UPDATE inventory SET quantity = ? WHERE warehouse_id = ? AND item_id = ?`,
          [newDestQuantity, toWarehouseId, itemId]
        );
      } else {
        await connection.execute(
          `INSERT INTO inventory (warehouse_id, item_id, quantity) VALUES (?, ?, ?)`,
          [toWarehouseId, itemId, quantity]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get inventory statistics
  static async getInventoryStats(warehouseId = null) {
    let warehouseCondition = '';
    let params = [];
    
    if (warehouseId) {
      warehouseCondition = 'WHERE inv.warehouse_id = ?';
      params.push(warehouseId);
    }

    const [totalStats] = await db.execute(
      `SELECT 
        COUNT(DISTINCT inv.item_id) as total_items,
        COUNT(DISTINCT inv.warehouse_id) as total_warehouses,
        SUM(inv.quantity) as total_quantity,
        SUM(inv.quantity * i.price) as total_value,
        AVG(inv.quantity) as avg_quantity
       FROM inventory inv
       JOIN items i ON inv.item_id = i.id
       ${warehouseCondition}`,
      params
    );

    const [lowStockItems] = await db.execute(
      `SELECT COUNT(*) as low_stock_count
       FROM inventory inv
       ${warehouseCondition}
       ${warehouseCondition ? 'AND' : 'WHERE'} inv.quantity <= 10`,
      params
    );

    const [outOfStockItems] = await db.execute(
      `SELECT COUNT(*) as out_of_stock_count
       FROM inventory inv
       ${warehouseCondition}
       ${warehouseCondition ? 'AND' : 'WHERE'} inv.quantity = 0`,
      params
    );

    const [topItems] = await db.execute(
      `SELECT 
        i.name as item_name,
        SUM(inv.quantity) as total_quantity,
        SUM(inv.quantity * i.price) as total_value
       FROM inventory inv
       JOIN items i ON inv.item_id = i.id
       ${warehouseCondition}
       GROUP BY inv.item_id, i.name
       ORDER BY total_quantity DESC
       LIMIT 5`,
      params
    );

    return {
      ...totalStats[0],
      lowStockCount: lowStockItems[0].low_stock_count,
      outOfStockCount: outOfStockItems[0].out_of_stock_count,
      topItems: topItems
    };
  }

  // Get warehouse summary
  static async getWarehouseSummary() {
    const [rows] = await db.execute(
      `SELECT 
        w.id,
        w.name,
        w.address,
        w.status,
        COUNT(DISTINCT inv.item_id) as item_count,
        COALESCE(SUM(inv.quantity), 0) as total_quantity,
        COALESCE(SUM(inv.quantity * i.price), 0) as total_value,
        COUNT(CASE WHEN inv.quantity <= 10 THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN inv.quantity = 0 THEN 1 END) as out_of_stock_items
       FROM warehouses w
       LEFT JOIN inventory inv ON w.id = inv.warehouse_id
       LEFT JOIN items i ON inv.item_id = i.id
       WHERE w.status = 'active'
       GROUP BY w.id, w.name, w.address, w.status
       ORDER BY w.name`
    );
    return rows;
  }

  // Get low stock items
  static async getLowStockItems(threshold = 10, warehouseId = null) {
    let warehouseCondition = '';
    let params = [threshold];
    
    if (warehouseId) {
      warehouseCondition = 'AND inv.warehouse_id = ?';
      params.push(warehouseId);
    }

    const [rows] = await db.execute(
      `SELECT 
        inv.id,
        inv.warehouse_id,
        inv.item_id,
        inv.quantity,
        w.name as warehouse_name,
        i.name as item_name,
        i.price as item_price
       FROM inventory inv
       JOIN warehouses w ON inv.warehouse_id = w.id
       JOIN items i ON inv.item_id = i.id
       WHERE inv.quantity <= ? ${warehouseCondition}
       AND w.status = 'active'
       AND i.status = 'active'
       ORDER BY inv.quantity ASC, i.name`,
      params
    );
    return rows;
  }

  // Get items without inventory in specific warehouse
  static async getItemsWithoutInventory(warehouseId) {
    const [rows] = await db.execute(
      `SELECT 
        i.id,
        i.name,
        i.price,
        i.status
       FROM items i
       WHERE i.status = 'active'
       AND i.id NOT IN (
         SELECT DISTINCT item_id 
         FROM inventory 
         WHERE warehouse_id = ? AND quantity > 0
       )
       ORDER BY i.name`,
      [warehouseId]
    );
    return rows;
  }

  // Delete inventory record
  static async deleteInventory(warehouseId, itemId) {
    const [result] = await db.execute(
      `DELETE FROM inventory WHERE warehouse_id = ? AND item_id = ?`,
      [warehouseId, itemId]
    );
    return result.affectedRows;
  }

  // Get inventory movement history (would require a separate table for tracking)
  static async getInventoryHistory(warehouseId, itemId, days = 30) {
    // This would require implementing an inventory_movements table
    // For now, return current inventory as history
    const inventory = await InventoryModel.getSpecificInventory(warehouseId, itemId);
    if (!inventory) return [];

    return [{
      warehouse_id: warehouseId,
      item_id: itemId,
      type: 'current',
      quantity: inventory.quantity,
      created_at: inventory.updated_at
    }];
  }

  // Check if item has sufficient quantity for order
  static async checkAvailability(warehouseId, itemId, requiredQuantity) {
    const [rows] = await db.execute(
      `SELECT quantity FROM inventory WHERE warehouse_id = ? AND item_id = ?`,
      [warehouseId, itemId]
    );

    if (rows.length === 0) {
      return { available: false, currentQuantity: 0 };
    }

    return {
      available: rows[0].quantity >= requiredQuantity,
      currentQuantity: rows[0].quantity
    };
  }
}

module.exports = InventoryModel;