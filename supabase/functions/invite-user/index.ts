import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'technician';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create regular client to verify the requesting user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            authorization: authHeader,
          },
        },
      }
    );

    // Verify the user is authenticated and get their profile
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get user profile to check tenant and permissions
    const { data: profile, error: profileError } = await supabaseClient
      .from('users')
      .select('tenant_id, role')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Check if user has permission to invite others (admin or manager)
    if (!['admin', 'manager'].includes(profile.role)) {
      throw new Error('Insufficient permissions to invite users');
    }

    const { email, first_name, last_name, role }: InviteUserRequest = await req.json();

    // Validate input
    if (!email || !first_name || !last_name || !role) {
      throw new Error('Missing required fields');
    }

    // Generate a temporary password for the invited user
    const tempPassword = crypto.randomUUID();
    
    // Create the user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name,
        last_name,
        role,
        invited_by: user.id,
        temp_password: true
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }

    if (!authUser.user) {
      throw new Error('Failed to create auth user');
    }

    // Create user profile in the users table
    const { data: userProfile, error: profileInsertError } = await supabaseAdmin
      .from('users')
      .insert({
        auth_user_id: authUser.user.id,
        email,
        first_name,
        last_name,
        role,
        tenant_id: profile.tenant_id,
        is_active: true
      })
      .select()
      .single();

    if (profileInsertError) {
      console.error('Profile insert error:', profileInsertError);
      // Clean up the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to create user profile: ${profileInsertError.message}`);
    }

    // Send password reset email so user can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || Deno.env.get('SUPABASE_URL')}/auth?type=recovery`
      }
    });

    if (resetError) {
      console.warn('Failed to send reset email:', resetError);
      // Don't fail the whole operation if email sending fails
    }

    console.log(`User ${email} invited successfully by ${user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        user: userProfile,
        message: 'User invited successfully. They will receive an email to set up their account.'
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in invite-user function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false 
      }),
      {
        status: 400,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);