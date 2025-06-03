const db = require('../config/db');

class ItemModel {
  // Get all items
  static async getAllItems(filters = {}) {
    let query = `SELECT * FROM items`;
    let params = [];
    let conditions = [];

    if (filters.status) {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.search) {
      conditions.push('name LIKE ?');
      params.push(`%${filters.search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await db.execute(query, params);
    return rows;
  }

  // Get item by ID
  static async getItemById(id) {
    const [rows] = await db.execute(
      `SELECT * FROM items WHERE id = ?`,
      [id]
    );
    return rows[0];
  }

  // Create item
  static async createItem(itemData) {
    const { name, price } = itemData;
    const [result] = await db.execute(
      `INSERT INTO items (name, price) VALUES (?, ?)`,
      [name, price]
    );
    return result.insertId;
  }

  // Update item
  static async updateItem(id, itemData) {
    const { name, price } = itemData;
    const [result] = await db.execute(
      `UPDATE items SET name = ?, price = ? WHERE id = ?`,
      [name, price, id]
    );
    return result.affectedRows;
  }

  // Update item status
  static async updateItemStatus(id, status) {
    const [result] = await db.execute(
      `UPDATE items SET status = ? WHERE id = ?`,
      [status, id]
    );
    return result.affectedRows;
  }

  // Delete item
  static async deleteItem(id) {
    // Check if item is being used in orders or inventory
    const [orderCheck] = await db.execute(
      `SELECT COUNT(*) as count FROM order_items WHERE item_id = ?`,
      [id]
    );

    const [inventoryCheck] = await db.execute(
      `SELECT COUNT(*) as count FROM inventory WHERE item_id = ? AND quantity > 0`,
      [id]
    );

    if (orderCheck[0].count > 0 || inventoryCheck[0].count > 0) {
      throw new Error('Cannot delete item. It is being used in orders or has inventory.');
    }

    const [result] = await db.execute(
      `DELETE FROM items WHERE id = ?`,
      [id]
    );
    return result.affectedRows;
  }

  // Check if item name exists
  static async checkItemName(name, excludeId = null) {
    let query = `SELECT id FROM items WHERE name = ?`;
    let params = [name];
    
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    
    const [rows] = await db.execute(query, params);
    return rows.length > 0;
  }

  // Get item statistics
  static async getItemStats() {
    const [totalItems] = await db.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        AVG(price) as averagePrice,
        MIN(price) as minPrice,
        MAX(price) as maxPrice
       FROM items`
    );

    const [recentItems] = await db.execute(
      `SELECT COUNT(*) as recent FROM items WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    const [popularItems] = await db.execute(
      `SELECT i.id, i.name, i.price, COUNT(oi.item_id) as order_count
       FROM items i
       LEFT JOIN order_items oi ON i.id = oi.item_id
       GROUP BY i.id, i.name, i.price
       ORDER BY order_count DESC
       LIMIT 5`
    );

    return {
      ...totalItems[0],
      recentlyAdded: recentItems[0].recent,
      popularItems: popularItems
    };
  }

  // Get items with inventory info
  static async getItemsWithInventory() {
    const [rows] = await db.execute(
      `SELECT 
        i.id, i.name, i.price, i.status, i.created_at,
        COALESCE(SUM(inv.quantity), 0) as total_quantity,
        COUNT(DISTINCT inv.warehouse_id) as warehouse_count
       FROM items i
       LEFT JOIN inventory inv ON i.id = inv.item_id
       WHERE i.status = 'active'
       GROUP BY i.id, i.name, i.price, i.status, i.created_at
       ORDER BY i.name`
    );
    return rows;
  }

  // Bulk update prices
  static async bulkUpdatePrices(updates) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      for (const update of updates) {
        await connection.execute(
          `UPDATE items SET price = ? WHERE id = ?`,
          [update.price, update.id]
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

  // Search items with pagination
  static async searchItems(searchTerm, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    const [items] = await db.execute(
      `SELECT * FROM items 
       WHERE name LIKE ? AND status = 'active'
       ORDER BY name
       LIMIT ? OFFSET ?`,
      [`%${searchTerm}%`, limit, offset]
    );

    const [totalCount] = await db.execute(
      `SELECT COUNT(*) as total FROM items 
       WHERE name LIKE ? AND status = 'active'`,
      [`%${searchTerm}%`]
    );

    return {
      items,
      total: totalCount[0].total,
      page,
      limit,
      totalPages: Math.ceil(totalCount[0].total / limit)
    };
  }

  // Get price history (if we add price history tracking)
  static async getPriceHistory(itemId, days = 30) {
    // This would require a separate price_history table
    // For now, we'll return current price as history
    const item = await ItemModel.getItemById(itemId);
    if (!item) return [];

    return [{
      item_id: itemId,
      price: item.price,
      changed_at: item.updated_at,
      changed_by: 'system'
    }];
  }

  // Get low stock items (items with total inventory below threshold)
  static async getLowStockItems(threshold = 10) {
    const [rows] = await db.execute(
      `SELECT 
        i.id, i.name, i.price,
        COALESCE(SUM(inv.quantity), 0) as total_quantity
       FROM items i
       LEFT JOIN inventory inv ON i.id = inv.item_id
       WHERE i.status = 'active'
       GROUP BY i.id, i.name, i.price
       HAVING total_quantity < ?
       ORDER BY total_quantity ASC`,
      [threshold]
    );
    return rows;
  }

  // Get items by warehouse
  static async getItemsByWarehouse(warehouseId) {
    const [rows] = await db.execute(
      `SELECT 
        i.id, i.name, i.price, i.status,
        COALESCE(inv.quantity, 0) as quantity
       FROM items i
       LEFT JOIN inventory inv ON i.id = inv.item_id AND inv.warehouse_id = ?
       WHERE i.status = 'active'
       ORDER BY i.name`,
      [warehouseId]
    );
    return rows;
  }
}

module.exports = ItemModel;