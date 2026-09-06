const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hhygreafdvaaykkaovoq.supabase.co';
const supabaseKey = 'sb_publishable_oK20UbR4aqU6LHyA-DL6bA_b5eABPO0'; // Anon key from .env

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanBadProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', '00000000-0000-0000-0000-000000000000');
    
  console.log('Delete result:', data, error);
}

cleanBadProfile();
