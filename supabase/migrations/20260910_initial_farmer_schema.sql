-- ==============================================================================
-- KISSANSAATHI (किसान साथी) — SUPABASE INITIAL FARMER & FARM DATA SCHEMA
-- Version: 1.0.0
-- Description: Complete schema for authenticated farmer profiles, multi-farm records,
--              crop relationships, itemized expense ledgers, production & selling details,
--              farmer preferences, and private price alerts with strict Row Level Security (RLS).
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABLE DEFINITIONS
-- ==============================================================================

-- Table 1: Farmer Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT,
    phone TEXT,
    email TEXT,
    date_of_birth DATE,
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi')),
    profile_photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 2: Farms (Supports Multiple Farms per Farmer)
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_name TEXT NOT NULL,
    area NUMERIC NOT NULL CHECK (area > 0),
    area_unit TEXT NOT NULL DEFAULT 'Acre' CHECK (area_unit IN ('Acre', 'Hectare', 'Bigha')),
    state TEXT,
    district TEXT,
    village TEXT,
    pincode TEXT,
    latitude NUMERIC CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    longitude NUMERIC CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
    soil_type TEXT,
    irrigation_type TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 3: Farm Crops (Multiple Crops on One Farm)
CREATE TABLE IF NOT EXISTS public.farm_crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    variety TEXT,
    season TEXT,
    year INTEGER CHECK (year IS NULL OR (year >= 1990 AND year <= 2050)),
    area NUMERIC CHECK (area IS NULL OR area > 0),
    area_unit TEXT DEFAULT 'Acre',
    expected_production NUMERIC CHECK (expected_production IS NULL OR expected_production >= 0),
    production_unit TEXT DEFAULT 'Quintal',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 4: Farm Expenses (Itemized Expense Entries)
CREATE TABLE IF NOT EXISTS public.farm_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    farm_crop_id UUID REFERENCES public.farm_crops(id) ON DELETE SET NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    category TEXT NOT NULL CHECK (category IN (
        'Seeds', 'Fertilizer', 'Pesticides', 'Labour', 'Machinery',
        'Irrigation', 'Fuel', 'Transportation', 'Storage', 'Packaging', 'Other'
    )),
    description TEXT,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    quantity NUMERIC,
    unit TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 5: Farm Production & Selling Records
CREATE TABLE IF NOT EXISTS public.farm_production (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    farm_crop_id UUID REFERENCES public.farm_crops(id) ON DELETE SET NULL,
    expected_production NUMERIC CHECK (expected_production IS NULL OR expected_production >= 0),
    actual_production NUMERIC CHECK (actual_production IS NULL OR actual_production >= 0),
    production_unit TEXT DEFAULT 'Quintal',
    expected_price NUMERIC CHECK (expected_price IS NULL OR expected_price >= 0),
    actual_price NUMERIC CHECK (actual_price IS NULL OR actual_price >= 0),
    quantity_sold NUMERIC CHECK (quantity_sold IS NULL OR quantity_sold >= 0),
    selling_date DATE,
    selling_mandi TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 6: User Preferences (Language, Area Units, Notifications)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'hi')),
    area_unit TEXT DEFAULT 'Acre',
    currency_display TEXT DEFAULT 'INR',
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table 7: Price Alerts (Private Mandi Triggers)
CREATE TABLE IF NOT EXISTS public.price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    crop TEXT NOT NULL,
    state TEXT,
    district TEXT,
    mandi TEXT,
    condition_type TEXT NOT NULL CHECK (condition_type IN ('above', 'below', 'movement', 'forecast')),
    threshold_price NUMERIC CHECK (threshold_price IS NULL OR threshold_price > 0),
    threshold_pct NUMERIC CHECK (threshold_pct IS NULL OR threshold_pct > 0),
    current_price NUMERIC,
    is_active BOOLEAN DEFAULT true,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 3. INDEXING
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_farms_user_id ON public.farms(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_crops_farm_id ON public.farm_crops(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_crops_user_id ON public.farm_crops(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_expenses_user_id ON public.farm_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_expenses_farm_id ON public.farm_expenses(farm_id);
CREATE INDEX IF NOT EXISTS idx_farm_expenses_farm_crop_id ON public.farm_expenses(farm_crop_id);
CREATE INDEX IF NOT EXISTS idx_farm_production_user_id ON public.farm_production(user_id);
CREATE INDEX IF NOT EXISTS idx_farm_production_farm_id ON public.farm_production(farm_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON public.price_alerts(user_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- 4.1 Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = user_id);

-- 4.2 Farms Policies
DROP POLICY IF EXISTS "Users can view own farms" ON public.farms;
CREATE POLICY "Users can view own farms" ON public.farms
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own farms" ON public.farms;
CREATE POLICY "Users can insert own farms" ON public.farms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own farms" ON public.farms;
CREATE POLICY "Users can update own farms" ON public.farms
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own farms" ON public.farms;
CREATE POLICY "Users can delete own farms" ON public.farms
    FOR DELETE USING (auth.uid() = user_id);

-- 4.3 Farm Crops Policies
DROP POLICY IF EXISTS "Users can view own crops" ON public.farm_crops;
CREATE POLICY "Users can view own crops" ON public.farm_crops
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own crops" ON public.farm_crops;
CREATE POLICY "Users can insert own crops" ON public.farm_crops
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own crops" ON public.farm_crops;
CREATE POLICY "Users can update own crops" ON public.farm_crops
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own crops" ON public.farm_crops;
CREATE POLICY "Users can delete own crops" ON public.farm_crops
    FOR DELETE USING (auth.uid() = user_id);

-- 4.4 Farm Expenses Policies
DROP POLICY IF EXISTS "Users can view own expenses" ON public.farm_expenses;
CREATE POLICY "Users can view own expenses" ON public.farm_expenses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own expenses" ON public.farm_expenses;
CREATE POLICY "Users can insert own expenses" ON public.farm_expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own expenses" ON public.farm_expenses;
CREATE POLICY "Users can update own expenses" ON public.farm_expenses
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own expenses" ON public.farm_expenses;
CREATE POLICY "Users can delete own expenses" ON public.farm_expenses
    FOR DELETE USING (auth.uid() = user_id);

-- 4.5 Farm Production Policies
DROP POLICY IF EXISTS "Users can view own production" ON public.farm_production;
CREATE POLICY "Users can view own production" ON public.farm_production
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own production" ON public.farm_production;
CREATE POLICY "Users can insert own production" ON public.farm_production
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own production" ON public.farm_production;
CREATE POLICY "Users can update own production" ON public.farm_production
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own production" ON public.farm_production;
CREATE POLICY "Users can delete own production" ON public.farm_production
    FOR DELETE USING (auth.uid() = user_id);

-- 4.6 User Preferences Policies
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
CREATE POLICY "Users can view own preferences" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
CREATE POLICY "Users can update own preferences" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own preferences" ON public.user_preferences;
CREATE POLICY "Users can delete own preferences" ON public.user_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- 4.7 Price Alerts Policies
DROP POLICY IF EXISTS "Users can view own price alerts" ON public.price_alerts;
CREATE POLICY "Users can view own price alerts" ON public.price_alerts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own price alerts" ON public.price_alerts;
CREATE POLICY "Users can insert own price alerts" ON public.price_alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own price alerts" ON public.price_alerts;
CREATE POLICY "Users can update own price alerts" ON public.price_alerts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own price alerts" ON public.price_alerts;
CREATE POLICY "Users can delete own price alerts" ON public.price_alerts
    FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. AUTOMATED USER PROVISIONING TRIGGER
-- ==============================================================================

-- Trigger Function: Creates default profile & preferences when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_full_name TEXT;
    v_phone TEXT;
    v_lang TEXT;
BEGIN
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    v_phone := new.raw_user_meta_data->>'phone';
    v_lang := COALESCE(new.raw_user_meta_data->>'preferred_language', 'en');

    -- 1. Insert Profile
    INSERT INTO public.profiles (user_id, full_name, phone, email, preferred_language)
    VALUES (new.id, v_full_name, v_phone, new.email, v_lang)
    ON CONFLICT (user_id) DO NOTHING;

    -- 2. Insert Preferences
    INSERT INTO public.user_preferences (user_id, language, area_unit, notifications_enabled)
    VALUES (new.id, v_lang, 'Acre', true)
    ON CONFLICT (user_id) DO NOTHING;

    -- 3. Insert Initial Default Farm Workspace
    INSERT INTO public.farms (user_id, farm_name, area, area_unit, state, district, is_primary)
    VALUES (new.id, 'My Farm (खेत 1)', 2.0, 'Acre', 'Uttar Pradesh', 'Agra', true);

    RETURN NEW;
END;
$$;

-- Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_farms_updated_at ON public.farms;
CREATE TRIGGER set_farms_updated_at BEFORE UPDATE ON public.farms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_farm_crops_updated_at ON public.farm_crops;
CREATE TRIGGER set_farm_crops_updated_at BEFORE UPDATE ON public.farm_crops FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_farm_expenses_updated_at ON public.farm_expenses;
CREATE TRIGGER set_farm_expenses_updated_at BEFORE UPDATE ON public.farm_expenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_farm_production_updated_at ON public.farm_production;
CREATE TRIGGER set_farm_production_updated_at BEFORE UPDATE ON public.farm_production FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER set_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_price_alerts_updated_at ON public.price_alerts;
CREATE TRIGGER set_price_alerts_updated_at BEFORE UPDATE ON public.price_alerts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
