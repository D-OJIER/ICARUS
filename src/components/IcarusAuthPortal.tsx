/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
} from 'lucide-react';
import { Goal, Quest } from '../types';
import { auth, db } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs 
} from 'firebase/firestore';

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
  
  // Field states
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  });

  // UI Flow lists & states
  const [errorStatus, setErrorStatus] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Character generation indicators
  const [charGenStep, setCharGenStep] = useState(0);
  const [registeredUserResponse, setRegisteredUserResponse] = useState<any>(null);

  // Onboarding first campaign settings
  const [firstAspiration, setFirstAspiration] = useState('');
  const [plannedCampaign, setPlannedCampaign] = useState<Goal | null>(null);

  // Presets of gothic goals to help starting players
  const presetAspirations = [
    { title: 'Learn Guitar', rpg: 'Resonate the Mystic Lute Strings' },
    { title: 'Become Fit', rpg: 'Vessel of Agony Calisthenics' },
    { title: 'Learn React', rpg: 'Inscribe React Component Portal Elements' },
    { title: 'Improve Discipline', rpg: 'Covenant of Untamed Vows' },
    { title: 'Sleep Better', rpg: 'Shadow Rest & Slumber Vigil' }
  ];

  // Steps list for Character Generation process
  const charGenSteps = [
    "Carving Starting Monument...",
    "Binding Initial Geometry Seed...",
    "Awarding Starting Title: 'The Wanderer'...",
    "Emptying Chronicles Ledger..."
  ];

  // Dynamic step trigger for character generation
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorStatus('Provide email and password seals.');
      return;
    }

    setIsLoading(true);
    setErrorStatus('');
    try {
      // 1. Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userId = user.uid;

      // 2. Fetch User Profile Doc from Firestore
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        throw new Error('Thy character ledger was not found. Contact the scribes.');
      }

      const userData = userDocSnap.data() as any;

      // 3. Retrieve Subcollection lists of Quests and Goals (Campaigns)
      const questsSnap = await getDocs(collection(db, "users", userId, "quests"));
      const goalsSnap = await getDocs(collection(db, "users", userId, "goals"));

      userData.quests = questsSnap.docs.map(doc => doc.data() as Quest);
      userData.goals = goalsSnap.docs.map(doc => doc.data() as Goal);

      soundEngine.playQuestIgnite();
      onLoginSuccess(userData);
    } catch (err: any) {
      setErrorStatus(err.message || 'The authentication gates failed to slide open.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // 1. Create User in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userId = user.uid;
      const signupDate = new Date().toISOString();

      const geometrySeed = Math.floor(Math.random() * 10000000);
      const monumentSeed = `monument-${userId}-${Math.floor(Math.random() * 999999)}`;
      const startingTitle = preferredName ? preferredName : "The Wanderer";

      // 2. Build initial character template details
      const characterProfile = {
        id: userId,
        name: displayName,
        title: startingTitle,
        xp: 0,
        accountCreated: signupDate,
        preferredName: preferredName || "The Wanderer",
        dateOfBirth: dateOfBirth || "",
        timezone: timezone || "UTC",
        avatarSeed: String(geometrySeed),
        monumentSeed: monumentSeed,
        created_at: signupDate,
        stats: {
          strength: 10,
          endurance: 10,
          discipline: 10,
          recovery: 10,
          focus: 10,
          consistency: 10,
          learningSpeed: 10,
          resilience: 10,
          programming: 10,
          mathematics: 10,
          finance: 10,
          communication: 10,
          creativity: 10,
          leadership: 10,
          networking: 10,
          collaboration: 10
        },
        chronicle: [
          {
            id: `chron-init-${Date.now()}`,
            timeframe: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
            bullets: [
              `Entered the domain of ICARUS as ${displayName} (${startingTitle}).`,
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
        display_name: displayName,
        preferred_name: preferredName || "",
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

      // 3. Save core user payload inside Firestore
      await setDoc(doc(db, "users", userId), newUserPayload);

      soundEngine.playQuestInscribe();
      setRegisteredUserResponse(newUserPayload);
      setCharGenStep(0);
      setMode('GENERATING_CHAR');
    } catch (err: any) {
      setErrorStatus(err.message || 'Firebase Registration Failure.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorStatus('Confirm email seal first.');
      return;
    }

    setIsLoading(true);
    setErrorStatus('');
    try {
      await sendPasswordResetEmail(auth, email);
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

    setIsLoading(true);
    setErrorStatus('');
    try {
      const res = await fetch('/api/gemini/plan-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aspiration: firstAspiration })
      });

      // Special rule requested by user:
      // "while creating tasks if the ai is unavailable say unavailable and do not create anything just tell them come back later"
      if (!res.ok) {
        throw new Error('AI is unavailable. Please come back later.');
      }

      const campaignData = await res.json();
      if (!campaignData || campaignData.error) {
        throw new Error('AI is unavailable. Please come back later.');
      }

      soundEngine.playLevelUp();
      setPlannedCampaign(campaignData);
      setMode('CONFIRM_ONBOARDING');
    } catch (err: any) {
      // Handle unavailable errors - strictly say "AI is unavailable. Please come back later."
      setErrorStatus(err.message || 'AI is unavailable. Please come back later.');
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
        // Enforce first campaign integration
        finalUserPayload.goals = [plannedCampaign];
        
        // Add tasks to default quests
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

        // Record chronicle bullet
        if (finalUserPayload.characterProfile) {
          if (!finalUserPayload.characterProfile.chronicle) {
            finalUserPayload.characterProfile.chronicle = [];
          }
          finalUserPayload.characterProfile.chronicle.push({
            id: `chron-campaign-${Date.now()}`,
            timeframe: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
            bullets: [
              `Initiated ancient campaign: ${plannedCampaign.title || plannedCampaign.name}`,
              `Embraced primary learning cycle with focus: ${firstAspiration}`
            ]
          });
        }

        try {
          // 4. Save campaign and quests in separate Firestore database collections!
          const userId = finalUserPayload.id;
          const batchPromises: Promise<any>[] = [];
          
          batchPromises.push(setDoc(doc(db, "users", userId, "goals", plannedCampaign.id), plannedCampaign));
          
          onboardingQuests.forEach(q => {
            batchPromises.push(setDoc(doc(db, "users", userId, "quests", q.id), q));
          });
          
          // Save user profile state
          batchPromises.push(setDoc(doc(db, "users", userId), {
            ...finalUserPayload,
            quests: [], // keep root array empty on firestore as it's modeled in subcollections
            goals: []
          }));
          
          await Promise.all(batchPromises);
        } catch (dbErr) {
          console.error("Failed writing onboarding data to Firestore: ", dbErr);
        } finally {
          setIsLoading(false);
        }
      }
      onLoginSuccess(finalUserPayload);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gothic-back relative overflow-hidden font-sans select-none">
      
      {/* Background ambient symbols */}
      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-gothic-gold/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gothic-gold/[0.02] rounded-full border border-gothic-border/20 pointer-events-none animate-pulse-blood" />

      <AnimatePresence mode="wait">
        
        {/* SCREEN 1: WELCOME */}
        {mode === 'WELCOME' && (
          <motion.div 
            key="welcome"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-lg p-5 xs:p-8 sm:p-10 rounded-2xl border border-gothic-border/60 bg-gothic-card/90 shadow-[0_0_50px_rgba(0,0,0,0.8)] text-center relative z-10 mx-auto"
          >
            {/* Minimalist geometric sigil */}
            <motion.div 
              className="w-24 h-24 mx-auto mb-8 flex items-center justify-center relative group cursor-pointer"
              initial={{ scale: 0.8, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              whileHover={{ scale: 1.05 }}
            >
              {/* Outer Glow Ring */}
              <div className="absolute inset-0 rounded-full border border-gothic-gold/20 opacity-30 blur-[2px] group-hover:opacity-60 transition-opacity duration-500" />
              
              {/* Ring 1: Clockwise Outer Astrolabe Ring */}
              <motion.div 
                className="absolute inset-0 rounded-full border border-dashed border-gothic-gold/40"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              />

              {/* Ring 2: Counter-Clockwise Concentric Ring */}
              <motion.div 
                className="absolute inset-2 rounded-full border border-gothic-gold/25 before:content-[''] before:absolute before:-top-0.5 before:left-1/2 before:-translate-x-1/2 before:w-1.5 before:h-1.5 before:bg-gothic-gold before:rounded-full before:shadow-[0_0_8px_rgba(200,158,92,1)]"
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
              />

              {/* Ring 3: Concentric Quadrant Rounded Square Ring */}
              <motion.div 
                className="absolute inset-4.5 border border-gothic-gold/30 opacity-70"
                style={{ borderRadius: '25%' }}
                animate={{ rotate: 360, scale: [1, 1.08, 1] }}
                transition={{ 
                  rotate: { repeat: Infinity, duration: 10, ease: "linear" },
                  scale: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                }}
              />

              {/* Inner Decagram/Rays */}
              <div className="absolute inset-0 flex items-center justify-center opacity-15 group-hover:opacity-45 transition-opacity duration-500">
                <div className="absolute w-20 h-[1px] bg-gothic-gold/40 transform rotate-0" />
                <div className="absolute w-20 h-[1px] bg-gothic-gold/40 transform rotate-45" />
                <div className="absolute w-20 h-[1px] bg-gothic-gold/40 transform rotate-90" />
                <div className="absolute w-20 h-[1px] bg-gothic-gold/40 transform rotate-135" />
              </div>

              {/* Core Sigil Element */}
              <motion.div
                className="relative z-10 w-11 h-11 rounded-full bg-gothic-card/95 border border-gothic-gold/50 flex items-center justify-center shadow-[0_0_15px_rgba(200,158,92,0.15)] group-hover:shadow-[0_0_25px_rgba(200,158,92,0.4)] transition-all duration-500"
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              >
                <Compass className="w-5 h-5 text-gothic-gold" />
              </motion.div>
            </motion.div>

            <h1 className="font-cinzel text-3xl xs:text-4xl sm:text-5xl font-black text-gothic-gold uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-4">
              ICARUS
            </h1>
            <p className="font-cinzel text-[10px] sm:text-xs text-gray-400 uppercase tracking-[0.15em] sm:tracking-[0.25em] mb-8 sm:mb-12 px-2">
              Become Who You Practice To Be
            </p>

            <div className="space-y-4">
              <button
                onClick={() => handleModeChange('SIGNUP')}
                className="w-full py-3 sm:py-4 px-3 border border-gothic-gold/50 hover:border-gothic-gold rounded-lg font-cinzel text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.2em] text-white uppercase bg-gothic-gold/5 hover:bg-gothic-gold/15 transition-all duration-300 shadow-[0_0_15px_rgba(200,158,92,0.05)] hover:shadow-[0_0_20px_rgba(200,158,92,0.15)] flex items-center justify-center gap-2 cursor-pointer"
              >
                [ Begin Journey ]
              </button>
              
              <button
                onClick={() => handleModeChange('LOGIN')}
                className="w-full py-3 sm:py-4 px-3 border border-gothic-border/80 hover:border-gothic-border rounded-lg font-cinzel text-[10px] sm:text-xs tracking-[0.1em] sm:tracking-[0.2em] text-gray-400 hover:text-white uppercase hover:bg-black/40 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                [ Continue Journey ]
              </button>
            </div>
          </motion.div>
        )}

        {/* SCREEN 2: LOGIN */}
        {mode === 'LOGIN' && (
          <motion.div 
            key="login"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-md p-5 xs:p-7 sm:p-8 rounded-2xl border border-gothic-border bg-gothic-card/90 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative z-10 mx-auto"
          >
            <button
              onClick={() => handleModeChange('WELCOME')}
              className="absolute top-6 left-6 text-gray-500 hover:text-gothic-gold transition-colors flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            <div className="text-center mt-4 mb-8">
              <h2 className="font-cinzel text-xl font-bold tracking-[0.15em] text-white uppercase">
                Continue Journey
              </h2>
              <div className="h-px w-10 bg-gothic-gold/40 mx-auto mt-2.5" />
            </div>

            {errorStatus && (
              <div className="mb-5 p-3.5 rounded-lg border border-gothic-crimson/30 bg-gothic-crimson/10 text-gothic-gold font-mono text-[10px] uppercase tracking-wider flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-gothic-crimson" />
                <span>{errorStatus}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gothic-gold mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gothic-border/60 bg-black/40 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gothic-gold transition-colors font-sans"
                    placeholder="thy-email@domain.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gothic-gold mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gothic-border/60 bg-black/40 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gothic-gold transition-colors font-sans"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono tracking-wider pt-2">
                <button
                  type="button"
                  onClick={() => handleModeChange('FORGOT_PASS')}
                  className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 mt-4 px-3 border border-gothic-gold font-cinzel text-[10px] sm:text-xs tracking-[0.08em] xs:tracking-[0.15em] text-black uppercase bg-gothic-gold hover:bg-gothic-gold/85 disabled:opacity-40 rounded-lg transition-colors cursor-pointer font-bold duration-200 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(200,158,92,0.15)]"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : <><LockKeyhole className="w-3.5 h-3.5 shrink-0" /> [ Enter ICARUS ]</>}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gothic-border/40 text-center font-mono text-[10px] uppercase tracking-widest text-gray-500 flex justify-center items-center gap-1.5">
              <span>New here?</span>
              <button
                onClick={() => handleModeChange('SIGNUP')}
                className="text-gothic-gold hover:text-white font-bold transition-colors cursor-pointer"
              >
                Begin Journey
              </button>
            </div>
          </motion.div>
        )}

        {/* SCREEN 3: SIGNUP (Begin Journey) */}
        {mode === 'SIGNUP' && (
          <motion.div 
            key="signup"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-xl p-4 xs:p-6 sm:p-8 rounded-2xl border border-gothic-border bg-gothic-card/90 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative z-10 mx-auto"
          >
            <button
              onClick={() => handleModeChange('WELCOME')}
              className="absolute top-6 left-6 text-gray-500 hover:text-gothic-gold transition-colors flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return
            </button>

            <div className="text-center mt-4 mb-6">
              <h2 className="font-cinzel text-xl font-bold tracking-[0.15em] text-white uppercase">
                Begin Your Journey
              </h2>
              <p className="font-mono text-[9.5px] uppercase text-gothic-gold mt-1.5 tracking-widest">
                Create character records for thy eternal crusade
              </p>
              <div className="h-px w-10 bg-gothic-gold/40 mx-auto mt-2" />
            </div>

            {errorStatus && (
              <div className="mb-5 p-3.5 rounded-lg border border-gothic-crimson/30 bg-gothic-crimson/10 text-gothic-gold font-mono text-[10px] uppercase tracking-wider flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-gothic-crimson" />
                <span>{errorStatus}</span>
              </div>
            )}

            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Required Fields */}
                <div className="space-y-3.5">
                  <div className="font-cinzel text-[10px] font-bold text-gray-300 border-b border-gothic-border/30 pb-1 uppercase tracking-wider">
                    🕯️ Identity Seals
                  </div>
                  
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-widest text-gothic-gold mb-1.5">
                      Display Name *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gothic-border/60 bg-black/40 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gothic-gold transition-colors font-sans"
                        placeholder="e.g. Ojier"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-widest text-gothic-gold mb-1.5">
                      Email address *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gothic-border/60 bg-black/40 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gothic-gold transition-colors font-sans"
                        placeholder="pilgrim@domain.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-widest text-gothic-gold mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gothic-border/60 bg-black/40 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gothic-gold transition-colors font-sans"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-widest text-gothic-gold mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gothic-border/60 bg-black/40 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gothic-gold transition-colors font-sans"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Customization */}
                <div className="space-y-3.5">
                  <div className="font-cinzel text-[10px] font-bold text-gray-300 border-b border-gothic-border/30 pb-1 uppercase tracking-wider">
                    🏛️ Soul Customization
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-widest text-gothic-gold mb-1.5 flex justify-between items-center">
                      <span>Preferred Name</span>
                      <span className="text-[7.5px] text-gray-500 font-bold">OPTIONAL</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <Award className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={preferredName}
                        onChange={(e) => setPreferredName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gothic-border/60 bg-black/40 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gothic-gold transition-colors font-sans"
                        placeholder="e.g. The Wanderer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-widest text-gothic-gold mb-1.5 flex justify-between items-center">
                      <span>Date of Birth</span>
                      <span className="text-[7.5px] text-gray-500 font-bold">OPTIONAL</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <Calendar className="w-4 h-4" />
                      </span>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full pl-10 pr-4 py-1.5 rounded-lg border border-gothic-border/60 bg-black/40 text-sm text-gray-400 focus:outline-none focus:border-gothic-gold transition-colors font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-widest text-gothic-gold mb-1.5">
                      Timezone alignment
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        <Clock className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gothic-border/60 bg-black/40 text-sm text-gray-400 focus:outline-none focus:border-gothic-gold transition-colors font-sans"
                        placeholder="Detected timezone"
                        required
                      />
                    </div>
                  </div>

                  <div className="rounded-lg bg-black/25 p-3 text-[8px] font-mono text-gray-500 border border-gothic-border/30 uppercase leading-normal tracking-wide">
                    † Standard details regarding address, telephone records, or gender classification are strictly omitted. They carry no weight under the progression of the soul.
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3.5 mt-5 px-3 border border-gothic-gold/70 font-cinzel text-[10px] sm:text-xs tracking-[0.05em] xs:tracking-[0.15em] text-black uppercase bg-gothic-gold hover:bg-gothic-gold/85 disabled:opacity-40 rounded-lg transition-colors cursor-pointer font-bold duration-200 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(200,158,92,0.1)] hover:shadow-[0_4px_20px_rgba(200,158,92,0.2)]"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : <>[ Bind & Register Character ]</>}
              </button>
            </form>

            <div className="mt-8 pt-5 border-t border-gothic-border/40 text-center font-mono text-[10px] uppercase tracking-widest text-gray-500 flex justify-center items-center gap-1.5">
              <span>Return to previous path?</span>
              <button
                onClick={() => handleModeChange('LOGIN')}
                className="text-gothic-gold hover:text-white font-bold transition-colors cursor-pointer"
              >
                Log In
              </button>
            </div>
          </motion.div>
        )}

        {/* SCREEN 4: FORGOT PASSWORD */}
        {mode === 'FORGOT_PASS' && (
          <motion.div 
            key="forgot-password"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-md p-5 xs:p-7 sm:p-8 rounded-2xl border border-gothic-border bg-gothic-card/90 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative z-10 mx-auto"
          >
            <button
              onClick={() => handleModeChange('LOGIN')}
              className="absolute top-6 left-6 text-gray-500 hover:text-gothic-gold transition-colors flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Cancel
            </button>

            <div className="text-center mt-4 mb-6">
              <h2 className="font-cinzel text-lg font-bold tracking-[0.15em] text-white uppercase">
                Temporal Reset
              </h2>
              <div className="h-px w-10 bg-gothic-gold/40 mx-auto mt-2.5" />
            </div>

            {errorStatus && (
              <div className="mb-5 p-3.5 rounded-lg border border-gothic-crimson/30 bg-gothic-crimson/10 text-gothic-gold font-mono text-[10px] uppercase tracking-wider flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-gothic-crimson" />
                <span>{errorStatus}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 rounded-lg border border-emerald-900/30 bg-emerald-950/10 text-emerald-400 font-mono text-[10px] uppercase tracking-wider flex items-center gap-2.5">
                <span>✔ {successMessage}</span>
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="p-3 bg-black/35 rounded-lg text-[9px] font-mono text-gray-500 border border-gothic-border/30 uppercase leading-relaxed mb-4">
                🕯️ To align password seals on sandbox trials, verify thy registered email and enter a new password. The timezone temporal alignment parameter will guarantee verification.
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gothic-gold mb-1.5">
                  Registered Email *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gothic-border/60 bg-black/40 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gothic-gold transition-colors font-sans"
                    placeholder="thy-email@domain.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gothic-gold mb-1.5">
                  Confirm Timezone alignment *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Clock className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gothic-border/60 bg-black/40 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gothic-gold transition-colors font-sans"
                    placeholder="Detected TZ"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[9px] uppercase tracking-widest text-gothic-gold mb-1.5">
                  New Password Signature *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gothic-border/60 bg-black/40 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gothic-gold transition-colors font-sans"
                    placeholder="New Password"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 sm:py-3 mt-4 px-3 border border-gothic-gold font-cinzel text-[10px] sm:text-xs tracking-[0.05em] xs:tracking-[0.15em] text-black uppercase bg-gothic-gold hover:bg-gothic-gold/85 disabled:opacity-40 rounded-lg transition-colors cursor-pointer font-bold duration-200 flex items-center justify-center gap-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin text-black" /> : <>[ Realist Password Reset ]</>}
              </button>
            </form>
          </motion.div>
        )}

        {/* SCREEN 5: GENERATING CHARACTER LOADING */}
        {mode === 'GENERATING_CHAR' && (
          <motion.div 
            key="generating-character"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md p-5 xs:p-8 sm:p-10 rounded-2xl border border-gothic-gold bg-gothic-card/95 shadow-[0_0_50px_rgba(200,158,92,0.1)] text-center relative z-10 mx-auto"
          >
            {/* Immersive glowing spinner */}
            <div className="w-24 h-24 mx-auto mb-10 relative">
              <div className="absolute inset-0 rounded-full border-4 border-gothic-border border-t-gothic-gold animate-spin" />
              <div className="absolute inset-2.5 rounded-full border border-gothic-gold/20 animate-pulse flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-gothic-gold" />
              </div>
            </div>

            <h3 className="font-cinzel text-base sm:text-lg font-bold text-white uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 animate-pulse">
              Fusing Spiritual Records
            </h3>
            <p className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-10">
              The altar of vows inscribe a new pilgrim signature
            </p>

            <div className="space-y-3.5 max-w-xs mx-auto text-left font-mono text-[10px] uppercase tracking-wider text-gray-300">
              {charGenSteps.map((step, idx) => {
                const isActive = charGenStep === idx;
                const isCheck = charGenStep > idx;

                return (
                  <div 
                    key={idx}
                    className={`flex items-center gap-2.5 transition-opacity duration-300 ${isCheck ? 'text-gothic-gold font-bold' : isActive ? 'text-white' : 'opacity-25'}`}
                  >
                    <span>
                      {isCheck ? "✔" : isActive ? "★" : "○"}
                    </span>
                    <span>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* SCREEN 6: WHAT DO YOU WISH TO BECOME (First Campaign Question) */}
        {mode === 'FIRST_ONBOARDING' && (
          <motion.div 
            key="first-onboarding"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-xl p-5 xs:p-7 sm:p-8 rounded-2xl border border-gothic-border bg-gothic-card/90 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative z-10 mx-auto"
          >
            <div className="text-center mt-3 mb-6 sm:mb-8">
              <span className="font-cinzel text-gothic-gold text-[8px] sm:text-[9px] font-bold tracking-[0.2em] sm:tracking-[0.3em] block mb-2 uppercase">
                🕯️ Level 1 Ascendant • Character Configured 🕯️
              </span>
              <h2 className="font-cinzel text-xl xs:text-2xl sm:text-3xl font-black text-white uppercase tracking-[0.05em] sm:tracking-[0.1em] leading-snug">
                What Do You Wish To Become?
              </h2>
              <p className="font-mono text-[9px] uppercase text-gray-500 mt-1.5 tracking-wider">
                State thy primary aspiration to instigate thy first grand campaign path
              </p>
              <div className="h-px w-10 bg-gothic-gold/40 mx-auto mt-2.5" />
            </div>

            {errorStatus && (
              <div className="mb-5 p-3.5 rounded-lg border border-gothic-crimson/30 bg-gothic-crimson/10 text-gothic-gold font-mono text-[10px] uppercase tracking-wider flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-gothic-crimson animate-pulse" />
                <span>{errorStatus}</span>
              </div>
            )}

            {/* Presets Grid */}
            <div className="mb-6 space-y-2">
              <label className="block font-mono text-[9.5px] uppercase tracking-widest text-gothic-gold mb-2.5 selection:bg-transparent">
                Acquire Ancient Pre-designed Covenants:
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presetAspirations.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      setFirstAspiration(p.title);
                    }}
                    className={`p-2.5 sm:p-3 rounded-lg border text-left cursor-pointer transition-all whitespace-normal break-words ${
                      firstAspiration.toLowerCase().includes(p.title.toLowerCase())
                        ? 'border-gothic-gold bg-gothic-gold/10 text-gothic-gold font-bold shadow-[0_0_10px_rgba(200,158,92,0.1)]'
                        : 'border-gothic-border/50 bg-black/20 hover:border-gothic-gold/40 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="font-cinzel text-[10px] uppercase tracking-wider font-bold mb-0.5">
                      {p.title}
                    </div>
                    <div className="font-mono text-[8.5px] sm:text-[8px] text-gray-500 italic uppercase">
                      † {p.rpg}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Textbox */}
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[9.5px] uppercase tracking-widest text-gothic-gold mb-2">
                  Or Forge Thy Custom Soul Aspiration:
                </label>
                <input
                  type="text"
                  value={firstAspiration}
                  onChange={(e) => setFirstAspiration(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gothic-border/60 bg-black/40 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gothic-gold transition-colors font-sans"
                  placeholder="e.g. Master piano, learn ancient Rust coding, complete raw calisthenics..."
                  required
                />
              </div>

              <button
                onClick={handleCreateOnboardCampaign}
                disabled={isLoading || !firstAspiration.trim()}
                className="w-full py-2.5 sm:py-3.5 px-3 border border-gothic-gold font-cinzel text-[10px] sm:text-xs tracking-[0.08em] xs:tracking-[0.15em] text-black uppercase bg-gothic-gold hover:bg-gothic-gold/85 disabled:opacity-30 rounded-lg transition-colors font-semibold sm:font-bold duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_15px_rgba(200,158,92,0.15)]"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin text-black shrink-0" /> : <>[ Plan & Generate Campaign ]</>}
              </button>
            </div>
          </motion.div>
        )}

        {/* SCREEN 7: FIRST CAMPAIGN PREVIEW & SUBMIT */}
        {mode === 'CONFIRM_ONBOARDING' && plannedCampaign && (
          <motion.div 
            key="confirm-onboarding"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="w-full max-w-xl p-4 xs:p-6 sm:p-8 rounded-2xl border border-gothic-gold bg-gothic-card/90 shadow-[0_0_50px_rgba(0,0,0,0.85)] relative z-10 mx-auto"
          >
            <div className="text-center mt-3 mb-5 sm:mb-6">
              <span className="font-cinzel text-gothic-gold text-[8px] sm:text-[9px] font-bold tracking-[0.2em] sm:tracking-[0.3em] block mb-2 uppercase">
                ★ Campaign Formulated ★
              </span>
              <h2 className="font-cinzel text-base xs:text-lg sm:text-2xl font-black text-white uppercase tracking-wider leading-snug">
                {plannedCampaign.name}
              </h2>
              <p className="font-mono text-[8.5px] uppercase text-gothic-gold/80 mt-1.5 tracking-wider italic">
                "{plannedCampaign.difficulty || 'Solemn Curriculum Study Code'}"
              </p>
              <div className="h-px w-10 bg-gothic-gold/40 mx-auto mt-2.5" />
            </div>

            <div className="mb-6 space-y-3 p-4 rounded-xl bg-black/40 border border-gothic-border/50 max-h-60 overflow-y-auto custom-scrollbar text-left">
              <div className="font-cinzel text-[10px] font-bold text-gray-300 uppercase tracking-widest border-b border-gothic-border/30 pb-1.5 mb-2.5 flex items-center gap-2">
                <Award className="w-4 h-4 text-gothic-gold" />
                Covenant Phases Outline (5 Stages)
              </div>

              {plannedCampaign.stages && plannedCampaign.stages.map((stage, idx) => (
                <div key={idx} className="space-y-1 py-1.5 border-b border-gothic-border/10 last:border-0">
                  <div className="font-cinzel text-[9.5px] font-bold text-gothic-gold uppercase tracking-wider flex justify-between">
                    <span>{stage.name || `Phase ${idx + 1}`}</span>
                    <span className="font-mono text-[8px] text-gray-500">Tier {idx + 1}</span>
                  </div>
                  <div className="pl-3.5 space-y-1">
                    {stage.tasks?.map((task, tidx) => (
                      <div key={tidx} className="font-mono text-[8.5px] text-gray-400 uppercase tracking-wider">
                        • {task.title}
                        <span className="block font-sans text-[8px] text-gray-600 normal-case ml-2.5 line-clamp-1 italic">
                          {task.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-black/30 p-3 text-[8.5px] font-mono text-gray-500 border border-gothic-border/30 uppercase leading-relaxed text-center mb-6">
              † Taking this first campaign generates thy immediate progression milestone calendar. Complete these vows daily to bolster attributes.
            </div>

            <button
              onClick={handleFinalAccess}
              className="w-full py-3 sm:py-4 px-3 border border-gothic-gold font-cinzel text-[10px] sm:text-xs tracking-[0.1em] xs:tracking-[0.2em] sm:tracking-[0.25em] text-black uppercase bg-gothic-gold hover:bg-gothic-gold/85 rounded-lg font-bold transition-all duration-300 shadow-[0_0_20px_rgba(200,158,92,0.2)] hover:scale-[1.01] cursor-pointer flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4 shrink-0" /> [ Enter The Path ]
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
