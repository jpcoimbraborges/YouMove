-- Migration: Food Library
-- Description: Create table to store user's food library for quick reuse

-- Create food_library table
CREATE TABLE IF NOT EXISTS public.food_library (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    calories INTEGER DEFAULT 0,
    protein_g DECIMAL(10,2) DEFAULT 0,
    carbs_g DECIMAL(10,2) DEFAULT 0,
    fats_g DECIMAL(10,2) DEFAULT 0,
    serving_size TEXT, -- e.g., "100g", "1 unidade", "1 xícara"
    category TEXT, -- e.g., "proteína", "carboidrato", "fruta", "vegetal"
    is_favorite BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0, -- Track how often it's used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name) -- Prevent duplicate food names per user
);

-- Create index for faster lookups
CREATE INDEX idx_food_library_user_id ON public.food_library(user_id);
CREATE INDEX idx_food_library_name ON public.food_library(name);
CREATE INDEX idx_food_library_usage ON public.food_library(usage_count DESC);

-- Enable RLS
ALTER TABLE public.food_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own food library"
    ON public.food_library
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own food library"
    ON public.food_library
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food library"
    ON public.food_library
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own food library"
    ON public.food_library
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_food_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER food_library_updated_at
    BEFORE UPDATE ON public.food_library
    FOR EACH ROW
    EXECUTE FUNCTION update_food_library_updated_at();

-- Add reference column to nutrition_logs for food library items
ALTER TABLE public.nutrition_logs 
ADD COLUMN IF NOT EXISTS food_library_id INTEGER REFERENCES public.food_library(id) ON DELETE SET NULL;

-- Function to increment food usage count
CREATE OR REPLACE FUNCTION increment_food_usage(p_user_id UUID, p_food_name TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.food_library
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id AND name = p_food_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
