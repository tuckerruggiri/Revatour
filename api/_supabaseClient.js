// api/_supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// These are set in Vercel → Project Settings → Environment Variables
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

// This client has full DB access. ONLY import this on the server, never ship it to the browser.
export const supabaseAdmin = createClient(supabaseUrl, serviceKey);
