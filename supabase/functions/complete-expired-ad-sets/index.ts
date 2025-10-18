import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the database function to complete expired ad sets
    const { data, error } = await supabase.rpc('complete_expired_ad_sets');

    if (error) {
      console.error('Error completing expired ad sets:', error);
      throw error;
    }

    const completedCount = data && data.length > 0 ? data[0].completed_count : 0;
    const completedIds = data && data.length > 0 ? data[0].completed_ad_set_ids : [];

    console.log(`Completed ${completedCount} expired ad sets:`, completedIds);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully completed ${completedCount} expired ad sets`,
        completedCount,
        completedAdSetIds: completedIds,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in complete-expired-ad-sets function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
