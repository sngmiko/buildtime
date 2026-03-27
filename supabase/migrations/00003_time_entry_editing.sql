-- Phase 2b: Time entry editing by managers
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES profiles(id);
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- Managers can edit any time entry in their company
CREATE POLICY "manager_update_company_entries" ON time_entries
  FOR UPDATE USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('owner', 'foreman')
  );

-- Managers can delete time entries in their company
CREATE POLICY "manager_delete_company_entries" ON time_entries
  FOR DELETE USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('owner', 'foreman')
  );
