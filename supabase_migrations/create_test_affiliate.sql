-- ============================================
-- Create Test Affiliate
-- Purpose: Quick setup for testing affiliate dashboard
-- Safe: Only inserts test data, no structure changes
-- ============================================

-- Step 1: Get or create a test user
-- Replace 'test@example.com' with your actual email

DO $$
DECLARE
  v_user_id UUID;
  v_affiliate_id UUID;
BEGIN
  -- Get user ID (replace with your actual email)
  SELECT id INTO v_user_id
  FROM user_profiles
  WHERE email = 'test@example.com' -- CHANGE THIS!
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User not found. Please use an existing user email.';
    RETURN;
  END IF;

  -- Step 2: Update user profile to be affiliate
  UPDATE user_profiles
  SET is_affiliate = true
  WHERE id = v_user_id;

  RAISE NOTICE 'Updated user profile: is_affiliate = true';

  -- Step 3: Create or update affiliate record
  INSERT INTO affiliates (
    user_id,
    code,
    discount_percentage,
    total_earnings,
    paid_earnings,
    pending_earnings,
    is_active
  ) VALUES (
    v_user_id,
    'TEST' || SUBSTRING(v_user_id::TEXT, 1, 6), -- Unique code
    10, -- 10% discount
    0,
    0,
    0,
    true
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    is_active = true,
    updated_at = NOW()
  RETURNING id INTO v_affiliate_id;

  RAISE NOTICE 'Created/Updated affiliate with ID: %', v_affiliate_id;

  -- Step 4: Add sample transactions
  INSERT INTO affiliate_transactions (
    affiliate_id,
    transaction_type,
    amount,
    description_ar,
    description_en,
    status,
    reference_type
  ) VALUES 
    -- Earning 1
    (
      v_affiliate_id,
      'earning',
      500.00,
      'عمولة اشتراك جديد - الباقة الذهبية',
      'Commission for new subscription - Gold Package',
      'completed',
      'subscription'
    ),
    -- Earning 2
    (
      v_affiliate_id,
      'earning',
      300.00,
      'عمولة تجديد اشتراك - الباقة الفضية',
      'Commission for subscription renewal - Silver Package',
      'completed',
      'subscription'
    ),
    -- Earning 3
    (
      v_affiliate_id,
      'earning',
      400.00,
      'عمولة اشتراك جديد - الباقة البرونزية',
      'Commission for new subscription - Bronze Package',
      'completed',
      'subscription'
    ),
    -- Bonus
    (
      v_affiliate_id,
      'bonus',
      200.00,
      'مكافأة شهر يناير 2026',
      'January 2026 Bonus',
      'completed',
      'bonus'
    ),
    -- Pending Withdrawal
    (
      v_affiliate_id,
      'withdrawal',
      -600.00,
      'طلب سحب 600 جنيه',
      'Withdrawal request 600 EGP',
      'pending',
      'withdrawal'
    ),
    -- Completed Withdrawal
    (
      v_affiliate_id,
      'withdrawal',
      -500.00,
      'سحب 500 جنيه - تم التحويل',
      'Withdrawal 500 EGP - Transferred',
      'completed',
      'withdrawal'
    );

  RAISE NOTICE 'Added 6 sample transactions';

  -- Step 5: Show results
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TEST AFFILIATE CREATED SUCCESSFULLY!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Affiliate ID: %', v_affiliate_id;
  
  -- Get affiliate code
  DECLARE
    v_code TEXT;
    v_balance DECIMAL(10,2);
  BEGIN
    SELECT code INTO v_code FROM affiliates WHERE id = v_affiliate_id;
    SELECT get_affiliate_balance(v_affiliate_id) INTO v_balance;
    
    RAISE NOTICE 'Affiliate Code: %', v_code;
    RAISE NOTICE 'Current Balance: % EGP', v_balance;
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Now login and visit: /dashboard/affiliate';
    RAISE NOTICE '============================================';
  END;

END $$;

-- Verify the data
SELECT 
  'Affiliate Record' as info,
  id,
  code,
  discount_percentage || '%' as discount,
  is_active
FROM affiliates
WHERE user_id = (SELECT id FROM user_profiles WHERE email = 'test@example.com' LIMIT 1);

SELECT 
  'Transactions' as info,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
FROM affiliate_transactions
WHERE affiliate_id = (
  SELECT id FROM affiliates 
  WHERE user_id = (SELECT id FROM user_profiles WHERE email = 'test@example.com' LIMIT 1)
);

SELECT 
  'Balance' as info,
  get_affiliate_balance(
    (SELECT id FROM affiliates WHERE user_id = (SELECT id FROM user_profiles WHERE email = 'test@example.com' LIMIT 1))
  ) || ' EGP' as available_balance;
