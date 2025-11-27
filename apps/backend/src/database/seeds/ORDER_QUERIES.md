# Database Queries for Orders

This document contains SQL queries to check and manage orders in the database, particularly for finding orders with missing items.

## Finding Order by Numeric ID (e.g., Order #2443)

### Query 1: Find order by numeric ID
```sql
-- This query finds orders by calculating the numeric ID from UUID
SELECT 
  id,
  external_ref,
  status,
  items,
  jsonb_array_length(COALESCE(items, '[]'::jsonb)) as items_count,
  customer_name,
  customer_phone,
  created_at
FROM orders
WHERE ABS(
  (
    SELECT SUM(ASCII(SUBSTRING(id, i, 1)))
    FROM generate_series(1, LENGTH(id)) AS i
  ) % 1000000
) = 2443;
```

### Query 2: Find order by external reference
```sql
-- If the order has an external_ref containing 2443
SELECT 
  id,
  external_ref,
  status,
  items,
  jsonb_array_length(COALESCE(items, '[]'::jsonb)) as items_count,
  customer_name,
  customer_phone,
  created_at
FROM orders
WHERE external_ref LIKE '%2443%';
```

### Query 3: Get order details with formatted items
```sql
-- Get order with nicely formatted items
SELECT 
  id,
  external_ref,
  status,
  jsonb_pretty(items) as items_formatted,
  jsonb_array_length(COALESCE(items, '[]'::jsonb)) as items_count,
  customer_name,
  customer_phone,
  payment_type,
  delivery_charge,
  created_at
FROM orders
WHERE ABS(
  (
    SELECT SUM(ASCII(SUBSTRING(id, i, 1)))
    FROM generate_series(1, LENGTH(id)) AS i
  ) % 1000000
) = 2443;
```

## Finding Orders with Missing Items

### Query 4: Check all orders with missing items
```sql
-- Find all orders with null or empty items
SELECT 
  id,
  external_ref,
  status,
  items,
  CASE 
    WHEN items IS NULL THEN 'NULL'
    WHEN jsonb_array_length(items) = 0 THEN 'EMPTY'
    ELSE 'HAS_ITEMS'
  END as items_status,
  customer_name,
  customer_phone,
  created_at
FROM orders
WHERE items IS NULL 
   OR jsonb_array_length(COALESCE(items, '[]'::jsonb)) = 0
ORDER BY created_at DESC;
```

### Query 5: Count orders by items status
```sql
-- Count how many orders have missing items
SELECT 
  CASE 
    WHEN items IS NULL THEN 'NULL'
    WHEN jsonb_array_length(COALESCE(items, '[]'::jsonb)) = 0 THEN 'EMPTY'
    ELSE 'HAS_ITEMS'
  END as items_status,
  COUNT(*) as count
FROM orders
GROUP BY items_status
ORDER BY count DESC;
```

## Updating Orders

### Query 6: Update a specific order with items (use with caution!)
```sql
-- Update order #2443 with sample items
UPDATE orders
SET items = '[
  {
    "name": "Sample Item",
    "quantity": 1,
    "price": 100,
    "foodId": null,
    "description": "Sample item added via fix script"
  }
]'::jsonb
WHERE ABS(
  (
    SELECT SUM(ASCII(SUBSTRING(id, i, 1)))
    FROM generate_series(1, LENGTH(id)) AS i
  ) % 1000000
) = 2443
AND (items IS NULL OR jsonb_array_length(COALESCE(items, '[]'::jsonb)) = 0)
RETURNING id, external_ref, status, items;
```

### Query 7: Update all orders with missing items (use with extreme caution!)
```sql
-- This will update ALL orders with missing items - use only if you're sure!
UPDATE orders
SET items = '[
  {
    "name": "Default Item",
    "quantity": 1,
    "price": 100,
    "foodId": null,
    "description": "Default item added via fix script"
  }
]'::jsonb
WHERE items IS NULL 
   OR jsonb_array_length(COALESCE(items, '[]'::jsonb)) = 0
RETURNING id, external_ref, status, items;
```

## Useful Helper Queries

### Query 8: Get order with all related information
```sql
-- Get comprehensive order information
SELECT 
  o.id,
  o.external_ref,
  o.status,
  o.payment_type,
  o.order_type,
  o.delivery_charge,
  o.items,
  jsonb_array_length(COALESCE(o.items, '[]'::jsonb)) as items_count,
  o.customer_name,
  o.customer_phone,
  o.customer_email,
  o.pickup->>'address' as pickup_address,
  o.dropoff->>'address' as dropoff_address,
  o.driver_id,
  d.name as driver_name,
  d.phone as driver_phone,
  o.created_at,
  o.assigned_at,
  o.delivered_at
FROM orders o
LEFT JOIN drivers d ON o.driver_id = d.id
WHERE ABS(
  (
    SELECT SUM(ASCII(SUBSTRING(o.id, i, 1)))
    FROM generate_series(1, LENGTH(o.id)) AS i
  ) % 1000000
) = 2443;
```

### Query 9: Calculate numeric ID from UUID
```sql
-- Helper function to calculate numeric ID from any UUID
SELECT 
  id,
  ABS(
    (
      SELECT SUM(ASCII(SUBSTRING(id, i, 1)))
      FROM generate_series(1, LENGTH(id)) AS i
    ) % 1000000
  ) as numeric_id
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

## Notes

- The numeric ID is calculated by summing ASCII values of all characters in the UUID and taking modulo 1000000
- Always use `COALESCE(items, '[]'::jsonb)` when checking array length to handle NULL values
- Use `jsonb_pretty()` to format JSONB fields for better readability
- Always test UPDATE queries on a single record first before running on multiple records
- Consider backing up your database before running UPDATE queries

## Using the Fix Script

Instead of manually updating orders, you can use the automated fix script:

```bash
cd apps/backend
npm run fix-orders-items
```

This script will:
- Find all orders with missing or empty items
- Assign random sample items to fix them
- Show a summary of what was fixed
- Display sample of fixed orders

