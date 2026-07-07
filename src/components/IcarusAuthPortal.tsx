import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  StyleSheet,
  Animated,
  Easing
} from 'react-native';
import { 
  User, 
  Mail, 
  Lock, 
  Compass, 
  Calendar, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  ArrowRight, 
  LockKeyhole, 
  ArrowLeft, 
  AlertTriangle,
  RefreshCw,
  Award
} from 'lucide-react-native';
import { Goal, Quest } from '../types';
import { loadUserBundle, saveGoal, saveQuests, saveUserProfile, sendPasswordReset, signInWithPassword, signUpWithPassword } from '../lib/supabase';
import { generateGoalPlan, getApiKey } from '../utils/aiEngine';
import { COLORS, FONTS, THEME_STYLES } from '../theme';

interface IcarusAuthPortalProps {
  onLoginSuccess: (userData: {
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
  }) => void;
  soundEngine: any;
}

type Mode = 'WELCOME' | 'LOGIN' | 'SIGNUP' | 'FORGOT_PASS' | 'GENERATING_CHAR' | 'FIRST_ONBOARDING' | 'CONFIRM_ONBOARDING';

export const IcarusAuthPortal: React.FC<IcarusAuthPortalProps> = ({ onLoginSuccess, soundEngine }) => {
  const [mode, setMode] = useState<Mode>('WELCOME');
  
  // Sigil Animations
  const sigilRotateCw = useRef(new Animated.Value(0)).current;
  const sigilRotateCcw = useRef(new Animated.Value(0)).current;
  const sigilPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cwLoop: Animated.CompositeAnimation | null = null;
    let ccwLoop: Animated.CompositeAnimation | null = null;
    let pulseLoop: Animated.CompositeAnimation | null = null;

    if (mode === 'WELCOME') {
      sigilRotateCw.setValue(0);
      sigilRotateCcw.setValue(0);
      sigilPulse.setValue(1);

      cwLoop = Animated.loop(
        Animated.timing(sigilRotateCw, {
          toValue: 1,
          duration: 25000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      cwLoop.start();

      ccwLoop = Animated.loop(
        Animated.timing(sigilRotateCcw, {
          toValue: 1,
          duration: 15000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      ccwLoop.start();

      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(sigilPulse, {
            toValue: 1.08,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(sigilPulse, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      );
      pulseLoop.start();
    }

    return () => {
      if (cwLoop) cwLoop.stop();
      if (ccwLoop) ccwLoop.stop();
      if (pulseLoop) pulseLoop.stop();
    };
  }, [mode]);

  const spinSigilCw = sigilRotateCw.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinSigilCcw = sigilRotateCcw.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  // Fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timezone, setTimezone] = useState('UTC');

  // UI Flow Status
  const [errorStatus, setErrorStatus] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Character generation ticking states
  const [charGenStep, setCharGenStep] = useState(0);
  const [registeredUserResponse, setRegisteredUserResponse] = useState<any>(null);

  // Onboarding settings
  const [firstAspiration, setFirstAspiration] = useState('');
  const [plannedCampaign, setPlannedCampaign] = useState<Goal | null>(null);

  const presetAspirations = [
    { title: 'Learn Guitar', rpg: 'Resonate the Mystic Lute Strings' },
    { title: 'Become Fit', rpg: 'Vessel of Agony Calisthenics' },
    { title: 'Learn React', rpg: 'Inscribe React Component Portal Elements' },
    { title: 'Improve Discipline', rpg: 'Covenant of Untamed Vows' },
    { title: 'Sleep Better', rpg: 'Shadow Rest & Slumber Vigil' }
  ];

  const charGenSteps = [
    "Carving Starting Monument...",
    "Binding Initial Geometry Seed...",
    "Awarding Starting Title: 'The Wanderer'...",
    "Emptying Chronicles Ledger..."
  ];

  useEffect(() => {
    if (mode === 'GENERATING_CHAR') {
      const interval = setInterval(() => {
        setCharGenStep(prev => {
          if (prev >= charGenSteps.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
              setMode('FIRST_ONBOARDING');
            }, 1000);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [mode]);

  const handleModeChange = (newMode: Mode) => {
    soundEngine.playClick();
    setErrorStatus('');
    setSuccessMessage('');
    setMode(newMode);
  };

  const handleLoginSubmit = async () => {
    if (!email.trim() || !password) {
      setErrorStatus('Provide email and password seals.');
      return;
    }

    setIsLoading(true);
    setErrorStatus('');
    try {
      const user = await signInWithPassword(email.trim(), password);
      const userData = await loadUserBundle(user.id, user.email || email.trim(), user.user_metadata);

      if (!userData.characterProfile) {
        // Build initial character details
        const userId = user.id;
        const signupDate = new Date().toISOString();
        const geometrySeed = Math.floor(Math.random() * 10000000);
        const monumentSeed = `monument-${userId}-${Math.floor(Math.random() * 999999)}`;
        const startingTitle = userData.preferred_name ? userData.preferred_name : "The Wanderer";

        const characterProfile = {
          id: userId,
          name: userData.display_name || email.split('@')[0],
          title: startingTitle,
          xp: 0,
          accountCreated: signupDate,
          preferredName: userData.preferred_name || "The Wanderer",
          dateOfBirth: userData.date_of_birth || "",
          timezone: userData.timezone || "UTC",
          avatarSeed: String(geometrySeed),
          monumentSeed: monumentSeed,
          created_at: signupDate,
          stats: {
            strength: 10, endurance: 10, discipline: 10, recovery: 10,
            focus: 10, consistency: 10, learningSpeed: 10, resilience: 10,
            programming: 10, mathematics: 10, finance: 10, communication: 10,
            creativity: 10, leadership: 10, networking: 10, collaboration: 10
          },
          chronicle: [
            {
              id: `chron-init-${Date.now()}`,
              timeframe: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
              bullets: [
                `Entered the domain of ICARUS as ${userData.display_name || email.split('@')[0]} (${startingTitle}).`,
                `Swore initial mental and physical covenants under starting seed ${geometrySeed}.`
              ]
            }
          ],
          skillTrees: [
            {
              category: 'Programming',
              nodes: [
                { id: 'prog-fund', name: 'Programming Fundamentals', description: 'Core principles: logic, types, flow controls', level: 0, maxLevel: 1, status: 'available', xp: 0, requiredXp: 100, prerequisites: [] },
                { id: 'prog-java', name: 'Java Sanctuary', description: 'Strong, robust types & compilations', level: 0, maxLevel: 3, status: 'locked', xp: 0, requiredXp: 200, prerequisites: ['prog-fund'] },
                { id: 'prog-oop', name: 'OOP & Collections', description: 'Polymorphism and efficient structures', level: 0, maxLevel: 3, status: 'locked', xp: 0, requiredXp: 300, prerequisites: ['prog-java'] },
                { id: 'prog-spring', name: 'Spring Boot Castle', description: 'Enterprise backend orchestration', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 500, prerequisites: ['prog-oop'] },
                { id: 'prog-front', name: 'Frontend Guild', description: 'Inscribing direct canvas styles: HTML & CSS', level: 0, maxLevel: 1, status: 'locked', xp: 0, requiredXp: 150, prerequisites: ['prog-fund'] },
                { id: 'prog-react', name: 'React Componentry', description: 'Unifying flows with UI hooks and state', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 350, prerequisites: ['prog-front'] },
                { id: 'prog-next', name: 'NextJS Realm', description: 'Server-side pre-rendering & asset portals', level: 0, maxLevel: 4, status: 'locked', xp: 0, requiredXp: 450, prerequisites: ['prog-react'] },
                { id: 'prog-ai', name: 'AI Engineering', description: 'Communicating with celestial neural oracles', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 500, prerequisites: ['prog-fund'] }
              ]
            },
            {
              category: 'Fitness',
              nodes: [
                { id: 'fit-will', name: 'Ritual of Will', description: 'Initiating physical focus parameters', level: 0, maxLevel: 1, status: 'available', xp: 0, requiredXp: 100, prerequisites: [] },
                { id: 'fit-run', name: 'Swift Sentinel Running', description: 'Enhance heart longevity & aerobic speed', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 200, prerequisites: ['fit-will'] },
                { id: 'fit-strength', name: 'Iron Forging', description: 'Power training, compound weights and calisthenics', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 250, prerequisites: ['fit-will'] },
                { id: 'fit-mobility', name: 'Shadow Reflexes', description: 'Stretching, joints, and spine protection guidance', level: 0, maxLevel: 3, status: 'locked', xp: 0, requiredXp: 180, prerequisites: ['fit-will'] },
                { id: 'fit-nutrition', name: 'Herbology Alchemy', description: 'Proper fasting windows and metabolic clean intake', level: 0, maxLevel: 3, status: 'locked', xp: 0, requiredXp: 200, prerequisites: ['fit-will'] }
              ]
            },
            {
              category: 'Personal Development',
              nodes: [
                { id: 'dev-wake', name: 'Dawn Vigil', description: 'Conquer early morning shadows', level: 0, maxLevel: 1, status: 'available', xp: 0, requiredXp: 100, prerequisites: [] },
                { id: 'dev-time', name: 'Hour Dial Management', description: 'Rigid blocks of deep focused concentration', level: 0, maxLevel: 4, status: 'locked', xp: 0, requiredXp: 180, prerequisites: ['dev-wake'] },
                { id: 'dev-read', name: 'Scroll Reading studies', description: 'Continuous absorption of mystical volumes', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 150, prerequisites: ['dev-wake'] },
                { id: 'dev-habit', name: 'Chain of Iron Habits', description: 'Lock in standard repetition frequencies', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 200, prerequisites: ['dev-wake'] },
                { id: 'dev-journal', name: 'Annals Inscription', description: 'Daily journaling & high spiritual reflecting', level: 0, maxLevel: 3, status: 'locked', xp: 0, requiredXp: 120, prerequisites: ['dev-wake'] }
              ]
            }
          ],
          achievements: [
            { id: 'ach-first', name: 'First Liturgical Duty', description: 'Inscribe and complete your very first Vow.', category: 'Discipline', rarity: 'Common', unlocked: false },
            { id: 'ach-habit-heavy', name: 'Alchemical Crusader', description: 'Survive a 40-Day continuous Habit Cycle without break.', category: 'Productivity', rarity: 'Epic', unlocked: false },
            { id: 'ach-gym-god', name: 'Vessel of Agony', description: 'Demonstrate supreme athletic grit under hard trial severe burdens.', category: 'Fitness', rarity: 'Legendary', unlocked: false },
            { id: 'ach-react-m', name: 'Developer Guild Master', description: 'Fully master Frontend or AI components inside Programming.', category: 'Learning', rarity: 'Rare', unlocked: false },
            { id: 'ach-fire-k', name: 'bonfire Guardian', description: 'Gather and maintain high streak counts above 10.', category: 'Discipline', rarity: 'Common', unlocked: false },
            { id: 'ach-complete-all', name: 'The Miracle Absolute', description: 'Earn 30,000 XP in your records.', category: 'Mastery', rarity: 'Mythic', unlocked: false }
          ],
          earnedTitles: [startingTitle],
          streak: 0
        };

        const newUserPayload = {
          ...userData,
          characterProfile,
          title: startingTitle,
          avatar_seed: String(geometrySeed),
          monument_seed: monumentSeed,
          created_at: signupDate
        };

        await saveUserProfile(newUserPayload);

        soundEngine.playQuestInscribe();
        setRegisteredUserResponse(newUserPayload);
        setCharGenStep(0);
        setMode('GENERATING_CHAR');
        return;
      }

      soundEngine.playQuestIgnite();
      onLoginSuccess(userData);
    } catch (err: any) {
      setErrorStatus(err.message || 'The authentication gates failed to slide open.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async () => {
    setErrorStatus('');

    if (!displayName.trim()) {
      setErrorStatus('Enter thy true Display Name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorStatus('Provide an eligible email address.');
      return;
    }
    if (password.length < 6) {
      setErrorStatus('Password signature must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorStatus('Thy confirm password signature does not match.');
      return;
    }

    setIsLoading(true);
    try {
      const metadata = {
        display_name: displayName.trim(),
        preferred_name: preferredName.trim() || "",
        date_of_birth: dateOfBirth || "",
        timezone: timezone || "UTC"
      };

      const { user, session } = await signUpWithPassword(email.trim(), password, metadata);
      const userId = user.id;
      const signupDate = new Date().toISOString();

      const geometrySeed = Math.floor(Math.random() * 10000000);
      const monumentSeed = `monument-${userId}-${Math.floor(Math.random() * 999999)}`;
      const startingTitle = preferredName.trim() ? preferredName.trim() : "The Wanderer";

      const characterProfile = {
        id: userId,
        name: displayName.trim(),
        title: startingTitle,
        xp: 0,
        accountCreated: signupDate,
        preferredName: preferredName.trim() || "The Wanderer",
        dateOfBirth: dateOfBirth || "",
        timezone: timezone || "UTC",
        avatarSeed: String(geometrySeed),
        monumentSeed: monumentSeed,
        created_at: signupDate,
        stats: {
          strength: 10, endurance: 10, discipline: 10, recovery: 10,
          focus: 10, consistency: 10, learningSpeed: 10, resilience: 10,
          programming: 10, mathematics: 10, finance: 10, communication: 10,
          creativity: 10, leadership: 10, networking: 10, collaboration: 10
        },
        chronicle: [
          {
            id: `chron-init-${Date.now()}`,
            timeframe: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
            bullets: [
              `Entered the domain of ICARUS as ${displayName.trim()} (${startingTitle}).`,
              `Swore initial mental and physical covenants under starting seed ${geometrySeed}.`
            ]
          }
        ],
        skillTrees: [
          {
            category: 'Programming',
            nodes: [
              { id: 'prog-fund', name: 'Programming Fundamentals', description: 'Core principles: logic, types, flow controls', level: 0, maxLevel: 1, status: 'available', xp: 0, requiredXp: 100, prerequisites: [] },
              { id: 'prog-java', name: 'Java Sanctuary', description: 'Strong, robust types & compilations', level: 0, maxLevel: 3, status: 'locked', xp: 0, requiredXp: 200, prerequisites: ['prog-fund'] },
              { id: 'prog-oop', name: 'OOP & Collections', description: 'Polymorphism and efficient structures', level: 0, maxLevel: 3, status: 'locked', xp: 0, requiredXp: 300, prerequisites: ['prog-java'] },
              { id: 'prog-spring', name: 'Spring Boot Castle', description: 'Enterprise backend orchestration', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 500, prerequisites: ['prog-oop'] },
              { id: 'prog-front', name: 'Frontend Guild', description: 'Inscribing direct canvas styles: HTML & CSS', level: 0, maxLevel: 1, status: 'locked', xp: 0, requiredXp: 150, prerequisites: ['prog-fund'] },
              { id: 'prog-react', name: 'React Componentry', description: 'Unifying flows with UI hooks and state', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 350, prerequisites: ['prog-front'] },
              { id: 'prog-next', name: 'NextJS Realm', description: 'Server-side pre-rendering & asset portals', level: 0, maxLevel: 4, status: 'locked', xp: 0, requiredXp: 450, prerequisites: ['prog-react'] },
              { id: 'prog-ai', name: 'AI Engineering', description: 'Communicating with celestial neural oracles', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 500, prerequisites: ['prog-fund'] }
            ]
          },
          {
            category: 'Fitness',
            nodes: [
              { id: 'fit-will', name: 'Ritual of Will', description: 'Initiating physical focus parameters', level: 0, maxLevel: 1, status: 'available', xp: 0, requiredXp: 100, prerequisites: [] },
              { id: 'fit-run', name: 'Swift Sentinel Running', description: 'Enhance heart longevity & aerobic speed', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 200, prerequisites: ['fit-will'] },
              { id: 'fit-strength', name: 'Iron Forging', description: 'Power training, compound weights and calisthenics', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 250, prerequisites: ['fit-will'] },
              { id: 'fit-mobility', name: 'Shadow Reflexes', description: 'Stretching, joints, and spine protection guidance', level: 0, maxLevel: 3, status: 'locked', xp: 0, requiredXp: 180, prerequisites: ['fit-will'] },
              { id: 'fit-nutrition', name: 'Herbology Alchemy', description: 'Proper fasting windows and metabolic clean intake', level: 0, maxLevel: 3, status: 'locked', xp: 0, requiredXp: 200, prerequisites: ['fit-will'] }
            ]
          },
          {
            category: 'Personal Development',
            nodes: [
              { id: 'dev-wake', name: 'Dawn Vigil', description: 'Conquer early morning shadows', level: 0, maxLevel: 1, status: 'available', xp: 0, requiredXp: 100, prerequisites: [] },
              { id: 'dev-time', name: 'Hour Dial Management', description: 'Rigid blocks of deep focused concentration', level: 0, maxLevel: 4, status: 'locked', xp: 0, requiredXp: 180, prerequisites: ['dev-wake'] },
              { id: 'dev-read', name: 'Scroll Reading studies', description: 'Continuous absorption of mystical volumes', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 150, prerequisites: ['dev-wake'] },
              { id: 'dev-habit', name: 'Chain of Iron Habits', description: 'Lock in standard repetition frequencies', level: 0, maxLevel: 5, status: 'locked', xp: 0, requiredXp: 200, prerequisites: ['dev-wake'] },
              { id: 'dev-journal', name: 'Annals Inscription', description: 'Daily journaling & high spiritual reflecting', level: 0, maxLevel: 3, status: 'locked', xp: 0, requiredXp: 120, prerequisites: ['dev-wake'] }
            ]
          }
        ],
        achievements: [
          { id: 'ach-first', name: 'First Liturgical Duty', description: 'Inscribe and complete your very first Vow.', category: 'Discipline', rarity: 'Common', unlocked: false },
          { id: 'ach-habit-heavy', name: 'Alchemical Crusader', description: 'Survive a 40-Day continuous Habit Cycle without break.', category: 'Productivity', rarity: 'Epic', unlocked: false },
          { id: 'ach-gym-god', name: 'Vessel of Agony', description: 'Demonstrate supreme athletic grit under hard trial severe burdens.', category: 'Fitness', rarity: 'Legendary', unlocked: false },
          { id: 'ach-react-m', name: 'Developer Guild Master', description: 'Fully master Frontend or AI components inside Programming.', category: 'Learning', rarity: 'Rare', unlocked: false },
          { id: 'ach-fire-k', name: 'bonfire Guardian', description: 'Gather and maintain high streak counts above 10.', category: 'Discipline', rarity: 'Common', unlocked: false },
          { id: 'ach-complete-all', name: 'The Miracle Absolute', description: 'Earn 30,000 XP in your records.', category: 'Mastery', rarity: 'Mythic', unlocked: false }
        ],
        earnedTitles: [startingTitle],
        streak: 0
      };

      const newUserPayload = {
        id: userId,
        email: email.toLowerCase(),
        display_name: displayName.trim(),
        preferred_name: preferredName.trim() || "",
        date_of_birth: dateOfBirth || "",
        timezone: timezone || "UTC",
        level: 1,
        xp: 0,
        title: startingTitle,
        avatar_seed: String(geometrySeed),
        monument_seed: monumentSeed,
        created_at: signupDate,
        quests: [],
        goals: [],
        characterProfile
      };

      if (!session) {
        setSuccessMessage('A verification link has been sent to thy email. Confirm it to activate thy soul, then log in.');
        setMode('LOGIN');
        return;
      }

      await saveUserProfile(newUserPayload);
      soundEngine.playQuestInscribe();
      setRegisteredUserResponse(newUserPayload);
      setCharGenStep(0);
      setMode('GENERATING_CHAR');
    } catch (err: any) {
      setErrorStatus(err.message || 'Registration failed.');
    } {
      setIsLoading(false);
    }
  };

  const handlePasswordResetSubmit = async () => {
    if (!email.trim()) {
      setErrorStatus('Confirm email seal first.');
      return;
    }

    setIsLoading(true);
    setErrorStatus('');
    try {
      await sendPasswordReset(email.trim());
      setSuccessMessage('Thy reset scroll has been sent to thy email address.');
      setTimeout(() => {
        setMode('LOGIN');
      }, 3000);
    } catch (err: any) {
      setErrorStatus(err.message || 'Password realignment failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOnboardCampaign = async () => {
    if (!firstAspiration.trim()) {
      setErrorStatus('Let thy mind speak: state what thou wishes to become.');
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      setErrorStatus('AI is unavailable. Please come back later.');
      return;
    }

    setIsLoading(true);
    setErrorStatus('');
    try {
      const campaignData = await generateGoalPlan(firstAspiration.trim());
      
      // If AI returned an error or is somehow invalid, report unavailable
      if (!campaignData || (campaignData as any).error) {
        throw new Error('AI is unavailable. Please come back later.');
      }

      soundEngine.playLevelUp();
      setPlannedCampaign(campaignData);
      setMode('CONFIRM_ONBOARDING');
    } catch (err: any) {
      setErrorStatus('AI is unavailable. Please come back later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalAccess = async () => {
    soundEngine.playQuestIgnite();
    if (registeredUserResponse) {
      setIsLoading(true);
      const finalUserPayload = { ...registeredUserResponse };
      if (plannedCampaign) {
        finalUserPayload.goals = [plannedCampaign];
        
        const initialTasks = plannedCampaign.stages && plannedCampaign.stages[0]?.tasks;
        let onboardingQuests: Quest[] = [];
        if (initialTasks && initialTasks.length > 0) {
          onboardingQuests = initialTasks.map((t, idx) => ({
            id: `first-onboard-q-${idx}-${Date.now()}`,
            title: t.title,
            description: t.description || 'First Vow of thy Questline.',
            difficulty: t.difficulty || 'Lesser Burden',
            category: 'Vow',
            completed: false,
            createdAt: new Date().toISOString(),
            dueDate: new Date().toISOString().split('T')[0]
          }));
          finalUserPayload.quests = onboardingQuests;
        }

        if (finalUserPayload.characterProfile) {
          if (!finalUserPayload.characterProfile.chronicle) {
            finalUserPayload.characterProfile.chronicle = [];
          }
          finalUserPayload.characterProfile.chronicle.unshift({
            id: `chron-campaign-${Date.now()}`,
            timeframe: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
            bullets: [
              `Initiated ancient campaign: ${plannedCampaign.title}`,
              `Embraced primary learning cycle with focus: ${firstAspiration}`
            ]
          });
        }

        try {
          const userId = finalUserPayload.id;
          await Promise.all([
            saveGoal(userId, plannedCampaign),
            saveQuests(userId, onboardingQuests),
            saveUserProfile({
              ...finalUserPayload,
              quests: [],
              goals: []
            })
          ]);
        } catch (dbErr) {
          console.error("Failed writing onboarding data to Supabase: ", dbErr);
        } finally {
          setIsLoading(false);
        }
      }
      onLoginSuccess(finalUserPayload);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* Mode: WELCOME */}
        {mode === 'WELCOME' && (
          <View style={styles.welcomeBox}>
            <View style={styles.sigilBox}>
              <View style={styles.outerGlowCircle} />
              
              <Animated.View style={[styles.dashedOuterBorder, { transform: [{ rotate: spinSigilCw }] }]} />
              
              <Animated.View style={[styles.secondOrbitContainer, { transform: [{ rotate: spinSigilCcw }] }]}>
                <View style={styles.secondOrbitCircle} />
                <View style={styles.secondOrbitBead} />
              </Animated.View>
              
              <Animated.View 
                style={[
                  styles.quadrantRing, 
                  { 
                    transform: [
                      { rotate: spinSigilCw }, 
                      { scale: sigilPulse }
                    ] 
                  }
                ]} 
              />
              
              <View style={styles.raysOverlay} pointerEvents="none">
                <View style={[styles.rayLine, { transform: [{ rotate: '0deg' }] }]} />
                <View style={[styles.rayLine, { transform: [{ rotate: '45deg' }] }]} />
                <View style={[styles.rayLine, { transform: [{ rotate: '90deg' }] }]} />
                <View style={[styles.rayLine, { transform: [{ rotate: '135deg' }] }]} />
              </View>
              
              <View style={styles.coreSigil}>
                <Compass size={22} color={COLORS.gothicGold} />
              </View>
            </View>

            <Text style={styles.mainTitle}>ICARUS</Text>
            <Text style={styles.subTitle}>Become Who You Practice To Be</Text>

            <TouchableOpacity 
              style={[styles.btnPrimary, { marginBottom: 12 }]} 
              onPress={() => handleModeChange('SIGNUP')}
            >
              <Text style={styles.btnPrimaryText}>[ BEGIN JOURNEY ]</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.btnSecondary} 
              onPress={() => handleModeChange('LOGIN')}
            >
              <Text style={styles.btnSecondaryText}>[ CONTINUE JOURNEY ]</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mode: LOGIN */}
        {mode === 'LOGIN' && (
          <View style={styles.formCard}>
            <TouchableOpacity style={styles.backBtn} onPress={() => handleModeChange('WELCOME')}>
              <ArrowLeft size={12} color={COLORS.gray500} />
              <Text style={styles.backBtnText}>BACK</Text>
            </TouchableOpacity>

            <Text style={styles.formTitle}>Continue Journey</Text>
            <View style={styles.titleDivider} />

            {errorStatus ? (
              <View style={styles.errorBox}>
                <AlertTriangle size={14} color={COLORS.gothicCrimson} />
                <Text style={styles.errorText}>{errorStatus}</Text>
              </View>
            ) : null}

            {successMessage ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Mail size={14} color={COLORS.gray500} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.textInput}
                  placeholder="thy-email@domain.com"
                  placeholderTextColor={COLORS.gray700}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD</Text>
              <View style={styles.inputWrapper}>
                <Lock size={14} color={COLORS.gray500} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.gray700}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.forgotBtn} onPress={() => handleModeChange('FORGOT_PASS')}>
              <Text style={styles.forgotText}>Forgot Password signature?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.btnPrimarySubmit, isLoading && { opacity: 0.5 }]} 
              onPress={handleLoginSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <View style={styles.submitBtnContent}>
                  <LockKeyhole size={14} color="#000" />
                  <Text style={styles.btnSubmitText}>ENTER ICARUS</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.switchModeBox}>
              <Text style={styles.switchModeDesc}>New here? </Text>
              <TouchableOpacity onPress={() => handleModeChange('SIGNUP')}>
                <Text style={styles.switchModeLink}>Begin Journey</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Mode: FORGOT PASSWORD */}
        {mode === 'FORGOT_PASS' && (
          <View style={styles.formCard}>
            <TouchableOpacity style={styles.backBtn} onPress={() => handleModeChange('LOGIN')}>
              <ArrowLeft size={12} color={COLORS.gray500} />
              <Text style={styles.backBtnText}>BACK</Text>
            </TouchableOpacity>

            <Text style={styles.formTitle}>Realign Password</Text>
            <View style={styles.titleDivider} />

            {errorStatus ? (
              <View style={styles.errorBox}>
                <AlertTriangle size={14} color={COLORS.gothicCrimson} />
                <Text style={styles.errorText}>{errorStatus}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Mail size={14} color={COLORS.gray500} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.textInput}
                  placeholder="thy-email@domain.com"
                  placeholderTextColor={COLORS.gray700}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.btnPrimarySubmit, isLoading && { opacity: 0.5 }]} 
              onPress={handlePasswordResetSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.btnSubmitText}>SEND RESET SCROLL</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Mode: SIGNUP */}
        {mode === 'SIGNUP' && (
          <View style={[styles.formCard, { maxWidth: 500 }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => handleModeChange('WELCOME')}>
              <ArrowLeft size={12} color={COLORS.gray500} />
              <Text style={styles.backBtnText}>RETURN</Text>
            </TouchableOpacity>

            <Text style={styles.formTitle}>Begin Your Journey</Text>
            <Text style={styles.formSubtitle}>Create character records for thy eternal crusade</Text>
            <View style={styles.titleDivider} />

            {errorStatus ? (
              <View style={styles.errorBox}>
                <AlertTriangle size={14} color={COLORS.gothicCrimson} />
                <Text style={styles.errorText}>{errorStatus}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DISPLAY NAME *</Text>
              <View style={styles.inputWrapper}>
                <User size={14} color={COLORS.gray500} style={styles.inputIcon} />
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  style={styles.textInput}
                  placeholder="e.g. Ojier"
                  placeholderTextColor={COLORS.gray700}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL ADDRESS *</Text>
              <View style={styles.inputWrapper}>
                <Mail size={14} color={COLORS.gray500} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.textInput}
                  placeholder="thy-email@domain.com"
                  placeholderTextColor={COLORS.gray700}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PASSWORD *</Text>
              <View style={styles.inputWrapper}>
                <Lock size={14} color={COLORS.gray500} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.gray700}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD *</Text>
              <View style={styles.inputWrapper}>
                <Lock size={14} color={COLORS.gray500} style={styles.inputIcon} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.gray700}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PREFERRED NAME / TITLE PREFIX</Text>
              <View style={styles.inputWrapper}>
                <Award size={14} color={COLORS.gray500} style={styles.inputIcon} />
                <TextInput
                  value={preferredName}
                  onChangeText={setPreferredName}
                  style={styles.textInput}
                  placeholder="e.g. Ashen Zealot"
                  placeholderTextColor={COLORS.gray700}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DATE OF BIRTH (YYYY-MM-DD)</Text>
              <View style={styles.inputWrapper}>
                <Calendar size={14} color={COLORS.gray500} style={styles.inputIcon} />
                <TextInput
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  style={styles.textInput}
                  placeholder="e.g. 1998-05-15"
                  placeholderTextColor={COLORS.gray700}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.btnPrimarySubmit, isLoading && { opacity: 0.5 }]} 
              onPress={handleSignupSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.btnSubmitText}>SIGN INSCRIBE RECORDS</Text>
              )}
            </TouchableOpacity>

            <View style={styles.switchModeBox}>
              <Text style={styles.switchModeDesc}>Already registered? </Text>
              <TouchableOpacity onPress={() => handleModeChange('LOGIN')}>
                <Text style={styles.switchModeLink}>Continue Journey</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Mode: GENERATING CHARACTER */}
        {mode === 'GENERATING_CHAR' && (
          <View style={styles.welcomeBox}>
            <ActivityIndicator size="large" color={COLORS.gothicGold} style={{ marginBottom: 20 }} />
            <Text style={styles.mainTitle}>GENERATING RECREATION</Text>
            <View style={styles.titleDivider} />
            <View style={styles.checklistCard}>
              {charGenSteps.map((step, idx) => (
                <View key={idx} style={styles.checkStepRow}>
                  <Text style={[
                    styles.checkStepDot, 
                    { color: idx < charGenStep ? COLORS.gothicGold : (idx === charGenStep ? '#fff' : COLORS.gray700) }
                  ]}>
                    {idx < charGenStep ? '✦' : (idx === charGenStep ? '🕯️' : '⚓')}
                  </Text>
                  <Text style={[
                    styles.checkStepText,
                    { color: idx < charGenStep ? COLORS.gray300 : (idx === charGenStep ? '#fff' : COLORS.gray600) }
                  ]}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mode: FIRST_ONBOARDING (Choose thy primary Aspiration) */}
        {mode === 'FIRST_ONBOARDING' && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>State Thy Primary Crusade</Text>
            <Text style={styles.formSubtitle}>AI will devise thy initial 40-Day campaign</Text>
            <View style={styles.titleDivider} />

            {errorStatus ? (
              <View style={styles.errorBox}>
                <AlertTriangle size={14} color={COLORS.gothicCrimson} style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorStatus}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ENTER THY ASPIRATION (E.G. LEARN REACT, DO PUSHUPS, READ BOOKS)</Text>
              <TextInput
                value={firstAspiration}
                onChangeText={setFirstAspiration}
                style={styles.onboardInput}
                placeholder="State thy covenant target..."
                placeholderTextColor={COLORS.gray700}
              />
            </View>

            <Text style={styles.presetsHeader}>OR HARKEN ON PRESET CONVENANTS:</Text>
            <View style={styles.presetsGrid}>
              {presetAspirations.map((item, idx) => (
                <TouchableOpacity 
                  key={idx}
                  style={styles.presetItem}
                  onPress={() => setFirstAspiration(item.title)}
                >
                  <Text style={styles.presetTitle}>{item.title}</Text>
                  <Text style={styles.presetSubtitle}>{item.rpg}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.btnPrimarySubmit, { marginTop: 15 }, isLoading && { opacity: 0.5 }]} 
              onPress={handleCreateOnboardCampaign}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <View style={styles.submitBtnContent}>
                  <Sparkles size={14} color="#000" />
                  <Text style={styles.btnSubmitText}>PLAN CRUSADE ROADMAP</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Mode: CONFIRM_ONBOARDING */}
        {mode === 'CONFIRM_ONBOARDING' && plannedCampaign && (
          <View style={[styles.formCard, { maxWidth: 550 }]}>
            <Text style={styles.formTitle}>Crusade Roadmap Bestowed</Text>
            <Text style={[styles.onboardCampaignTitle, { color: COLORS.gothicGold }]}>{plannedCampaign.title}</Text>
            <Text style={styles.formSubtitle}>{plannedCampaign.timelineExplanation}</Text>
            <View style={styles.titleDivider} />

            <Text style={styles.presetsHeader}>CRUSADE PHASES PREVIEW:</Text>
            <ScrollView style={styles.campaignPreviewScroll}>
              {plannedCampaign.stages && plannedCampaign.stages.map((stage: any, sIdx: number) => (
                <View key={sIdx} style={styles.stagePreviewCard}>
                  <Text style={styles.stagePreviewName}>{stage.name}</Text>
                  <Text style={styles.stagePreviewLore}>{stage.lore}</Text>
                  {stage.tasks && stage.tasks.map((task: any, tIdx: number) => (
                    <View key={tIdx} style={styles.taskPreviewRow}>
                      <Text style={styles.taskPreviewBullet}>•</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.taskPreviewTitle}>{task.title}</Text>
                        <Text style={styles.taskPreviewDesc}>{task.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.btnPrimarySubmit, { marginTop: 15 }]} 
              onPress={handleFinalAccess}
            >
              <View style={styles.submitBtnContent}>
                <ArrowRight size={14} color="#000" />
                <Text style={styles.btnSubmitText}>COMMENCE SACRED CRUSADE</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: COLORS.gothicBack,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  welcomeBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.gothicCard,
    borderWidth: 1,
    borderColor: 'rgba(46, 50, 62, 0.6)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  sigilBox: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  outerGlowCircle: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(200, 158, 92, 0.2)',
  },
  dashedOuterBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(200, 158, 92, 0.4)',
  },
  secondOrbitContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondOrbitCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(200, 158, 92, 0.25)',
  },
  secondOrbitBead: {
    position: 'absolute',
    top: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gothicGold,
  },
  quadrantRing: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderWidth: 1,
    borderColor: 'rgba(200, 158, 92, 0.3)',
    borderRadius: 17,
    opacity: 0.7,
  },
  raysOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  rayLine: {
    position: 'absolute',
    left: 47,
    top: 0,
    width: 2,
    height: 96,
    backgroundColor: 'rgba(200, 158, 92, 0.4)',
  },
  coreSigil: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(200, 158, 92, 0.5)',
    backgroundColor: COLORS.gothicCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.gothicGold,
    letterSpacing: 4,
    marginBottom: 6,
    textAlign: 'center',
  },
  subTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 10,
    color: COLORS.gray400,
    letterSpacing: 2,
    marginBottom: 32,
    textAlign: 'center',
  },
  btnPrimary: {
    width: '100%',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(200, 158, 92, 0.5)',
    borderRadius: 8,
    backgroundColor: 'rgba(200, 158, 92, 0.05)',
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontFamily: FONTS.cinzel,
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  btnSecondary: {
    width: '100%',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSecondaryText: {
    fontFamily: FONTS.cinzel,
    fontSize: 11,
    color: COLORS.gray400,
    letterSpacing: 1.5,
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.gothicCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },
  backBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.gray500,
    letterSpacing: 1,
  },
  formTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  formSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gothicGold,
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  titleDivider: {
    height: 1,
    backgroundColor: 'rgba(200, 158, 92, 0.3)',
    width: 40,
    alignSelf: 'center',
    marginVertical: 12,
  },
  errorBox: {
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(164, 44, 56, 0.3)',
    backgroundColor: 'rgba(164, 44, 56, 0.1)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.gothicGold,
    letterSpacing: 0.5,
    flex: 1,
  },
  successBox: {
    padding: 10,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    borderColor: 'rgba(74, 222, 128, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: '#4ade80',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gothicGold,
    letterSpacing: 1,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: 40,
    color: '#fff',
    fontSize: 13,
    fontFamily: FONTS.sans,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  forgotText: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray500,
    letterSpacing: 0.5,
  },
  btnPrimarySubmit: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: COLORS.gothicGold,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnSubmitText: {
    fontFamily: FONTS.cinzel,
    fontSize: 11,
    color: '#000',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  switchModeBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 50, 62, 0.4)',
  },
  switchModeDesc: {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    color: COLORS.gray500,
  },
  switchModeLink: {
    fontFamily: FONTS.mono,
    fontSize: 9.5,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
  },
  checklistCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  checkStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 10,
  },
  checkStepDot: {
    fontSize: 14,
  },
  checkStepText: {
    fontFamily: FONTS.mono,
    fontSize: 10.5,
    letterSpacing: 0.5,
  },
  onboardInput: {
    width: '100%',
    height: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 13,
    fontFamily: FONTS.sans,
  },
  presetsHeader: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray500,
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  presetsGrid: {
    gap: 8,
    marginBottom: 12,
  },
  presetItem: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    backgroundColor: COLORS.gothicDark,
  },
  presetTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 10.5,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  presetSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.gray500,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  onboardCampaignTitle: {
    fontFamily: FONTS.cinzel,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  campaignPreviewScroll: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: COLORS.gothicBorder,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    marginVertical: 10,
  },
  stagePreviewCard: {
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 50, 62, 0.2)',
  },
  stagePreviewName: {
    fontFamily: FONTS.cinzel,
    fontSize: 11,
    color: COLORS.gothicGold,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  stagePreviewLore: {
    fontFamily: FONTS.mono,
    fontSize: 8.5,
    color: COLORS.gray500,
    fontStyle: 'italic',
    marginVertical: 4,
    textTransform: 'uppercase',
  },
  taskPreviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginVertical: 3,
  },
  taskPreviewBullet: {
    color: COLORS.gothicGold,
    fontSize: 10,
  },
  taskPreviewTitle: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.gray300,
    fontWeight: 'bold',
  },
  taskPreviewDesc: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    color: COLORS.gray500,
  }
});
export default IcarusAuthPortal;
