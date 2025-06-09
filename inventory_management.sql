-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 09, 2025 at 06:05 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `inventory_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `dealers`
--

CREATE TABLE `dealers` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `agency_name` varchar(100) NOT NULL,
  `address` text NOT NULL,
  `pincode` varchar(10) NOT NULL,
  `mobile_number` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `warehouse_id` int(11) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dealers`
--

INSERT INTO `dealers` (`id`, `name`, `agency_name`, `address`, `pincode`, `mobile_number`, `password`, `warehouse_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 'John Doe', 'ABC Traders', '123 Main Street, City Name', '123456', '9876543210', '$2b$10$YourHashedPasswordHere', 1, 'active', '2025-06-02 14:33:47', '2025-06-03 03:08:30'),
(3, 'dealer2', 'ABC Traders', '123 Main St', '123456', '5552445257', '$2b$10$YourHashedPasswordHere', 3, 'active', '2025-06-04 13:27:18', '2025-06-07 15:34:28');

-- Insert test dealer with provided credentials (password: Brimesh@123)
INSERT INTO `dealers` (`name`, `agency_name`, `address`, `pincode`, `mobile_number`, `password`, `warehouse_id`, `status`) VALUES
('Test Dealer', 'Test Agency', 'Test Address', '123456', '9825738131', '$2b$10$8K1p/a0dR1xqM8K1p/a0dR1xqM8K1p/a0dR1xqM8K1p/a0dR1xqM', 1, 'active');

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`id`, `warehouse_id`, `item_id`, `quantity`, `updated_at`) VALUES
(1, 3, 3, 2000, '2025-06-04 06:38:04'),
(2, 3, 2, 2009, '2025-06-04 06:41:16'),
(3, 2, 2, 500, '2025-06-04 06:41:16'),
(4, 1, 3, 1000, '2025-06-04 18:01:17'),
(5, 1, 2, 1500, '2025-06-04 18:04:12'),
(6, 1, 1, 1000, '2025-06-07 15:35:33'),
(7, 3, 1, 200, '2025-06-07 05:28:14'),
(8, 4, 1, 300, '2025-06-07 15:35:33');

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `items`
--

INSERT INTO `items` (`id`, `name`, `price`, `status`, `created_at`, `updated_at`) VALUES
(1, 'masala 1', 200.00, 'active', '2025-06-02 18:20:17', '2025-06-02 18:20:17'),
(2, 'masala 2', 250.00, 'active', '2025-06-02 18:21:15', '2025-06-02 18:21:15'),
(3, 'masala 3', 220.00, 'active', '2025-06-02 18:21:35', '2025-06-02 18:21:35');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `order_number` varchar(20) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `dealer_id` int(11) DEFAULT NULL,
  `salesman_id` int(11) DEFAULT NULL,
  `order_type` enum('direct_dealer','salesman_for_dealer','warehouse_for_dealer') NOT NULL,
  `placed_by_role` enum('dealer','salesman','warehouse') NOT NULL,
  `placed_by_id` int(11) NOT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `transport_status` enum('pending','dispatched','delivered','cancelled') DEFAULT 'pending',
  `payment_status` enum('pending','partial','paid') DEFAULT 'pending',
  `order_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `dispatch_date` timestamp NULL DEFAULT NULL,
  `delivery_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `warehouse_id`, `dealer_id`, `salesman_id`, `order_type`, `placed_by_role`, `placed_by_id`, `total_amount`, `transport_status`, `payment_status`, `order_date`, `dispatch_date`, `delivery_date`, `created_at`, `updated_at`) VALUES
(2, 'ORD-6366906FIQ', 1, 3, NULL, 'warehouse_for_dealer', 'warehouse', 1, 110000.00, 'pending', 'pending', '2025-06-04 15:57:16', NULL, NULL, '2025-06-04 15:57:16', '2025-06-04 15:57:16'),
(3, 'ORD-068162BE0T', 1, 3, NULL, 'warehouse_for_dealer', 'warehouse', 1, 110000.00, 'pending', 'pending', '2025-06-04 18:01:08', NULL, NULL, '2025-06-04 18:01:08', '2025-06-04 18:01:08'),
(4, 'ORD-077308A3JM', 1, 3, 1, 'warehouse_for_dealer', 'warehouse', 1, 110000.00, 'pending', 'pending', '2025-06-04 18:01:17', NULL, NULL, '2025-06-04 18:01:17', '2025-06-04 18:01:17'),
(5, 'ORD-25215743SG', 1, 3, NULL, 'warehouse_for_dealer', 'warehouse', 1, 125000.00, 'pending', 'pending', '2025-06-04 18:04:12', NULL, NULL, '2025-06-04 18:04:12', '2025-06-04 18:04:12');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price_per_item` decimal(10,2) NOT NULL,
  `total_price` decimal(12,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `item_id`, `quantity`, `price_per_item`, `total_price`, `created_at`) VALUES
(2, 2, 3, 500, 220.00, 110000.00, '2025-06-04 15:57:16'),
(3, 3, 3, 500, 220.00, 110000.00, '2025-06-04 18:01:08'),
(4, 4, 3, 500, 220.00, 110000.00, '2025-06-04 18:01:17'),
(5, 5, 2, 500, 250.00, 125000.00, '2025-06-04 18:04:12');

-- --------------------------------------------------------

--
-- Table structure for table `owners`
--

CREATE TABLE `owners` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `owners`
--

INSERT INTO `owners` (`id`, `username`, `password`, `created_at`, `updated_at`) VALUES
(1, 'madmin', '$2b$10$/UT24GgtzeeWb3y27JPI9.dXoyRWiJWjDGFktZXknONoPPDQ2g5pC', '2025-05-31 05:49:18', '2025-05-31 12:26:38');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('cash','cheque','bank_transfer','upi','card','other') NOT NULL,
  `payment_status` enum('pending','paid','failed') DEFAULT 'pending',
  `transaction_id` varchar(100) DEFAULT NULL,
  `payment_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `registration_codes`
--

CREATE TABLE `registration_codes` (
  `id` int(11) NOT NULL,
  `code` varchar(8) NOT NULL,
  `role` enum('warehouse','salesman','dealer') NOT NULL,
  `warehouse_id` int(11) DEFAULT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `registration_codes`
--

INSERT INTO `registration_codes` (`id`, `code`, `role`, `warehouse_id`, `expires_at`, `is_used`, `created_at`) VALUES
(8, 'CHLHAXOV', 'dealer', NULL, '2025-06-08 05:25:35', 0, '2025-06-07 05:25:35'),
(9, 'PYE5D6AI', 'salesman', NULL, '2025-06-08 05:25:40', 0, '2025-06-07 05:25:40'),
(10, '7D7DTNGP', 'salesman', NULL, '2025-06-08 05:25:43', 0, '2025-06-07 05:25:43'),
(11, 'CFNISEFD', 'dealer', NULL, '2025-06-08 15:32:12', 0, '2025-06-07 15:32:12'),
(13, 'ZRMEQMPI', 'warehouse', NULL, '2025-06-08 15:40:19', 0, '2025-06-07 15:40:19');

-- --------------------------------------------------------

--
-- Table structure for table `return_orders`
--

CREATE TABLE `return_orders` (
  `id` int(11) NOT NULL,
  `return_number` varchar(20) NOT NULL,
  `original_order_id` int(11) DEFAULT NULL,
  `warehouse_id` int(11) NOT NULL,
  `dealer_id` int(11) DEFAULT NULL,
  `salesman_id` int(11) DEFAULT NULL,
  `item_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `return_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `returned_by_role` enum('dealer','salesman') NOT NULL,
  `returned_by_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `salesmen`
--

CREATE TABLE `salesmen` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `aadhar_number` varchar(12) NOT NULL,
  `pan_number` varchar(10) NOT NULL,
  `mobile_number` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `warehouse_id` int(11) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `salesmen`
--

INSERT INTO `salesmen` (`id`, `name`, `aadhar_number`, `pan_number`, `mobile_number`, `password`, `warehouse_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 'John Doe', '123456789012', 'ABCDE1234F', '+919876543210', '$2b$10$YourHashedPasswordHere', 3, 'active', '2025-06-02 17:21:23', '2025-06-07 05:26:47'),
(2, 'salesman2', '123456712345', 'ABCDE1245F', '+919876554781', '$2b$10$YourHashedPasswordHere', 3, 'active', '2025-06-07 15:33:53', '2025-06-07 15:34:20');

-- --------------------------------------------------------

--
-- Table structure for table `warehouses`
--

CREATE TABLE `warehouses` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `address` text NOT NULL,
  `pincode` varchar(10) NOT NULL,
  `username` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `warehouses`
--

INSERT INTO `warehouses` (`id`, `name`, `address`, `pincode`, `username`, `password`, `status`, `created_at`, `updated_at`) VALUES
(1, 'warehouse1', '101 , GIDC', '350054', 'warehouse1', '$2b$10$YcjwwxlkjWw1xo9Q8FSeVeN.APHxw.Z/yee1gtMEC0RVRKpj8Cxry', 'active', '2025-06-02 08:20:25', '2025-06-02 08:20:25'),
(2, 'warehouse2', 'city2', '398812', 'warehouse2', '$2b$10$nzZ9pZ8DtFdv/i6JRinmhe2LTT32kg9Ccou502kbgTDP4fyLjIL.O', 'active', '2025-06-02 14:31:38', '2025-06-02 14:31:38'),
(3, 'warehouse3', 'D-205 , GIDC', '255788', 'warehouse3', '$2b$10$zhFNHNNJpLVNkix4E8CjQewNKfp9Q6RAJUUrQD5z./Jn8FwpskTY.', 'active', '2025-06-04 06:03:29', '2025-06-04 06:03:29'),
(4, 'warehouse4', 'address 4', '688547', 'warehouse4', '$2b$10$LWYH/DWtDHB4Q36ifx/C0.wpKfj1ekrR9bYq.PybT2BaQ9Npm97jO', 'active', '2025-06-07 15:31:57', '2025-06-07 15:31:57');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `dealers`
--
ALTER TABLE `dealers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `mobile_number` (`mobile_number`),
  ADD KEY `warehouse_id` (`warehouse_id`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_warehouse_item` (`warehouse_id`,`item_id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `idx_inventory_warehouse_item` (`warehouse_id`,`item_id`);

--
-- Indexes for table `items`
--
ALTER TABLE `items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `idx_orders_warehouse` (`warehouse_id`),
  ADD KEY `idx_orders_dealer` (`dealer_id`),
  ADD KEY `idx_orders_salesman` (`salesman_id`),
  ADD KEY `idx_orders_date` (`order_date`),
  ADD KEY `idx_orders_placed_by` (`placed_by_role`,`placed_by_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `owners`
--
ALTER TABLE `owners`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_payments_order` (`order_id`);

--
-- Indexes for table `registration_codes`
--
ALTER TABLE `registration_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `warehouse_id` (`warehouse_id`),
  ADD KEY `idx_registration_codes_expires` (`expires_at`);

--
-- Indexes for table `return_orders`
--
ALTER TABLE `return_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `return_number` (`return_number`),
  ADD KEY `original_order_id` (`original_order_id`),
  ADD KEY `warehouse_id` (`warehouse_id`),
  ADD KEY `dealer_id` (`dealer_id`),
  ADD KEY `salesman_id` (`salesman_id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `idx_returns_returned_by` (`returned_by_role`,`returned_by_id`);

--
-- Indexes for table `salesmen`
--
ALTER TABLE `salesmen`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `aadhar_number` (`aadhar_number`),
  ADD UNIQUE KEY `pan_number` (`pan_number`),
  ADD UNIQUE KEY `mobile_number` (`mobile_number`),
  ADD KEY `warehouse_id` (`warehouse_id`);

--
-- Indexes for table `warehouses`
--
ALTER TABLE `warehouses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_warehouses_username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `dealers`
--
ALTER TABLE `dealers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `items`
--
ALTER TABLE `items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `owners`
--
ALTER TABLE `owners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `registration_codes`
--
ALTER TABLE `registration_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `return_orders`
--
ALTER TABLE `return_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `salesmen`
--
ALTER TABLE `salesmen`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `warehouses`
--
ALTER TABLE `warehouses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `dealers`
--
ALTER TABLE `dealers`
  ADD CONSTRAINT `dealers_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inventory`
--
ALTER TABLE `inventory`
  ADD CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`dealer_id`) REFERENCES `dealers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`salesman_id`) REFERENCES `salesmen` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `registration_codes`
--
ALTER TABLE `registration_codes`
  ADD CONSTRAINT `registration_codes_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `return_orders`
--
ALTER TABLE `return_orders`
  ADD CONSTRAINT `return_orders_ibfk_1` FOREIGN KEY (`original_order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `return_orders_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `return_orders_ibfk_3` FOREIGN KEY (`dealer_id`) REFERENCES `dealers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `return_orders_ibfk_4` FOREIGN KEY (`salesman_id`) REFERENCES `salesmen` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `return_orders_ibfk_5` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `salesmen`
--
ALTER TABLE `salesmen`
  ADD CONSTRAINT `salesmen_ibfk_1` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
