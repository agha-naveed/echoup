import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
        const { data: profile } = await supabase
            .from('users')
            .select('username')
            .eq('id', user.id)
            .single()

        // 3. The Routing Logic
        if (!profile?.username) {
            // New user without a username -> send them to Step 2 of your form
            return NextResponse.redirect(`${origin}/account/signup?step=2`)
        } else {
            // Existing fully setup user -> send them into Echo Up!
            return NextResponse.redirect(`${origin}/post`)
        }
    }
  }

  // If something goes wrong, send them back to login
  return NextResponse.redirect(`${origin}/account`)
}