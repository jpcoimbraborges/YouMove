-- ============================================
-- YOUMOVE - Nutrition Schema
-- Migration: 002_nutrition_schema
-- Date: 2025-12-27
-- ============================================

-- ============================================
-- TABLE: nutrition_goals
-- Stores daily targets for users
-- ============================================
CREATE TABLE nutrition_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Targets
    daily_calories INTEGER NOT NULL DEFAULT 2000,
    protein_grams INTEGER NOT NULL DEFAULT 150,
    carbs_grams INTEGER NOT NULL DEFAULT 200,
    fats_grams INTEGER NOT NULL DEFAULT 60,
    water_liters DECIMAL(3,1) NOT NULL DEFAULT 2.5,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id) -- One active profile per user for now
);

-- ============================================
-- TABLE: nutrition_logs
-- Stores actual consumption (food/water)
-- ============================================
CREATE TABLE nutrition_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Time Context
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'snack', 'dinner', 'water')),
    
    -- Content
    item_name TEXT NOT NULL, -- "Banana", "Water", "Chicken Breast"
    quantity DECIMAL(8,2) DEFAULT 1,
    unit TEXT DEFAULT 'serving', -- "g", "ml", "unit", "serving"
    
    -- Macros (Snapshot per entry)
    calories INTEGER DEFAULT 0,
    protein_g DECIMAL(5,1) DEFAULT 0,
    carbs_g DECIMAL(5,1) DEFAULT 0,
    fats_g DECIMAL(5,1) DEFAULT 0,
    water_ml INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast daily querying
CREATE INDEX idx_nutrition_user_date ON nutrition_logs(user_id, log_date);

-- ============================================
-- TRIGGER: Auto-create basic goals for new users
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user_nutrition()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO nutrition_goals (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add to existing profile creation flow is manual for now, 
-- but we can run this for existing users manually if needed.
