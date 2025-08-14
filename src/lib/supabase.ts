import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  name: string
  email?: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChoreTemplate {
  id: string
  name: string
  weeks_between: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ChoreAssignment {
  id: string
  chore_template_id: string
  user_id: string
  rotation_order: number
  created_at: string
}

export interface ChoreCompletion {
  id: string
  chore_template_id: string
  assigned_user_id: string
  completed_by_user_id?: string
  week_start_date: string
  completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

// Helper function to get Monday of current week
export function getWeekStart(date: Date = new Date()): Date {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(date)
  monday.setDate(diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

// Format date for database (YYYY-MM-DD)
export function formatDateForDB(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Database service functions
export const db = {
  // Users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Chore Templates
  async getChoreTemplates(): Promise<ChoreTemplate[]> {
    const { data, error } = await supabase
      .from('chore_templates')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async createChoreTemplate(name: string, weeksBetween: number = 1): Promise<ChoreTemplate> {
    const { data, error } = await supabase
      .from('chore_templates')
      .insert({ name, weeks_between: weeksBetween })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteChoreTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('chore_templates')
      .update({ is_active: false })
      .eq('id', id)
    
    if (error) throw error
  },

  // Chore Assignments
  async getChoreAssignments(choreId?: string): Promise<ChoreAssignment[]> {
    let query = supabase.from('chore_assignments').select('*')
    
    if (choreId) {
      query = query.eq('chore_template_id', choreId)
    }
    
    const { data, error } = await query.order('rotation_order')
    if (error) throw error
    return data || []
  },

  async setChoreAssignments(choreId: string, userIds: string[]): Promise<void> {
    // Delete existing assignments
    await supabase
      .from('chore_assignments')
      .delete()
      .eq('chore_template_id', choreId)
    
    // Create new assignments
    if (userIds.length > 0) {
      const assignments = userIds.map((userId, index) => ({
        chore_template_id: choreId,
        user_id: userId,
        rotation_order: index + 1
      }))
      
      const { error } = await supabase
        .from('chore_assignments')
        .insert(assignments)
      
      if (error) throw error
    }
  },

  // Chore Completions
  async getChoreCompletions(weekStart: Date): Promise<ChoreCompletion[]> {
    const { data, error } = await supabase
      .from('chore_completions')
      .select('*')
      .eq('week_start_date', formatDateForDB(weekStart))
    
    if (error) throw error
    return data || []
  },

  async toggleChoreCompletion(
    choreId: string, 
    weekStart: Date, 
    assignedUserId: string,
    completedByUserId?: string
  ): Promise<ChoreCompletion> {
    const weekStartStr = formatDateForDB(weekStart)
    
    // Check if completion exists
    const { data: existing, error: selectError } = await supabase
      .from('chore_completions')
      .select('*')
      .eq('chore_template_id', choreId)
      .eq('week_start_date', weekStartStr)
      .maybeSingle()
    
    if (selectError) {
      throw selectError;
    }
    
    if (existing) {
      // Toggle existing completion
      const { data, error } = await supabase
        .from('chore_completions')
        .update({
          completed: !existing.completed,
          completed_by_user_id: !existing.completed ? (completedByUserId || assignedUserId) : null,
          completed_at: !existing.completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
      
      if (error) throw error;
      return data
    } else {
      // Create new completion
      const { data, error } = await supabase
        .from('chore_completions')
        .insert({
          chore_template_id: choreId,
          assigned_user_id: assignedUserId,
          completed_by_user_id: completedByUserId || assignedUserId,
          week_start_date: weekStartStr,
          completed: true,
          completed_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error;
      return data
    }
  }
}