import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    profile: null,
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    hasProfile: (state) => !!state.profile
  },

  actions: {
    // Initialize auth state
    async initializeAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (session?.user && !error) {
          this.user = session.user
          await this.loadProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      }
    },

    // Load user profile from custom users table
    async loadProfile(userId) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('uuid_id', userId)
          .single()

        if (error) {
            
            if (error.code === 'PGRST116') {
                this.profile = null
                return
            }
            console.error('Error loading profile:', error)
            return
        }

        this.profile = data
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    },

    async resetPassword(email) {
      this.loading = true
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/UpdatePassword',
        })
    
        if (error) throw error
        return { success: true }
      } catch (error) {
        // Rate limit error is common here (429)
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    // --- NEW: Helper to check username before attempting signup ---
    async checkUsernameTaken(username) {
      try {
          // We use .rpc() instead of .from().select()
          const { data, error } = await supabase.rpc('check_username_available', {
              username_input: username
          });
  
          if (error) {
              console.error("RPC Error:", error);
              return false;
          }
  
          // The function returns TRUE if it exists (is taken)
          return data; 
      } catch (err) {
          console.error("Unexpected error:", err);
          return false;
      }
  },

    // Sign up
    async checkEmailTaken(email) {
      // This relies on the new 'email' column we just added
      const { count } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('email', email)
      
      return count > 0
  },

  // 2. Update the signUp action
  async signUp(email, password, username) {
    this.loading = true
    try {
      // Check Username
      const isUserTaken = await this.checkUsernameTaken(username)
      if (isUserTaken) throw new Error("This username is already taken.")

      // NEW: Check Email manually
      const isEmailTaken = await this.checkEmailTaken(email)
      if (isEmailTaken) throw new Error("This email is already registered. Please sign in instead.")

      // Proceed to create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username }
        }
      })
      
      if (authError) throw authError

        // 3. Handle case where email confirmation is required
        if (authData.user && !authData.session) {
             return { success: true, message: "Check email for confirmation link" }
        }

        this.user = authData.user
        return { success: true }
      } catch (error) {
        // IMPROVEMENT: Map specific Supabase error codes to friendly messages
        let message = error.message
        if (message.includes("User already registered")) {
            message = "This email is already registered. Please sign in instead."
        }
        return { success: false, error: message }
      } finally {
        this.loading = false
      }
    },

    // Sign in
    async signIn(email, password) {
      this.loading = true
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error

        this.user = data.user
        await this.loadProfile(data.user.id)

        return { success: true }
      } catch (error) {
        return { success: false, error: "Invalid email or password." } // Generic security message
      } finally {
        this.loading = false
      }
    },

    // Sign out
    async signOut() {
      try {
        await supabase.auth.signOut()
        this.user = null
        this.profile = null
        // Optional: Clear router or redirect here if needed
      } catch (error) {
        console.error('Error signing out:', error)
      }
    },

    // Update profile
    async updateProfile(updates) {
      if (!this.user) return { success: false, error: 'Not authenticated' }

      try {
        const { data, error } = await supabase
          .from('users')
          .update(updates)
          .eq('uuid_id', this.user.id)
          .select()
          .single()

        if (error) throw error

        this.profile = data
        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },

    // Set up auth state listener
    setupAuthListener() {
      // Returns the subscription so you can unsubscribe if needed (though rare in main store)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        // console.log('Auth state changed:', event)

        this.user = session?.user ?? null

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            if (session?.user) {
                await this.loadProfile(session.user.id)
            }
        } else if (event === 'SIGNED_OUT') {
            this.profile = null
            this.user = null
        }
      })
      
      return subscription
    }
  }
})