import { GoogleGenAI, Type } from '@google/genai';
import { nativeStorage } from './nativeStorage';

const AI_MODEL = 'gemini-2.5-flash';

// Retrieve API Key from either local settings or environment variables
export function getApiKey(): string | null {
  const localKey = nativeStorage.getItem('gothic_ai_api_key');
  if (localKey && localKey.trim()) return localKey.trim();
  
  // Standard Expo env naming conventions
  if (typeof process !== 'undefined' && process.env) {
    const envKey = (process.env as any).EXPO_PUBLIC_AI_API_KEY || (process.env as any).AI_API_KEY;
    if (envKey && envKey.trim()) return envKey.trim();
  }
  return null;
}

function getClient(): GoogleGenAI | null {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'icarus-standalone',
      }
    }
  });
}

// ==========================================
// 1. Suggest a gothic translation for a task
// ==========================================
export async function generateQuestSuggestions(description: string) {
  const ai = getClient();
  if (!ai) {
    // Return instant gothic fallback
    const lower = description.toLowerCase();
    let title = 'Solemn Covenant';
    let desc = 'Deliver thy focused spirit unto final completion. No duty stands negligible.';
    let difficulty = 'Lesser Burden';
    let category = 'General';

    if (lower.includes('clean') || lower.includes('wash') || lower.includes('dish')) {
      title = 'Purge of the Hearth Cinders';
      desc = 'Wipe clean the defiled instruments of feast. Leave no trace of grease or negligence.';
      difficulty = 'Lesser Burden';
      category = 'Vow';
    } else if (lower.includes('study') || lower.includes('read') || lower.includes('learn') || lower.includes('code')) {
      title = 'Devout Scriptural Devourment';
      desc = 'Pore over the ancient scrolls of knowledge. Absorb their logic until thy mind is tempered.';
      difficulty = 'Sinuous Vow';
      category = 'Trial';
    } else if (lower.includes('run') || lower.includes('gym') || lower.includes('workout') || lower.includes('lift')) {
      title = 'Crucible of Pain and Sinew';
      desc = 'Deliver thy physical vessel unto severe strain. Shatter and forge thy fibers anew.';
      difficulty = 'Mortal Penance';
      category = 'Trial';
    }
    return { title, description: desc, difficulty, category };
  }

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: `Suggest a dramatic gothic/souls-like/dark fantasy ritualized version of this user-provided task description:\n"${description}"`,
      config: {
        systemInstruction: "You are an ancient, dramatic high scribe of the Altar of Vows. You translate modern/simple everyday activities and tasks into poetic, deep, gothic medieval souls-like RPG vows, trials, and penances. Return a structured JSON response matching the schema. For title, keep it short, intense, dramatic (e.g. 'Feral Companionship Pilgrimage' instead of 'walk the dog'). For description, write immersive gothic prose framing the task's deep ritual importance.",
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A short, highly artistic souls-like RPG title (max 45 chars)." },
            description: { type: Type.STRING, description: "Atmospheric, immersive medieval-style narrative describing the specific requirement (max 200 chars)." },
            difficulty: { type: Type.STRING, enum: ["Lesser Burden", "Sinuous Vow", "Mortal Penance"] },
            category: { type: Type.STRING, enum: ["Vow", "Trial", "Crusade", "General", "Habit"] }
          },
          required: ["title", "description", "difficulty", "category"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    throw new Error('Empty response');
  } catch (e) {
    console.warn('AI suggestions error, falling back:', e);
    return {
      title: `Covenant of "${description.substring(0, 20)}"`,
      description: `Commit thy focus and resolve to complete the task: "${description}".`,
      difficulty: 'Lesser Burden',
      category: 'General'
    };
  }
}

// ==========================================
// 2. Plan a structured campaign goal
// ==========================================
export async function generateGoalPlan(aspiration: string, categoryName: string = 'Personal Growth') {
  const ai = getClient();
  if (!ai) {
    // Generate high-quality fallback campaign
    const lower = aspiration.toLowerCase();
    let activity = 'Sovereign Path';
    if (lower.includes('guitar') || lower.includes('music')) activity = 'Sonic Alchemy';
    else if (lower.includes('code') || lower.includes('react') || lower.includes('program')) activity = 'Eldritch Coding Scripts';
    else if (lower.includes('workout') || lower.includes('gym') || lower.includes('run') || lower.includes('fit')) activity = 'Iron Body Forging';

    const fallback = {
      title: `${activity} Crusades`,
      categoryName: categoryName,
      timelineExplanation: "A 40-day campaign divided into 5 progressive stages of training.",
      resources: [
        "Chronicles of the Devout Seekers",
        "Sovereign Grimoire of Practice Guidelines",
        "Daily Ledger of Vigilance"
      ],
      stages: [
        {
          name: "Phase 1 — Foundation",
          lore: "Establish thy balance inside the quiet chamber. Cleanse thy schedule of all distractions.",
          tasks: [
            { title: `Initiate Basic ${activity} Study`, description: "Engage in 20 minutes of fundamental practice and posture alignment.", difficulty: 'Lesser Burden', category: 'Vow', dayOffset: 2 },
            { title: "Calibrate Focus Environment", description: "Audit environment, eliminating external interference patterns.", difficulty: 'Lesser Burden', category: 'Vow', dayOffset: 4 },
            { title: "Deliver the First Trial", description: "Complete a full consolidated repetition block to seal Stage 1.", difficulty: 'Sinuous Vow', category: 'Trial', dayOffset: 6 }
          ]
        },
        {
          name: "Phase 2 — Development",
          lore: "Steel thy spirit, for repetition builds calluses.",
          tasks: [
            { title: "Enhance Volume Intensity", description: "Increase core practice volume to 30 minutes, maintaining pristine alignment.", difficulty: 'Sinuous Vow', category: 'Trial', dayOffset: 9 },
            { title: "Confront Friction Blocks", description: "Solve specific mechanical pain-points and tricky transition errors.", difficulty: 'Lesser Burden', category: 'Vow', dayOffset: 11 },
            { title: "Forge Endurance Limit", description: "Deliver an exhaustive, continuous rehearsal to lock down developmental familiarity.", difficulty: 'Mortal Penance', category: 'Crusade', dayOffset: 13 }
          ]
        },
        {
          name: "Phase 3 — Application",
          lore: "The actions begin to feel native. The body flows, translating intent to manifestation.",
          tasks: [
            { title: "Flow Pattern Rehearsal", description: "Perform complete, uninterrupted exercise cycles with steady, deep breathing.", difficulty: 'Lesser Burden', category: 'Vow', dayOffset: 16 },
            { title: "Shadow Repetition Trial", description: "Perform practice blocks with zero visual feedback or aids to build sensory intuition.", difficulty: 'Sinuous Vow', category: 'Trial', dayOffset: 18 },
            { title: "Consecrated Integration Run", description: "Complete a full applied master block at full operational pacing.", difficulty: 'Sinuous Vow', category: 'Trial', dayOffset: 20 }
          ]
        },
        {
          name: "Phase 4 — Mastery",
          lore: "A deep lethargy descends as the initial romance fades. Only pure willpower bridges the abyss.",
          tasks: [
            { title: "Apex Speed Penance", description: "Execute thy exercises at 110% of standard speed to stretch capacity.", difficulty: 'Mortal Penance', category: 'Crusade', dayOffset: 23 },
            { title: "Pilgrimage of Consistency", description: "Complete two consecutive back-to-back high intensity review drills.", difficulty: 'Sinuous Vow', category: 'Trial', dayOffset: 25 },
            { title: "Divine Focus Shielding", description: "Sustain complete immersion under simulated environmental clutter.", difficulty: 'Lesser Burden', category: 'Vow', dayOffset: 27 }
          ]
        },
        {
          name: "Phase 5 — Evolution",
          lore: "Thy discipline has become thy master key. The boundaries of the vow dissolve into thy character.",
          tasks: [
            { title: "Advanced Stylistic Refinement", description: "Add personal details, advanced timing adjustments, and creative touch to thy work.", difficulty: 'Sinuous Vow', category: 'Trial', dayOffset: 31 },
            { title: "Inscript a Covenant Legacy", description: "Deliver an elite presentation session from memory to demonstrate complete sovereignty.", difficulty: 'Mortal Penance', category: 'Crusade', dayOffset: 35 },
            { title: "Seal final 40-Day Covenant", description: "Deliver thy spirit to absolute absolution through the forty-day threshold.", difficulty: 'Lesser Burden', category: 'Vow', dayOffset: 39 }
          ]
        }
      ]
    };
    return fallback;
  }

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: `Analyze this user goal/habit and design a highly engaging, structured progression tree of vows: "${aspiration}"`,
      config: {
        systemInstruction: `You are the Grand Mentor of the Vow Keepers, an ancient sage. You convert vague, modern user goals or habits into an immersive, highly engaging, structured, and progression-rich dark fantasy RPG learning curriculum roadmap.
STRICT REQUIREMENTS:
1. Minimum 5 Phases: Named EXACTLY Phase 1 — Foundation, Phase 2 — Development, Phase 3 — Application, Phase 4 — Mastery, Phase 5 — Evolution.
2. Weekly Task Density: Every phase must contain at least 3 highly specific, actionable, and detailed tasks.
3. DayOffset: Distribute chronologically between Day 1 and Day 40.
4. Return a structured JSON matching the database schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Epic gothic fantasy name of the total aspiration campaign." },
            categoryName: { type: Type.STRING, description: "The covenant domain (e.g., Sonic Alchemy, Iron Ascendancy, Eldritch Scripts)." },
            timelineExplanation: { type: Type.STRING, description: "High-level guidance on the estimated timeframe and training pacing." },
            resources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Three helpful, specific recommended reference sources." },
            stages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Must start with exactly Phase 1 — Foundation, Phase 2 — Development, Phase 3 — Application, Phase 4 — Mastery, or Phase 5 — Evolution." },
                  lore: { type: Type.STRING, description: "Lore/narrative justification for this level of training." },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING, description: "Archaic-styled actionable subtask title." },
                        description: { type: Type.STRING, description: "Practice requirements narrative." },
                        difficulty: { type: Type.STRING, enum: ["Lesser Burden", "Sinuous Vow", "Mortal Penance"] },
                        category: { type: Type.STRING, enum: ["Vow", "Trial", "Crusade", "General"] },
                        dayOffset: { type: Type.INTEGER, description: "chronological day index (1-40)" }
                      },
                      required: ["title", "description", "difficulty", "category", "dayOffset"]
                    }
                  }
                },
                required: ["name", "lore", "tasks"]
              }
            }
          },
          required: ["title", "categoryName", "timelineExplanation", "resources", "stages"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    throw new Error('Empty response');
  } catch (e) {
    console.warn('AI goal plan error, falling back:', e);
    // Return dynamic fallback
    return {
      title: `Path of the Wanderer: ${aspiration}`,
      categoryName: 'Personal Growth',
      timelineExplanation: 'A customized, manual 5-phase plan of progression.',
      resources: ['Solitary Reflection', 'The Book of Common Trials'],
      stages: [
        {
          name: "Phase 1 — Foundation",
          lore: "Establish thy vigil.",
          tasks: [{ title: `Initiate Basic ${aspiration}`, description: "Establish consistency.", difficulty: 'Lesser Burden', category: 'Vow', dayOffset: 3 }]
        },
        {
          name: "Phase 2 — Development",
          lore: "Repetition tempers the soul.",
          tasks: [{ title: `Develop ${aspiration} mechanics`, description: "Reinforce daily actions.", difficulty: 'Sinuous Vow', category: 'Trial', dayOffset: 10 }]
        },
        {
          name: "Phase 3 — Application",
          lore: "Apply thy focus under pressure.",
          tasks: [{ title: `Apply ${aspiration} exercises`, description: "Integrate skills.", difficulty: 'Sinuous Vow', category: 'Trial', dayOffset: 17 }]
        },
        {
          name: "Phase 4 — Mastery",
          lore: "Survive the dark phases.",
          tasks: [{ title: `Confront high difficulty ${aspiration}`, description: "Push boundaries.", difficulty: 'Mortal Penance', category: 'Crusade', dayOffset: 24 }]
        },
        {
          name: "Phase 5 — Evolution",
          lore: "Sovereignty is earned.",
          tasks: [{ title: `Finalize ${aspiration} legacy`, description: "Inscribe achievements.", difficulty: 'Lesser Burden', category: 'Vow', dayOffset: 35 }]
        }
      ]
    };
  }
}

// ==========================================
// 3. Plan a campaign habit (40 days)
// ==========================================
export async function generateHabitPlan(description: string) {
  // Habit and goal planning share prompts, but habit specifically enforces a 40-day loop.
  return generateGoalPlan(description, 'Habit Crusade');
}

// ==========================================
// 4. Perform structured coaching audit
// ==========================================
export async function generateCoachingAudit(quests: any[], goals: any[]) {
  const ai = getClient();
  if (!ai) {
    // Fallback response
    return {
      appraisalTitle: 'Ashen Wanderer in Contemplation',
      appraisalContext: 'Thy ledger contains both active covenants and completed vows. Your balance is steady, but higher trials await in the shadows.',
      recommendations: [
        'Engage in a Mortal Penance to test thy willpower bounds.',
        'Review thy pending vowing schedule to eliminate overlapping due dates.',
        'Consolidate thy daily exercises at the Bonfire to restore spiritual stamina.'
      ],
      warnings: [
        'Several perpetual covenants remain pending; inscribe due dates to commit them to time.',
        'Beware of weekend lethargy. Shield thy flame early.'
      ],
      successProbability: 75
    };
  }

  const inputContext = {
    activeCovenants: quests.filter(q => !q.completed).map(q => ({ title: q.title, cat: q.category, diff: q.difficulty, due: q.dueDate })),
    absolvedCovenants: quests.filter(q => q.completed).map(q => ({ title: q.title, cat: q.category, diff: q.difficulty })),
    broadCampaigns: goals.map(g => ({ title: g.title, status: g.status }))
  };

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: `Perform a highly specific, adaptive audit on this penitent person's ledger:\n${JSON.stringify(inputContext)}`,
      config: {
        systemInstruction: `You are the Ancient Grand Examiner of Virtues and Burdens. You read the active and completed tasks of the user, detect trends, check for: skipped elements, burnout, stale momentum, or streak values. Return a structured JSON evaluation. Ensure prose is evocative, gothic, souls-themed, and references specific duties by name.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            appraisalTitle: { type: Type.STRING, description: "Gothic appraisal status of their soul." },
            appraisalContext: { type: Type.STRING, description: "Evocative assessment of overall progression." },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 tailored recommendations." },
            warnings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of warning indicators or encouragement." },
            successProbability: { type: Type.INTEGER, description: "Confidence percentage (0 to 100)." }
          },
          required: ["appraisalTitle", "appraisalContext", "recommendations", "warnings", "successProbability"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    throw new Error('Empty response');
  } catch (e) {
    console.warn('AI coach error, falling back:', e);
    return {
      appraisalTitle: 'Ashen Zealot seeking Guidance',
      appraisalContext: 'The Dark Oracle encountered an ethereal void interference. Thy soul path remains stable under manual supervision.',
      recommendations: [
        'Maintain daily routines consistently.',
        'Review thy active campaign objectives weekly.',
        'Inscribe a new vow in thy diary today.'
      ],
      warnings: ['Ethereal void disrupted direct mental vision.'],
      successProbability: 60
    };
  }
}

// ==========================================
// 5. Generate final habit report (40 days)
// ==========================================
export async function generateHabitReport(data: {
  rootTitle: string;
  completedCount: number;
  totalCount: number;
  currentStreak: number;
  longestStreak: number;
  difficulty: string;
  averageCompletionRate: number;
  totalDaysInvested: number;
}) {
  const ai = getClient();
  if (!ai) {
    return {
      adherenceScore: Math.round((data.completedCount / (data.totalCount || 40)) * 100) || 75,
      successProbability: data.longestStreak > 10 ? 85 : 60,
      insights: [
        `You completed this divine habit on ${Math.round((data.completedCount / (data.totalCount || 40)) * 100)}% of your scheduled days.`,
        "Dark forces and weekend lethargy caused occasional lapses in thy sacred vigil.",
        "Thy resilience stabilized remarkably after surviving the first 20 days of tests.",
        "The Grand Scribes declare thy spirit ready for a more arduous, evolved version of this penance."
      ]
    };
  }

  const reportPrompt = `Generate a gothic/dark-fantasy ritualized final 40-day report analysis for this completed habit:
- Title: "${data.rootTitle}"
- Difficulty Rating: ${data.difficulty}
- Days Completed: ${data.completedCount} / ${data.totalCount}
- Longest Streak: ${data.longestStreak}
- Current Streak: ${data.currentStreak}
- Avg. Completion Rate across historic attempts: ${data.averageCompletionRate}%
- Total Days Invested in this pursuit: ${data.totalDaysInvested}
`;

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: reportPrompt,
      config: {
        systemInstruction: `You are the High Inquisitor of completed Vows. You draft a detailed performance & consistency report card. Return JSON matching the schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            adherenceScore: { type: Type.INTEGER, description: "Mastery tier score from 0 to 100." },
            successProbability: { type: Type.INTEGER, description: "Estimated success chance for future levels." },
            insights: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Four deep gothic AI Insights." }
          },
          required: ["adherenceScore", "successProbability", "insights"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    throw new Error('Empty response');
  } catch (e) {
    console.warn('AI report error, falling back:', e);
    return {
      adherenceScore: 70,
      successProbability: 65,
      insights: [
        `Completed ${data.completedCount} trials. Thy resilience was marked in the records.`,
        'Prepare thy mind for weekend lapses.',
        'Ascension is near.'
      ]
    };
  }
}

// ==========================================
// 6. Conversational habit evolution
// ==========================================
export async function generateHabitEvolveChat(data: {
  rootTitle: string;
  message: string;
  completedCount: number;
  totalCount: number;
  currentStreak: number;
  longestStreak: number;
  difficulty: string;
  chatHistory: any[];
}) {
  const ai = getClient();
  if (!ai) {
    return {
      reply: `Thy words echo in the dark sanctum, Penitent. The alchemical fire of thy intent is recognized. Let us mutate thy "${data.rootTitle}" into a more noble calling.`,
      proposal: {
        action: 'advance',
        newTitle: `Advanced ${data.rootTitle} of the Sentinel`,
        newDescription: `Deliver thy spirit unto higher repetitions with rigid daily commitment.`,
        newDifficulty: data.difficulty === 'Lesser Burden' ? 'Sinuous Vow' : 'Mortal Penance'
      }
    };
  }

  const systemMessage = `You are the High Alchemist and Coach of Habits and Vows.
The user is at the end or in the middle of their habit cycle for "${data.rootTitle}" and is chatting with you about their progress.
Your duty is to:
1. Interpret their conversational intent/command and classify it as one of the following Actions:
   - "advance" (User wants to make it harder, progress, raise frequency/numbers)
   - "continue" (User wants to keep practicing at the same level)
   - "modify" (User wants to alter parameters/tweak details)
   - "replace" (User wants to swap for a different pursuit)
   - "retire" (User wants to layout/complete/sunset this habit)
2. Formulate a majestic, encouraging, atmospheric gothic alchemical coach response.
3. Provide a proposal containing the action, new title, description, and difficulty.`;

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: `Chat message: "${data.message}"\nPrevious history: ${JSON.stringify(data.chatHistory || [])}`,
      config: {
        systemInstruction: systemMessage,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: "Gothic feedback response (max 280 chars)." },
            proposal: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING, enum: ["advance", "continue", "modify", "replace", "retire"] },
                newTitle: { type: Type.STRING, description: "Gothic style title for the evolved habit." },
                newDescription: { type: Type.STRING, description: "1-2 sentence description of new requirements." },
                newDifficulty: { type: Type.STRING, enum: ["Lesser Burden", "Sinuous Vow", "Mortal Penance"] }
              },
              required: ["action", "newTitle", "newDescription", "newDifficulty"]
            }
          },
          required: ["reply", "proposal"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    throw new Error('Empty response');
  } catch (e) {
    console.warn('AI evolve chat error, falling back:', e);
    return {
      reply: `The shadow of thy vigil is acknowledged. Let us evolve thy trial: "${data.rootTitle}".`,
      proposal: {
        action: 'advance',
        newTitle: `Tempered ${data.rootTitle}`,
        newDescription: `Extend thy daily practice thresholds under a heavier discipline.`,
        newDifficulty: data.difficulty === 'Lesser Burden' ? 'Sinuous Vow' : 'Mortal Penance'
      }
    };
  }
}

export async function generateHabitEvolve(data: {
  rootTitle: string;
  description: string;
  difficulty: string;
  completionRate: number;
  action: string;
  message: string;
}) {
  const ai = getClient();
  if (!ai) {
    const promptText = (data.message || '').toLowerCase();
    let actionClass = data.action || 'advance';
    
    if (promptText.includes('hard') || promptText.includes('advance') || promptText.includes('more') || promptText.includes('level up')) {
      actionClass = 'advance';
    } else if (promptText.includes('keep') || promptText.includes('continue') || promptText.includes('same')) {
      actionClass = 'continue';
    } else if (promptText.includes('easy') || promptText.includes('reduce') || promptText.includes('less') || promptText.includes('modify')) {
      actionClass = 'modify';
    } else if (promptText.includes('replace') || promptText.includes('change') || promptText.includes('instead')) {
      actionClass = 'replace';
    } else if (promptText.includes('retire') || promptText.includes('quit') || promptText.includes('stop') || promptText.includes('bored')) {
      actionClass = 'retire';
    }

    let evolvedTitle = data.rootTitle;
    let evolvedDesc = data.description;
    let evolvedDiff = data.difficulty;
    let coachMsg = `Thy request has been distilled in the crucible. I have updated thy covenant.`;

    if (actionClass === 'advance') {
      evolvedTitle = `Advanced ${data.rootTitle} of the Sentinel`;
      evolvedDesc = `${data.description} with intensified, deeper vigor and higher repetition thresholds.`;
      evolvedDiff = data.difficulty === 'Lesser Burden' ? 'Sinuous Vow' : 'Mortal Penance';
      coachMsg = `You have proven thy metal, Penitent. I have evolved "${data.rootTitle}" into a higher form. Walk forth now with a heavier burden, as is the way of the sword.`;
    } else if (actionClass === 'replace') {
      const replaceMatch = promptText.match(/(?:with|to)\s+([a-z0-9\s]{3,20})/);
      const nextActivity = replaceMatch ? replaceMatch[1].trim() : 'Running';
      evolvedTitle = `${nextActivity.charAt(0).toUpperCase() + nextActivity.slice(1)} Pilgrimage`;
      evolvedDesc = `Wander out and conquer thy new calling of ${nextActivity} with rigid daily commitment.`;
      coachMsg = `The old vows are shattered and ground to dust. I have inscribed thy new calling: "${evolvedTitle}". Go forth and build thy flame from this brand new spark!`;
    } else if (actionClass === 'retire') {
      coachMsg = `It is finished. Thy heavy obligation of "${data.rootTitle}" has been laid to rest in the Mausoleum of Vows. Walk free of this weight.`;
    } else if (actionClass === 'modify') {
      evolvedDesc = `${data.description} (Modified slightly to match thy physical thresholds).`;
      evolvedDiff = 'Lesser Burden';
      coachMsg = `I have adjusted the thresholds of thy trial. A lighter step preserves momentum when the road is steep.`;
    } else {
      coachMsg = `Thy standard cycle is extended. Repetition is the ultimate alchemy of the soul. Practice until the vow becomes second nature.`;
    }

    return {
      detectedAction: actionClass,
      newTitle: evolvedTitle,
      newDescription: evolvedDesc,
      newDifficulty: evolvedDiff,
      coachMessage: coachMsg
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: `Evolve the habit based on user input message: "${data.message}" and action "${data.action}"`,
      config: {
        systemInstruction: `You are the High Alchemist of Habits and Vows. The user is at the end of a 40-day habit cycle. Interpret request, classify to: advance, continue, modify, replace, or retire. Return JSON matching schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedAction: { type: Type.STRING, enum: ["advance", "continue", "modify", "replace", "retire"] },
            newTitle: { type: Type.STRING },
            newDescription: { type: Type.STRING },
            newDifficulty: { type: Type.STRING, enum: ["Lesser Burden", "Sinuous Vow", "Mortal Penance"] },
            coachMessage: { type: Type.STRING }
          },
          required: ["detectedAction", "newTitle", "newDescription", "newDifficulty", "coachMessage"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    throw new Error('Empty response');
  } catch (e) {
    console.warn('AI evolve error, falling back:', e);
    return {
      detectedAction: 'continue',
      newTitle: data.rootTitle,
      newDescription: data.description,
      newDifficulty: data.difficulty,
      coachMessage: 'The alchemical flames are still burning. Continue thy vigil.'
    };
  }
}

// ==========================================
// 7. Periodic character performance assessment
// ==========================================
export async function generateProfileAssessment(data: {
  name: string;
  title: string;
  xp: number;
  stats: any;
  chronicle: any[];
  unlockedSkillsCount: number;
  unlockedAchievementsCount: number;
  completedQuests: any[];
}) {
  const ai = getClient();
  if (!ai) {
    return {
      assessment: "Thy discipline in mental studies remains incredibly steadfast, though development of physical fortitude has drifted to silence. Balance thy obligations in the coming days.",
      recommendedTitle: "The Consistent",
      unlockedNodeIds: ["prog-fund"],
      statBoosts: {
        programming: 2,
        discipline: 1
      }
    };
  }

  const promptContext = `Character Name: ${data.name}
Current Title: ${data.title}
Total XP: ${data.xp}
Stats Summary: ${JSON.stringify(data.stats)}
Recent Completed Quests Data: ${JSON.stringify((data.completedQuests || []).slice(0, 15))}
Skills Unlocked Count: ${data.unlockedSkillsCount}
Achievements Unlocked Count: ${data.unlockedAchievementsCount}
Recent Chronicle Entries: ${JSON.stringify((data.chronicle || []).slice(0, 3))}
`;

  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: `Evaluate the pilgrim character performance:\n${promptContext}`,
      config: {
        systemInstruction: `You are the Master Alchemist and Soul Evaluator of the Grand Crucible, an ancient Game Master. Analyze quests and current sheet to decide progression.
RULES:
1. Skills Unlocked: Return list of node IDs they qualify for in 'unlockedNodeIds' (e.g. 'prog-java', 'prog-react', 'fit-strength', 'fit-run', 'dev-wake', 'dev-time').
2. Title Awarding: Award exactly ONE thematic title (e.g. 'The Consistent', 'The Builder', 'The Scholar', 'The Pathfinder', 'The Veteran').
3. Boost stats: Allocate up to +3 points based on activities.
Return JSON matching schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assessment: { type: Type.STRING, description: "Custom periodic evaluation analysis (max 260 chars)." },
            recommendedTitle: { type: Type.STRING, description: "Legendary title earned." },
            unlockedNodeIds: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of node IDs to unlock." },
            statBoosts: {
              type: Type.OBJECT,
              properties: {
                strength: { type: Type.INTEGER },
                endurance: { type: Type.INTEGER },
                discipline: { type: Type.INTEGER },
                recovery: { type: Type.INTEGER },
                focus: { type: Type.INTEGER },
                consistency: { type: Type.INTEGER },
                learningSpeed: { type: Type.INTEGER },
                resilience: { type: Type.INTEGER },
                programming: { type: Type.INTEGER },
                mathematics: { type: Type.INTEGER },
                finance: { type: Type.INTEGER },
                communication: { type: Type.INTEGER },
                creativity: { type: Type.INTEGER },
                leadership: { type: Type.INTEGER },
                networking: { type: Type.INTEGER },
                collaboration: { type: Type.INTEGER }
              }
            }
          },
          required: ["assessment", "recommendedTitle", "statBoosts", "unlockedNodeIds"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text.trim());
    }
    throw new Error('Empty response');
  } catch (e) {
    console.warn('AI profile assess error, falling back:', e);
    return {
      assessment: 'The Master Alchemist observes thy strides. Keep thy daily vigilance.',
      recommendedTitle: data.title || 'The Wanderer',
      unlockedNodeIds: [],
      statBoosts: { consistency: 1 }
    };
  }
}
