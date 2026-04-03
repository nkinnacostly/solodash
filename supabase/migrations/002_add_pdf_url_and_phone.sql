-- Add pdf_url column to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add phone column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
