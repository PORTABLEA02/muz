/*
  # Fix RLS policies for demands table

  1. Problem
    - Current RLS policies prevent administrators from updating demand status
    - Controllers cannot properly change status from 'en_attente' to 'acceptee'/'rejetee'
    - Administrators cannot change status from 'acceptee' to 'validee'/'rejetee'

  2. Solution
    - Drop existing restrictive policies
    - Create new policies with proper WITH CHECK clauses
    - Allow proper status transitions for each role

  3. Changes
    - Controllers can update demands from 'en_attente' to 'acceptee' or 'rejetee'
    - Administrators can update demands from 'acceptee' to 'validee' or 'rejetee'
    - Maintain security by checking user roles
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Controllers can update demand status" ON demands;
DROP POLICY IF EXISTS "Admins can validate accepted demands" ON demands;

-- Create new policy for controllers to update demand status
CREATE POLICY "Controllers can update demand status" 
ON demands FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'controleur'
    )
    AND status = 'en_attente'
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'controleur'
    )
    AND status IN ('acceptee', 'rejetee')
);

-- Create new policy for administrators to validate accepted demands
CREATE POLICY "Admins can validate accepted demands" 
ON demands FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'administrateur'
    )
    AND status = 'acceptee'
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'administrateur'
    )
    AND status IN ('validee', 'rejetee')
);

-- Also ensure administrators can update any demand if needed
CREATE POLICY "Admins can update any demand" 
ON demands FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'administrateur'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'administrateur'
    )
);