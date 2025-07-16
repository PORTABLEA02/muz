import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateUserRequest {
  email: string;
  password: string;
  userData: {
    full_name: string;
    role: 'membre' | 'controleur' | 'administrateur';
    phone?: string;
    address?: string;
    service?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Vérifier que c'est une requête POST
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Récupérer le token d'autorisation
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Créer le client Supabase avec la clé service_role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Vérifier que l'utilisateur connecté est un administrateur
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Vérifier le rôle de l'utilisateur
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'administrateur') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parser les données de la requête
    const requestData: CreateUserRequest = await req.json()
    const { email, password, userData } = requestData

    // Validation des données
    if (!email || !password || !userData?.full_name || !userData?.role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Créer l'utilisateur avec l'API admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role
      }
    })

    if (authError || !authData.user) {
      console.error('Create user error:', authError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create user', 
          details: authError?.message 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Attendre que le trigger handle_new_user s'exécute
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mettre à jour le profil avec les informations supplémentaires
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        phone: userData.phone,
        address: userData.address,
        service: userData.service,
        must_change_password: true,
        is_first_login: true,
        adhesion_number: userData.role === 'membre' ? `MUS-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}` : null,
        employee_number: userData.role !== 'membre' ? `EMP-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}` : null,
        date_adhesion: userData.role === 'membre' ? new Date().toISOString().split('T')[0] : null
      })
      .eq('id', authData.user.id)

    if (updateError) {
      console.error('Update profile error:', updateError)
      // Ne pas faire échouer la création si la mise à jour du profil échoue
    }

    // Retourner les données de l'utilisateur créé
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          name: userData.full_name,
          email: email,
          role: userData.role
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})