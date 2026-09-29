-- Trim vehicle_types lookup to the 4 options used in the Create Ride UI:
-- All, Bike (Motorcycle), Car, Cycle.
DELETE FROM public.vehicle_types
WHERE value NOT IN ('any', 'motorcycle', 'car', 'cycle');

INSERT INTO public.vehicle_types (value, label, display_order) VALUES
    ('any', 'All', 0),
    ('motorcycle', 'Bike', 1),
    ('car', 'Car', 2),
    ('cycle', 'Cycle', 3)
ON CONFLICT (value) DO UPDATE
SET label = EXCLUDED.label,
    display_order = EXCLUDED.display_order;
