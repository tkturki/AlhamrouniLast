-- Enable Realtime for all tables
-- Run this in Supabase SQL Editor AFTER the migration.sql

-- Enable Realtime on jewelry_items
ALTER PUBLICATION supabase_realtime ADD TABLE jewelry_items;

-- Enable Realtime on sale_invoices
ALTER PUBLICATION supabase_realtime ADD TABLE sale_invoices;

-- Enable Realtime on system_settings
ALTER PUBLICATION supabase_realtime ADD TABLE system_settings;

-- Enable Realtime on users
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Enable Realtime on gallery_images
ALTER PUBLICATION supabase_realtime ADD TABLE gallery_images;

-- Enable Realtime on activity_logs
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
