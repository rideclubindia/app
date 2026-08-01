-- 1. Enable insert for anyone (anonymous users on the website)
DROP POLICY IF EXISTS "Enable insert for anyone" ON "public"."website_subscribers";
CREATE POLICY "Enable insert for anyone" ON "public"."website_subscribers" FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable insert for anyone" ON "public"."contact_messages";
CREATE POLICY "Enable insert for anyone" ON "public"."contact_messages" FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 2. Enable read access for authenticated users (your Admin account on the dashboard)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."website_subscribers";
CREATE POLICY "Enable read access for authenticated users" ON "public"."website_subscribers" FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."contact_messages";
CREATE POLICY "Enable read access for authenticated users" ON "public"."contact_messages" FOR SELECT TO authenticated USING (true);

-- 3. Enable update/delete access for authenticated users (so you can manage them in Admin panel)
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."website_subscribers";
CREATE POLICY "Enable update for authenticated users" ON "public"."website_subscribers" FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "public"."website_subscribers";
CREATE POLICY "Enable delete for authenticated users" ON "public"."website_subscribers" FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."contact_messages";
CREATE POLICY "Enable update for authenticated users" ON "public"."contact_messages" FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "public"."contact_messages";
CREATE POLICY "Enable delete for authenticated users" ON "public"."contact_messages" FOR DELETE TO authenticated USING (true);
