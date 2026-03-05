import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local
const envContent = readFileSync('.env.local', 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) env[key.trim()] = rest.join('=').trim()
})

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function main() {
  // Create test user
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'vanshita@physicswallah.com',
    password: 'Test@1234',
    email_confirm: true,
    user_metadata: { full_name: 'Vanshita Kapoor' }
  })

  if (error) {
    console.error('Create user error:', error.message)
    // List existing users
    const { data: users } = await supabase.auth.admin.listUsers()
    console.log('\nExisting users:')
    users?.users?.forEach(u => console.log(`  - ${u.email} (${u.id})`))
    return
  }

  console.log('User created:', data.user.email, data.user.id)

  // Create profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    email: 'vanshita@physicswallah.com',
    full_name: 'Vanshita Kapoor',
    role: 'candidate',
    lifecycle_stage: 'onboarding',
  })

  if (profileError) {
    console.error('Profile error:', profileError.message)
  } else {
    console.log('Profile created successfully')
  }

  console.log('\n--- Login credentials ---')
  console.log('Email:    vanshita@physicswallah.com')
  console.log('Password: Test@1234')
}

main().catch(console.error)
