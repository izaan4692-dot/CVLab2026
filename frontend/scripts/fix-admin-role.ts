/**
 * Script to fix admin user role in Supabase
 * This ensures the role is set in both user_metadata and app_metadata
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixAdminRole(email: string) {
  console.log(`\n🔍 Looking for user: ${email}`);
  
  try {
    // Get user by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return;
    }

    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return;
    }

    console.log(`✅ Found user: ${user.id}`);
    console.log(`   Current user_metadata.role: ${user.user_metadata?.role || 'NOT SET'}`);
    console.log(`   Current app_metadata.role: ${user.app_metadata?.role || 'NOT SET'}`);

    // Update user with role in both metadata
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          role: 'admin',
          is_admin: true,
        },
        app_metadata: {
          ...user.app_metadata,
          role: 'admin',
        },
      }
    );

    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      return;
    }

    console.log('✅ User updated successfully!');
    console.log(`   New user_metadata.role: ${updatedUser.user.user_metadata?.role}`);
    console.log(`   New app_metadata.role: ${updatedUser.user.app_metadata?.role}`);
    
    // Verify by getting user again
    const { data: { user: verifiedUser }, error: verifyError } = await supabaseAdmin.auth.admin.getUserById(user.id);
    
    if (verifyError) {
      console.error('❌ Error verifying user:', verifyError);
      return;
    }

    console.log('\n📋 Verification:');
    if (verifiedUser) {
      console.log(`   user_metadata:`, JSON.stringify(verifiedUser.user_metadata, null, 2));
      console.log(`   app_metadata:`, JSON.stringify(verifiedUser.app_metadata, null, 2));
    } else {
      console.log('   ⚠️ User data not available for verification');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
const adminEmail = process.argv[2] || 'admin@cvlab.sa';
fixAdminRole(adminEmail).then(() => {
  console.log('\n✨ Done!');
  process.exit(0);
});

