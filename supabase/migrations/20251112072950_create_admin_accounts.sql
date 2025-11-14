-- Create 10 Admin Accounts with Email/Password Auth (FIXED VERSION)
-- Run this in Supabase SQL Editor

-- First, delete existing admin accounts if they exist
DELETE FROM auth.identities WHERE provider = 'email' AND identity_data->>'email' LIKE 'admin%@example.com';
DELETE FROM auth.users WHERE email LIKE 'admin%@example.com';

-- Now create 10 new admin accounts
DO $$
DECLARE
  admin_id uuid;
  admin_email text;
  admin_name text;
  i integer;
BEGIN
  FOR i IN 1..10 LOOP
    admin_email := 'admin' || i || '@example.com';
    admin_name := 'Admin ' || i;
    
    -- Generate a UUID for the new user
    admin_id := gen_random_uuid();
    
    -- Create user in auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      admin_email,
      crypt('Admin@123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', admin_name),
      'authenticated',
      'authenticated'
    );
    
    -- Create entry in auth.identities table
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      admin_id,
      format('{"sub":"%s","email":"%s"}', admin_id::text, admin_email)::jsonb,
      'email',
      admin_id::text,
      now(),
      now(),
      now()
    );
    
    -- Create corresponding admin profile in admins table (if it exists)
    BEGIN
      INSERT INTO admins (id, email, name, created_at)
      VALUES (admin_id, admin_email, admin_name, now());
    EXCEPTION WHEN OTHERS THEN
      -- If admins table doesn't exist, just skip
      NULL;
    END;
    
  END LOOP;
  
  RAISE NOTICE '✅ Created 10 admin accounts successfully!';
END $$;

-- Verify accounts were created
SELECT email, created_at FROM auth.users WHERE email LIKE 'admin%@example.com' ORDER BY email;
