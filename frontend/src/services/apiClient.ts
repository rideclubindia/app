import { supabase } from '../lib/supabase';

// ----------------------------------------------------
// Early Access Subscribers
// ----------------------------------------------------

export interface Subscriber {
  id: string;
  email: string;
  status: 'Active' | 'Unsubscribed';
  source: string;
  created_at: string;
}

export const getSubscribers = async () => {
  const { data, error } = await supabase
    .from('website_subscribers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Subscriber[];
};

export const addSubscriber = async (email: string) => {
  const { error } = await supabase
    .from('website_subscribers')
    .insert([{ email, status: 'Active', source: 'Website' }]);
  if (error) throw error;
  return true;
};

export const deleteSubscriber = async (id: string) => {
  const { error } = await supabase
    .from('website_subscribers')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ----------------------------------------------------
// Contact Messages
// ----------------------------------------------------

export interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  inquiry_type: string;
  message: string;
  status: 'New' | 'Read' | 'Replied';
  created_at: string;
}

export const getContactMessages = async () => {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ContactMessage[];
};

export const addContactMessage = async (messageData: Omit<ContactMessage, 'id' | 'status' | 'created_at'>) => {
  const { error } = await supabase
    .from('contact_messages')
    .insert([{ ...messageData, status: 'New' }]);
  if (error) throw error;
  return true;
};

export const updateContactMessageStatus = async (id: string, status: 'New' | 'Read' | 'Replied') => {
  const { error } = await supabase
    .from('contact_messages')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
};

export const deleteContactMessage = async (id: string) => {
  const { error } = await supabase
    .from('contact_messages')
    .delete()
    .eq('id', id);
  if (error) throw error;
};
