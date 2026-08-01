-- For website_subscribers
DROP POLICY IF EXISTS "Enable insert for anyone" ON "public"."website_subscribers";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."website_subscribers";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."website_subscribers";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "public"."website_subscribers";
DROP POLICY IF EXISTS "Enable insert for anyone 2" ON "public"."website_subscribers";
DROP POLICY IF EXISTS "Enable read access for authenticated users 2" ON "public"."website_subscribers";
DROP POLICY IF EXISTS "Enable update for authenticated users 2" ON "public"."website_subscribers";
DROP POLICY IF EXISTS "Enable delete for authenticated users 2" ON "public"."website_subscribers";

CREATE POLICY "Enable insert for anyone 2" ON "public"."website_subscribers" FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Enable read access for authenticated users 2" ON "public"."website_subscribers" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Enable update for authenticated users 2" ON "public"."website_subscribers" FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users 2" ON "public"."website_subscribers" FOR DELETE TO anon, authenticated USING (true);

-- For contact_messages
DROP POLICY IF EXISTS "Enable insert for anyone" ON "public"."contact_messages";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "public"."contact_messages";
DROP POLICY IF EXISTS "Enable update for authenticated users" ON "public"."contact_messages";
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "public"."contact_messages";
DROP POLICY IF EXISTS "Enable insert for anyone 2" ON "public"."contact_messages";
DROP POLICY IF EXISTS "Enable read access for authenticated users 2" ON "public"."contact_messages";
DROP POLICY IF EXISTS "Enable update for authenticated users 2" ON "public"."contact_messages";
DROP POLICY IF EXISTS "Enable delete for authenticated users 2" ON "public"."contact_messages";

CREATE POLICY "Enable insert for anyone 2" ON "public"."contact_messages" FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Enable read access for authenticated users 2" ON "public"."contact_messages" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Enable update for authenticated users 2" ON "public"."contact_messages" FOR UPDATE TO anon, authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users 2" ON "public"."contact_messages" FOR DELETE TO anon, authenticated USING (true);
