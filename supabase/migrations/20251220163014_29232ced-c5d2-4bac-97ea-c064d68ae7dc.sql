-- Add 'seller_upgrade' to the approval_request_type enum
ALTER TYPE public.approval_request_type ADD VALUE IF NOT EXISTS 'seller_upgrade';