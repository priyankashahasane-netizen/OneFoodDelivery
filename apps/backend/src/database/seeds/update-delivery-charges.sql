-- Update delivery charges for all orders with random values between 25 and 50
-- This script uses PostgreSQL's random() function to generate values

UPDATE orders 
SET delivery_charge = FLOOR(RANDOM() * (50 - 25 + 1) + 25)::DECIMAL(10, 2);

-- Verify the update
SELECT 
    COUNT(*) as total_orders,
    MIN(delivery_charge) as min_charge,
    MAX(delivery_charge) as max_charge,
    AVG(delivery_charge)::DECIMAL(10, 2) as avg_charge
FROM orders;

