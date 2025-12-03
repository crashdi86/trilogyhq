require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !anonKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, anonKey)

const users = [
  {
    email: 'chowdhury.rashdi@trilogy.com',
    password: 'trilogy26',
  },
  {
    email: 'omar.ortiz@trilogy.com',
    password: 'trilogy26',
  },
]

async function createUsers() {
  for (const user of users) {
    console.log(`\nCreating user with email: ${user.email}`)

    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
    })

    if (error) {
      console.error(`Error creating user ${user.email}:`, error.message)
      
      // If user already exists, try to sign in to verify
      if (error.message.includes('already registered')) {
        console.log(`User ${user.email} already exists. Attempting to sign in...`)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: user.password,
        })
        
        if (signInError) {
          console.error(`Sign in error for ${user.email}:`, signInError.message)
        } else {
          console.log(`✅ User ${user.email} exists and password is correct!`)
          console.log(`   User ID: ${signInData.user.id}`)
        }
      }
      continue
    }

    if (data.user) {
      console.log(`✅ User ${user.email} created successfully!`)
      console.log(`   User ID: ${data.user.id}`)
      console.log(`   Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`)
    }
  }

  console.log('\n✅ User creation process completed!')
  console.log('\nNote: If emails are not confirmed, you can manually confirm them in Supabase Dashboard:')
  console.log('   Authentication → Users → Select user → Confirm email')
  console.log('\nOr run this SQL in Supabase SQL Editor:')
  console.log('   UPDATE auth.users SET email_confirmed_at = NOW() WHERE email IN (\'chowdhury.rashdi@trilogy.com\', \'omar.ortiz@trilogy.com\');')
}

createUsers()
  .then(() => {
    console.log('\nScript completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script error:', error)
    process.exit(1)
  })

