import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    profile: null,
    loading: false
  }),

  getters: {
    isAuthenticated() {
      return !!this.user
    },
    hasProfile() {
      return !!this.profile
    }
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

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error loading profile:', error)
          return
        }

        this.profile = data || null
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    },

    // Sign up - creates auth user + profile in users table
    async signUp(email, password, username) {
      this.loading = true
      try {
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password
        })

        if (authError) throw authError
        const userId = authData.user.id;

        // Create profile in users table
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .insert([{
            uuid_id: userId,
            user_name: username,
            email: email
          }])
          .select()
          .single()

        if (profileError) throw profileError

        this.user = authData.user
        this.profile = profileData

        return { success: true }
      } catch (error) {
        return { success: false, error: error.message }
      } finally {
        this.loading = false
      }
    },

    // Sign in - loads existing user
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
        return { success: false, error: error.message }
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
      } catch (error) {
        console.error('Error signing out:', error)
      }
    },

    // Update profile
    async updateProfile(updates) {
      if (!this.user || !this.profile) return { success: false, error: 'Not authenticated' }

      try {
        const { data, error } = await supabase
          .from('users')
          .update(updates)
          .eq('uui_id', this.user.id)
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
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)

        this.user = session?.user ?? null

        if (session?.user) {
          await this.loadProfile(session.user.id)
        } else {
          this.profile = null
        }
      })
    }
  }
})
