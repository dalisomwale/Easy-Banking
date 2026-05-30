-- Create database
CREATE DATABASE IF NOT EXISTS easy_banking;
USE easy_banking;

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fullname VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    nrc VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    join_date DATE NOT NULL,
    photo VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_nrc (nrc),
    INDEX idx_status (status)
);

-- Savings table
CREATE TABLE IF NOT EXISTS savings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash', 'mobile_money', 'bank') DEFAULT 'cash',
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    INDEX idx_member_date (member_id, date),
    INDEX idx_date (date)
);

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    duration_months INT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status ENUM('active', 'paid', 'defaulted') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    INDEX idx_status_due (status, due_date),
    INDEX idx_member_status (member_id, status)
);

-- Repayments table
CREATE TABLE IF NOT EXISTS repayments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    loan_id INT NOT NULL,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('cash', 'mobile_money', 'bank') DEFAULT 'cash',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    INDEX idx_loan_payment (loan_id, payment_date)
);

-- Create views for easier reporting
CREATE VIEW v_member_summary AS
SELECT 
    m.id,
    m.fullname,
    m.phone,
    m.nrc,
    m.status,
    COALESCE(SUM(s.amount), 0) as total_savings,
    COUNT(DISTINCT l.id) as total_loans,
    SUM(CASE WHEN l.status = 'active' THEN l.amount ELSE 0 END) as active_loan_amount
FROM members m
LEFT JOIN savings s ON m.id = s.member_id
LEFT JOIN loans l ON m.id = l.member_id
GROUP BY m.id;

-- Insert default admin (password: admin123)
-- Run this after creating the database
-- INSERT INTO admins (name, email, password) VALUES ('System Admin', 'admin@easybanking.com', '$2a$10$rQdJqJqJqJqJqJqJqJqJqu');