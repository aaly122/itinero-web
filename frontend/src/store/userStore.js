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
        // userStore.js
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username
            }
          }
        })

        if (authError) throw authError
        this.user = authData.user
        // The profile will be created by a Supabase database trigger after email confirmation,
        // so we don't set this.profile here directly after sign up.
        // It will be loaded on subsequent sign-in after confirmation.

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
