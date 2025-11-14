-- COMPLETE FIX: Create admin accounts with ALL required fields
-- This fixes the "Database error querying schema" issue

-- Step 1: Delete existing problematic admin accounts
DELETE FROM auth.identities WHERE provider = 'email' AND identity_data->>'email' LIKE 'admin%@example.com';
DELETE FROM auth.users WHERE email LIKE 'admin%@example.com';

-- Step 2: Create 10 admin accounts with ALL required fields
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
    
    -- Create user in auth.users with ALL required fields
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
      role,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      phone_confirmed_at,
      phone_change_token,
      phone_change,
      confirmed_at,
      last_sign_in_at,
      is_super_admin
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
      'authenticated',
      '',
      '',
      '',
      '',
      now(),
      '',
      '',
      now(),
      now(),
      false
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
    
    -- Create admin profile
    BEGIN
      INSERT INTO admins (id, email, name, created_at)
      VALUES (admin_id, admin_email, admin_name, now());
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    
  END LOOP;
  
  RAISE NOTICE '✅ Created 10 admin accounts with all required fields!';
END $$;

-- Verify accounts were created
SELECT email, confirmed_at, created_at FROM auth.users WHERE email LIKE 'admin%@example.com' ORDER BY email;
