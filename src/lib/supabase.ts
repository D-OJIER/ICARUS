import { createClient } from '@supabase/supabase-js';
import { Goal, Quest } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not configured.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export interface IcarusUserData {
  id: string;
  email: string;
  display_name: string;
  preferred_name: string;
  date_of_birth: string;
  timezone: string;
  level: number;
  xp: number;
  title: string;
  avatar_seed: string;
  monument_seed: string;
  created_at: string;
  quests: Quest[];
  goals: Goal[];
  characterProfile: any;
}

const toDateOnly = (value?: string) => value ? value.split('T')[0] : null;

const questRow = (userId: string, quest: Quest) => ({
  id: quest.id,
  user_id: userId,
  title: quest.title,
  description: quest.description || '',
  difficulty: quest.difficulty,
  category: quest.category,
  completed: quest.completed,
  created_at: quest.createdAt,
  due_date: toDateOnly(quest.dueDate),
  data: quest
});

const goalRow = (userId: string, goal: Goal) => ({
  id: goal.id,
  user_id: userId,
  title: goal.title,
  aspiration: goal.aspiration || goal.title,
  category_name: goal.categoryName || 'Personal Growth',
  timeline_explanation: goal.timelineExplanation || '',
  resources: goal.resources || [],
  status: goal.status || 'In Quest',
  created_at: goal.createdAt,
  linked_quests_added: Boolean(goal.linkedQuestsAdded),
  data: goal
});

const userRow = (user: Partial<IcarusUserData>) => ({
  id: user.id,
  email: user.email || '',
  name: user.display_name || user.characterProfile?.name || '',
  display_name: user.display_name || user.characterProfile?.name || '',
  preferred_name: user.preferred_name || user.characterProfile?.preferredName || '',
  title: user.title || user.characterProfile?.title || 'The Wanderer',
  xp: user.xp ?? user.characterProfile?.xp ?? 0,
  streak: user.characterProfile?.streak ?? 0,
  avatar_seed: user.avatar_seed || user.characterProfile?.avatarSeed || '',
  monument_seed: user.monument_seed || user.characterProfile?.monumentSeed || '',
  date_of_birth: user.date_of_birth || user.characterProfile?.dateOfBirth || null,
  timezone: user.timezone || user.characterProfile?.timezone || 'UTC',
  level: user.level || Math.floor((user.characterProfile?.xp || 0) / 1000) + 1,
  character_profile: user.characterProfile || null,
  account_created: user.created_at || user.characterProfile?.accountCreated || new Date().toISOString()
});

export async function signUpWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Registration did not return a user.');
  return data.user;
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Login did not return a user.');
  return data.user;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export async function signOutOfSupabase() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function loadUserBundle(userId: string, email = ''): Promise<IcarusUserData> {
  const [{ data: profile, error: profileError }, { data: quests, error: questsError }, { data: goals, error: goalsError }] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('quests').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  ]);

  if (profileError) throw profileError;
  if (questsError) throw questsError;
  if (goalsError) throw goalsError;

  return {
    id: userId,
    email: profile.email || email,
    display_name: profile.display_name || profile.name || '',
    preferred_name: profile.preferred_name || '',
    date_of_birth: profile.date_of_birth || '',
    timezone: profile.timezone || 'UTC',
    level: profile.level || Math.floor((profile.xp || 0) / 1000) + 1,
    xp: profile.xp || 0,
    title: profile.title || 'The Wanderer',
    avatar_seed: profile.avatar_seed || '',
    monument_seed: profile.monument_seed || '',
    created_at: profile.account_created || profile.created_at || new Date().toISOString(),
    quests: (quests || []).map((row: any) => row.data || {
      id: row.id,
      title: row.title,
      description: row.description || '',
      difficulty: row.difficulty,
      category: row.category,
      completed: row.completed,
      createdAt: row.created_at,
      dueDate: row.due_date || undefined
    }),
    goals: (goals || []).map((row: any) => row.data || {
      id: row.id,
      title: row.title,
      aspiration: row.aspiration,
      categoryName: row.category_name,
      timelineExplanation: row.timeline_explanation || '',
      resources: row.resources || [],
      stages: [],
      status: row.status,
      createdAt: row.created_at,
      linkedQuestsAdded: row.linked_quests_added
    }),
    characterProfile: profile.character_profile
  };
}

export async function saveUserProfile(user: Partial<IcarusUserData>) {
  const { error } = await supabase.from('users').upsert(userRow(user), { onConflict: 'id' });
  if (error) throw error;
}

export async function saveQuests(userId: string, quests: Quest[]) {
  if (!quests.length) return;
  const { error } = await supabase.from('quests').upsert(quests.map(quest => questRow(userId, quest)), { onConflict: 'id' });
  if (error) throw error;
}

export async function saveGoals(userId: string, goals: Goal[]) {
  if (!goals.length) return;
  const { error } = await supabase.from('goals').upsert(goals.map(goal => goalRow(userId, goal)), { onConflict: 'id' });
  if (error) throw error;
}

export async function saveGoal(userId: string, goal: Goal) {
  await saveGoals(userId, [goal]);
}

export async function deleteQuest(userId: string, questId: string) {
  const { error } = await supabase.from('quests').delete().eq('user_id', userId).eq('id', questId);
  if (error) throw error;
}

export async function deleteQuests(userId: string, questIds: string[]) {
  if (!questIds.length) return;
  const { error } = await supabase.from('quests').delete().eq('user_id', userId).in('id', questIds);
  if (error) throw error;
}

export async function deleteGoal(userId: string, goalId: string) {
  const { error } = await supabase.from('goals').delete().eq('user_id', userId).eq('id', goalId);
  if (error) throw error;
}

export async function purgeUserData(userId: string) {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw error;
}
