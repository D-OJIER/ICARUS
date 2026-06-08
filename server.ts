import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

function getAIModel() {
  const model = process.env.AI_MODEL;
  if (!model) {
    throw new Error('AI_MODEL is not configured on the server.');
  }
  return model;
}

async function startServer() {
  const app = express();

  app.use(express.json());

  // API Route for AI suggestion
  app.post('/api/ai/suggest', async (req, res) => {
    try {
      const { description } = req.body;
      if (!description || typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({ error: 'Description is required for prophetic formulation.' });
      }

      const apiKey = process.env.AI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'AI_API_KEY is not configured on the server. Please bind it in Settings > Secrets.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'icarus-local',
          }
        }
      });

      const promptStr = `Suggest a dramatic gothic/souls-like/dark fantasy ritualized version of this user-provided task description:\n"${description}"`;

      const response = await ai.models.generateContent({
        model: getAIModel(),
        contents: promptStr,
        config: {
          systemInstruction: "You are an ancient, dramatic high scribe of the Altar of Vows. You translate modern/simple everyday activities and tasks (such as 'walk the dog', 'write a blog post', 'wash dishes', 'study React') into poetic, deep, gothic medieval souls-like RPG vows, trials, and penances. Return a structured JSON response matching the schema. For title, keep it short, intense, dramatic (e.g. 'Feral Companionship Pilgrimage' instead of 'walk the dog'). For description, write immersive gothic prose framing the task's deep ritual importance.",
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "A short, highly artistic souls-like RPG title (max 45 chars)."
              },
              description: {
                type: Type.STRING,
                description: "Atmospheric, immersive medieval-style narrative describing the specific requirement (max 200 chars)."
              },
              difficulty: {
                type: Type.STRING,
                description: "The severity level based on effort.",
                enum: ["Lesser Burden", "Sinuous Vow", "Mortal Penance"]
              },
              category: {
                type: Type.STRING,
                description: "Covenant class.",
                enum: ["Vow", "Trial", "Crusade", "General", "Habit"]
              }
            },
            required: ["title", "description", "difficulty", "category"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Oracle yielded empty silent premonitions.');
      }

      const parsed = JSON.parse(responseText.trim());
      
      // Sanitization matching front-end types
      let difficulty = 'Lesser Burden';
      if (['Lesser Burden', 'Sinuous Vow', 'Mortal Penance'].includes(parsed.difficulty)) {
        difficulty = parsed.difficulty;
      }
      
      let category = 'General';
      if (['Vow', 'Trial', 'Crusade', 'General', 'Habit'].includes(parsed.category)) {
        category = parsed.category;
      }

      return res.json({
        title: parsed.title || 'Solemn Covenant',
        description: parsed.description || 'Deliver thy focused spirit unto final completion. No duty stands negligible.',
        difficulty,
        category
      });

    } catch (error: any) {
      console.error('Error in AI suggest endpoint:', error);
      return res.status(550).json({ error: error.message || 'The Dark Oracle encountered an ethereal void interference. Formulate thy vow manually.' });
    }
  });

  // API Route for planning a structured grand goal
  app.post('/api/ai/plan-goal', async (req, res) => {
    try {
      const { aspiration } = req.body;
      if (!aspiration || typeof aspiration !== 'string' || !aspiration.trim()) {
        return res.status(400).json({ error: 'Goal aspiration is required for progression planning.' });
      }

      const apiKey = process.env.AI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'AI_API_KEY is not configured on the server. Please bind it in Settings > Secrets.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'icarus-local',
          }
        }
      });

      const promptStr = `Analyze this user goal/habit and design a highly engaging, structured progression tree of vows: "${aspiration}"`;

      const response = await ai.models.generateContent({
        model: getAIModel(),
        contents: promptStr,
        config: {
          systemInstruction: `You are the Grand Mentor of the Vow Keepers, an ancient sage.
You convert vague, modern user goals or habits (e.g. "learn Spanish", "get fit", "write a book", "learn guitar") into an immersive, highly engaging, structured, and progression-rich dark fantasy RPG learning curriculum roadmap.

CRITICAL REQUIREMENTS FOR SYSTEM INITIATION:
1. Minimum 5 Progression Phases: Each habit must contain at least 5 stages/phases (each representing consecutive progression/weeks of the habit cycle). The phases MUST be named EXACTLY matching this progression curriculum format (you may append a dramatic gothic context after a colon if desired):
   - Stage 1 name: "Phase 1 — Foundation"
   - Stage 2 name: "Phase 2 — Development"
   - Stage 3 name: "Phase 3 — Application"
   - Stage 4 name: "Phase 4 — Mastery"
   - Stage 5 name: "Phase 5 — Evolution"
   - Feel free to generate additional phases (e.g., Phase 6 — Ascendancy, Phase 7 — Transcendence) if the custom skill/habit requires deeper long-term mastery, but there must NEVER be fewer than 5 phases.

2. Weekly Task Density & Specificity: Every phase stage/week MUST contain at least THREE (3) highly specific, actionable, and detailed tasks. Never generate a single generic instruction (e.g. write "Learn proper hand posture, study basic chord structures, tune strings" rather than just "Practice").
   - Tasks must feel like a rich learning curriculum rather than a dry checklist.
   - For each phase, the task difficulties and requirements should build logically upon tasks from the previous phases, step-by-step transforming a beginner into a master.
   - DayOffset: Distribute the tasks chronologically with appropriate logical 'dayOffset' spacing based on weeks (e.g., Day 1-7 for Stage 1, Day 8-14 for Stage 2, Day 15-21 for Stage 3, Day 22-28 for Stage 4, Day 29-40 for Stage 5+).

3. Focus Areas:
   - Phase 1 (Foundation): Focus on Understanding, Setup, Fundamentals.
   - Phase 2 (Development): Focus on Skill Development, Repetition, Familiarity.
   - Phase 3 (Application): Focus on Application, Real-world usage, Combining skills.
   - Phase 4 (Mastery): Focus on Consistency, Performance improvement, Increased challenge.
   - Phase 5+ (Evolution): Focus on Mastery, Optimization, Advanced techniques, Personal adaptation.

4. Prose Tone & Aesthetics: Translate all modern tools, activities, and practices into evocative gothic, souls-like RPG vows, trials, and penances. Ensure the descriptions are deep, majestic, and atmospheric, while keeping the physical practices specific, practical and actionable.
5. Recommendations: Provide exactly 3 scrolls of advice / recommendations for the user.
6. JSON Output: Return a structured JSON matching the database schema.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "Epic gothic fantasy name of the total aspiration campaign."
              },
              categoryName: {
                type: Type.STRING,
                description: "The covenant domain (e.g., Sonic Alchemy, Iron Ascendancy, Eldritch Scripts)."
              },
              timelineExplanation: {
                type: Type.STRING,
                description: "High-level guidance on the estimated timeframe and training pacing."
              },
              resources: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Three helpful, specific recommended reference sources or manual disciplines."
              },
              stages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: "The phase stage name. Must match exactly 'Phase 1 — Foundation', 'Phase 2 — Development', 'Phase 3 — Application', 'Phase 4 — Mastery', 'Phase 5 — Evolution' respectively. (You may append a suffix like ': Fretboard Invasions' if desired, but the prefix must match exactly)."
                    },
                    lore: {
                      type: Type.STRING,
                      description: "Lore/narrative justification for this level of training."
                    },
                    tasks: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: {
                            type: Type.STRING,
                            description: "Archaic-styled but specific actionable subtask title."
                          },
                          description: {
                            type: Type.STRING,
                            description: "Immersive narrative block explaining the practice requirement."
                          },
                          difficulty: {
                            type: Type.STRING,
                            enum: ["Lesser Burden", "Sinuous Vow", "Mortal Penance"]
                          },
                          category: {
                            type: Type.STRING,
                            enum: ["Vow", "Trial", "Crusade", "General"]
                          },
                          dayOffset: {
                            type: Type.INTEGER,
                            description: "Recommended chronological day index for this task (1 to 40)."
                          }
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

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Ethereal oracle refused to build progression trees.');
      }

      return res.json(JSON.parse(responseText.trim()));

    } catch (error: any) {
      console.error('Error in Goal Plan API:', error);
      return res.status(500).json({ error: error.message || 'The Strategy Sanctum encountered an ethereal fog. Try formulating another aspiration.' });
    }
  });

  // API Route for planning a campaign-style weekly-milestone habit
  app.post('/api/ai/plan-habit', async (req, res) => {
    try {
      const { description } = req.body;
      if (!description || typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({ error: 'Habit description is required to plan thy progression covenant.' });
      }

      const apiKey = process.env.AI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'AI_API_KEY is not configured on the server. Please bind it in Settings > Secrets.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'icarus-local',
          }
        }
      });

      const promptStr = `Plan a spectacular campaign-style dark fantasy Habit Progression for: "${description}"`;

      const response = await ai.models.generateContent({
        model: getAIModel(),
        contents: promptStr,
        config: {
          systemInstruction: `You are the High Alchemist of Habits, a seasoned GM and master of dark fantasy RPG learning systems.
You transform a modern, simple habit (e.g. "read books", "do pushups", "learn guitar", "code React") into an immersive 5-phase learning campaign spanning 40 days.

STRICT DESIGN RULES:
1. Exactly 5 Phases: Each representing consecutive phases/weeks of the 40-day cycle. They MUST be named:
   - Phase 1: "Phase 1 — Foundation" (Days 1 — 7)
   - Phase 2: "Phase 2 — Development" (Days 8 — 14)
   - Phase 3: "Phase 3 — Application" (Days 15 — 21)
   - Phase 4: "Phase 4 — Mastery" (Days 22 — 28)
   - Phase 5: "Phase 5 — Evolution" (Days 29 — 40)
2. Selective Task Density (No clutter/spam): Generate exactly 3 to 5 highly specific, meaningful, and practical tasks per phase (not repeated daily, only scheduled on specific dayOffsets relative to the start of the week).
   - E.g., Phase 1 tasks should have dayOffsets like 2, 4, 6.
   - Phase 2 tasks should have dayOffsets like 9, 11, 13.
   - Phase 3 tasks should have dayOffsets like 16, 18, 20.
   - Phase 4 tasks should have dayOffsets like 23, 25, 27.
   - Phase 5 tasks should have dayOffsets like 30, 33, 36.
   - Ensure these dayOffsets ONLY schedule actual tasks, creating breathing room!
3. Thematic Gothic Aesthetic: Translate modern activities into evocative souls-like lore while keeping the actual task, steps, and exercises clearly understandable.
4. Returns a perfect JSON format matching the schema.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A gorgeous, intense souls-like title for this habit crusade (max 45 chars)." },
              description: { type: Type.STRING, description: "Atmospheric, immersive story context describing the habit's ritual importance." },
              difficulty: { type: Type.STRING, enum: ["Lesser Burden", "Sinuous Vow", "Mortal Penance"] },
              duration: { type: Type.INTEGER, description: "Total days for full completion (always 40)." },
              phases: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Must match standard prefixes exactly: 'Phase 1 — Foundation', 'Phase 2 — Development', 'Phase 3 — Application', 'Phase 4 — Mastery', 'Phase 5 — Evolution'." },
                    range: { type: Type.STRING, description: "E.g., 'Days 1 — 7' for Phase 1, 'Days 8 — 14' for Phase 2." },
                    focus: { type: Type.STRING, description: "Underlying physical/mental discipline focus." },
                    lore: { type: Type.STRING, description: "Narrative justification block indicating stage mastery." },
                    objective: { type: Type.STRING, description: "Weekly milestone goal description." },
                    tasks: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING, description: "Compact gothic-styled actionable subtask title." },
                          description: { type: Type.STRING, description: "Specific physical execution detailing practice routine." },
                          difficulty: { type: Type.STRING, enum: ["Lesser Burden", "Sinuous Vow", "Mortal Penance"] },
                          category: { type: Type.STRING, enum: ["Habit"] },
                          dayOffset: { type: Type.INTEGER, description: "Numerical day code between 1 and 40 (must fall inside the phase's day range)." }
                        },
                        required: ["title", "description", "difficulty", "category", "dayOffset"]
                      }
                    }
                  },
                  required: ["name", "range", "focus", "lore", "objective", "tasks"]
                }
              }
            },
            required: ["title", "description", "difficulty", "duration", "phases"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Ethereal Scribe was quiet.');
      }

      return res.json(JSON.parse(responseText.trim()));

    } catch (error: any) {
      console.error('Error in Habit Plan API:', error);
      // High-quality gothic fallback that handles arbitrary inputs gracefully
      const lower = (req.body.description || '').toLowerCase();
      let activity = 'Pursuit of Flame';
      if (lower.includes('guitar') || lower.includes('music')) activity = 'Learn Guitar';
      else if (lower.includes('workout') || lower.includes('gym')) activity = 'Alchemist Body Forging';
      else if (lower.includes('code') || lower.includes('react')) activity = 'Eldritch Frontend Scripting';
      else if (lower.includes('read') || lower.includes('book')) activity = 'Scroll Devouring';

      const fallback = {
        title: `${activity} Ritual`,
        description: `Deliver thy spirit unto ${activity} across forty trials of persistent focus.`,
        difficulty: 'Sinuous Vow',
        duration: 40,
        phases: [
          {
            name: "Phase 1 — Foundation",
            range: "Days 1 — 7",
            focus: "Establishing Rhythm",
            lore: "Thy journey begins inside the quiet chamber. Cleanse thy schedule of all superficial desires.",
            objective: "Become familiar with the essential mechanics and build initial momentum.",
            tasks: [
              { title: `Initiate Basic ${activity} Steps`, description: "Engage in 20 minutes of fundamental practice and posture alignment.", difficulty: 'Lesser Burden', category: 'Habit', dayOffset: 2 },
              { title: "Calibrate Material Focus", description: "Audit environment, eliminating external interference patterns.", difficulty: 'Lesser Burden', category: 'Habit', dayOffset: 4 },
              { title: "Deliver the First Trial", description: "Complete a full consolidated repetition block to seal Week 1.", difficulty: 'Sinuous Vow', category: 'Habit', dayOffset: 6 }
            ]
          },
          {
            name: "Phase 2 — Development",
            range: "Days 8 — 14",
            focus: "Strengthening Sinew",
            lore: "Foundational fatigue tries thy resolve. Steel thy spirit, for repetition builds calluses.",
            objective: "Introduce complexity and commit to standard repetition thresholds.",
            tasks: [
              { title: "Enhance Volume Intensity", description: "Increase core practice volume to 30 minutes, maintaining pristine alignment.", difficulty: 'Sinuous Vow', category: 'Habit', dayOffset: 9 },
              { title: "Confront Friction Blocks", description: "Solve specific mechanical pain-points and tricky transition errors.", difficulty: 'Lesser Burden', category: 'Habit', dayOffset: 11 },
              { title: "Forge Endurance Limit", description: "Deliver an exhaustive, continuous rehearsal to lock down developmental familiarity.", difficulty: 'Mortal Penance', category: 'Habit', dayOffset: 13 }
            ]
          },
          {
            name: "Phase 3 — Application",
            range: "Days 15 — 21",
            focus: "Synthesized Harmony",
            lore: "The actions begin to feel native. The body flows, translating intent to manifestation.",
            objective: "Integrate smaller parts of thy discipline into a cohesive, flowing structure.",
            tasks: [
              { title: "Flow Pattern Rehearsal", description: "Perform complete, uninterrupted exercise cycles with steady, deep breathing.", difficulty: 'Lesser Burden', category: 'Habit', dayOffset: 16 },
              { title: "Shadow Repetition Trial", description: "Perform practice blocks with zero visual feedback or aids to build sensory intuition.", difficulty: 'Sinuous Vow', category: 'Habit', dayOffset: 18 },
              { title: "Consecrated Integration Run", description: "Complete a full applied master block at full operational pacing.", difficulty: 'Sinuous Vow', category: 'Habit', dayOffset: 20 }
            ]
          },
          {
            name: "Phase 4 — Mastery",
            range: "Days 22 — 28",
            focus: "Overcoming Inertia",
            lore: "A deep lethargy descends as the initial romance fades. Only pure willpower bridges the abyss.",
            objective: "Execute consistently under fatiguing, high-resistance conditions.",
            tasks: [
              { title: "Apex Speed Penance", description: "Execute thy exercises at 110% of standard operational speed to stretch capacity.", difficulty: 'Mortal Penance', category: 'Habit', dayOffset: 23 },
              { title: "Pilgrimage of Consistency", description: "Complete two consecutive back-to-back high intensity review drills.", difficulty: 'Sinuous Vow', category: 'Habit', dayOffset: 25 },
              { title: "Divine Focus Shielding", description: "Sustain complete immersion under simulated environmental clutter.", difficulty: 'Lesser Burden', category: 'Habit', dayOffset: 27 }
            ]
          },
          {
            name: "Phase 5 — Evolution",
            range: "Days 29 — 40",
            focus: "The Unbreakable Union",
            lore: "Thy discipline has become thy master key. The boundaries of the vow dissolve into thy character.",
            objective: "Express the habit as a sovereign, effortless extension of thy soul.",
            tasks: [
              { title: "Advanced Stylistic Refinement", description: "Add personal details, advanced timing adjustments, and creative touch to thy work.", difficulty: 'Sinuous Vow', category: 'Habit', dayOffset: 31 },
              { title: "Inscript a Covenant Legacy", description: "Deliver an elite presentation session from memory to demonstrate complete sovereignty.", difficulty: 'Mortal Penance', category: 'Habit', dayOffset: 35 },
              { title: "Seal final 40-Day Covenant", description: "Deliver thy spirit to absolute absolution through the forty-day threshold.", difficulty: 'Lesser Burden', category: 'Habit', dayOffset: 39 }
            ]
          }
        ]
      };
      return res.json(fallback);
    }
  });

  // API Route for persistent evaluation & customized coaching insights
  app.post('/api/ai/coach', async (req, res) => {
    try {
      const { quests, goals } = req.body;

      const apiKey = process.env.AI_API_KEY;
      if (!apiKey) {
        return res.status(550).json({ error: 'AI_API_KEY is not bound on the server.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'icarus-local',
          }
        }
      });

      const inputContext = {
        activeCovenants: (quests || [])
          .filter((q: any) => !q.completed)
          .map((q: any) => ({ title: q.title, cat: q.category, diff: q.difficulty, due: q.dueDate })),
        absolvedCovenants: (quests || [])
          .filter((q: any) => q.completed)
          .map((q: any) => ({ title: q.title, cat: q.category, diff: q.difficulty })),
        broadCampaigns: (goals || []).map((g: any) => ({ title: g.title, status: g.status }))
      };

      const auditPrompt = `Perform a highly specific, adaptive audit on this penitent person's ledger:\n${JSON.stringify(inputContext)}`;

      const response = await ai.models.generateContent({
        model: getAIModel(),
        contents: auditPrompt,
        config: {
          systemInstruction: `You are the Ancient Grand Examiner of Virtues and Burdens. 
You read the active and completed tasks of the user, detect trends, check for:
- Skipped elements or unbalanced duties,
- Burnout rates (too many high difficulty consecutive or cumulative duties),
- Stale vows or stalled momentum,
- Streak praise, or helpful training guidance relative to the actual names of their completed vs uncompleted duties (e.g. if they completed "Tuning Exercises" but skipped "Barre Chord Pillars", mention these by name directly!).
Return a structured JSON evaluation. Ensure prose is deeply evocative, gothic, souls-themed, and highly personalized. Do NOT output generalities. Speak of their specific duties.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              appraisalTitle: {
                type: Type.STRING,
                description: "Dynamic gothic appraisal status of their soul (e.g., 'Ashen Zealot of the Silver Chord', 'Wandering Zealot seeking Guidance', 'Overburdened Seraph')."
              },
              appraisalContext: {
                type: Type.STRING,
                description: "Engaging 2-3 sentence evocative assessment of their overall progression velocity and current state."
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 highly tailored recommendations referencing their specific duties by name where possible."
              },
              warnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of warning indicators (such as skipped duties, consecutive Mortal Penances, burnout signals, consecutive days trained) or encouragement warnings if clean."
              },
              successProbability: {
                type: Type.INTEGER,
                description: "Confidence percentage (0 to 100) estimated based on completion rates, streaks, and focus intensity."
              }
            },
            required: ["appraisalTitle", "appraisalContext", "recommendations", "warnings", "successProbability"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Mentor remained in silent contemplation.');
      }

      return res.json(JSON.parse(responseText.trim()));

    } catch (error: any) {
      console.error('Error in Coach API:', error);
      return res.status(500).json({ error: 'Ethereal void disrupted the Mentor’s third-eye vision.' });
    }
  });

  // API Route for Day 40 habit cycle review report card
  app.post('/api/ai/habit-report', async (req, res) => {
    try {
      const { rootTitle, completedCount, totalCount, currentStreak, longestStreak, difficulty, averageCompletionRate, totalDaysInvested } = req.body;

      if (!rootTitle) {
        return res.status(400).json({ error: 'Habit Title is required for the final liturgy.' });
      }

      const apiKey = process.env.AI_API_KEY;
      if (!apiKey) {
        return res.status(550).json({ error: 'AI_API_KEY is not configured.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'icarus-local',
          }
        }
      });

      const reportPrompt = `Generate a gothic/dark-fantasy ritualized final 40-day report analysis for this completed habit:
- Title: "${rootTitle}"
- Difficulty Rating: ${difficulty}
- Days Completed: ${completedCount} / ${totalCount}
- Longest Streak: ${longestStreak}
- Current Streak: ${currentStreak}
- Avg. Completion Rate across historic attempts: ${averageCompletionRate}%
- Total Days Invested in this pursuit: ${totalDaysInvested}
`;

      const response = await ai.models.generateContent({
        model: getAIModel(),
        contents: reportPrompt,
        config: {
          systemInstruction: `You are the High Inquisitor of completed Vows.
You draft a detailed mystical, gothic and deep dark-fantasy Performance & Consistency Report analyzing the user's 40-day results.
Choose evocative gothic terminology. Generate:
1. 4 specific, highly customized AI Insights (1-sentence each) referencing the numbers. Examples:
   - "Thy discipline in completing ${completedCount} days has tempered thy blade."
   - "A critical lapse occurred on weekends; prepare thy mental barrier on rest days."
   - "Thy consistency witnessed a spectacular surge after the trials of Day 20."
   - "With a ${averageCompletionRate}% historical success, thy vessel is mature enough to advance to the next high form."
2. An Adherence Score (integer 0 to 100) based on streak consistency and completed days.
3. A Success Probability (integer 0 to 100) indicating details of future progression.
Return a structured JSON response fitting the schema exactly. Keep the tone solemn, noble, encouraging but medieval gothic.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              adherenceScore: {
                type: Type.INTEGER,
                description: "Numerical mastery tier score from 0 to 100 based on consistency."
              },
              successProbability: {
                type: Type.INTEGER,
                description: "Estimated success chance (0 to 100) for further advanced levels of this habit."
              },
              insights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Four deep, atmospheric gothic AI Insights about patterns, weekend lapses, improvements, or preparedness."
              }
            },
            required: ["adherenceScore", "successProbability", ["insights"]]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Ethereal oracle was quiet.');
      }

      return res.json(JSON.parse(responseText.trim()));

    } catch (error: any) {
      console.error('Error generating Habit Report:', error);
      // Fallback response inside the API so client always gets high-quality, fully populated mock data if API limits hit
      const fallbackReport = {
        adherenceScore: Math.round((req.body.completedCount / (req.body.totalCount || 40)) * 100) || 75,
        successProbability: req.body.longestStreak > 10 ? 85 : 60,
        insights: [
          `You completed this divine habit on ${Math.round((req.body.completedCount / (req.body.totalCount || 40)) * 100)}% of your scheduled days.`,
          "Dark forces and weekend lethargy caused occasional lapses in thy sacred vigil.",
          "Thy resilience stabilized remarkably after surviving the first 20 days of tests.",
          "The Grand Scribes declare thy spirit ready for a more arduous, evolved version of this penance."
        ]
      };
      return res.json(fallbackReport);
    }
  });

  // API Route for Conversational Habit Evolution & Intelligent level morphing via Chat in ProgressTab
  app.post('/api/ai/habit-evolve-chat', async (req, res) => {
    const { rootTitle, message, completedCount, totalCount, currentStreak, longestStreak, difficulty, chatHistory } = req.body || {};
    try {
      if (!rootTitle) {
        return res.status(400).json({ error: 'Habit Title is required for chat evolution.' });
      }

      const apiKey = process.env.AI_API_KEY;
      if (!apiKey) {
        return res.status(550).json({ error: 'AI_API_KEY is not configured.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'icarus-local',
          }
        }
      });

      const systemMessage = `You are the High Alchemist and Coach of Habits and Vows.
The user is at the end or in the middle of their habit cycle for "${rootTitle}" and is chatting with you about their progress.
Current habit stats:
- Title: "${rootTitle}"
- Difficulty rating: ${difficulty}
- Days completed: ${completedCount} / ${totalCount}
- Streaks: current: ${currentStreak}, longest: ${longestStreak}

Your duty is to:
1. Interpret their conversational intent/command and classify it as one of the following Actions:
   - "advance" (User wants to make it more complex/intense/harder, progress, raise frequency or numbers)
   - "continue" (User wants to keep practicing at the exact same level of intensity/repetition)
   - "modify" (User wants to alter parameters, reduce difficulty, or tweak specific elements)
   - "replace" (User wants to swap this habit for an entirely different pursuit)
   - "retire" (User has completed, sunsetted, or wants to lay this habit to rest)

2. Formulate a majestic, encouraging, atmospheric gothic alchemical coach response detailing their progress or transformation. Speak with deep medieval mystical wisdom.

3. Provide a proposal containing the classified action and newly designed title, description, and difficulty.

Ensure the reply is evocative, gothic, souls-themed. Keep the response to the point, beautiful, and atmospheric.`;

      const response = await ai.models.generateContent({
        model: getAIModel(),
        contents: `Chat message: "${message || ''}"\nPrevious history: ${JSON.stringify(chatHistory || [])}`,
        config: {
          systemInstruction: systemMessage,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: "The High Alchemist's conversational, evocative medieval feedback response (max 280 chars)."
              },
              proposal: {
                type: Type.OBJECT,
                properties: {
                  action: {
                    type: Type.STRING,
                    enum: ["advance", "continue", "modify", "replace", "retire"],
                    description: "The classified high-level liturgical decision."
                  },
                  newTitle: {
                    type: Type.STRING,
                    description: "A gorgeous, compact gothic/medieval style title for the evolved habit."
                  },
                  newDescription: {
                    type: Type.STRING,
                    description: "A 1-2 sentence immersive dark-fantasy description detailing the new requirement (max 180 chars)."
                  },
                  newDifficulty: {
                    type: Type.STRING,
                    enum: ["Lesser Burden", "Sinuous Vow", "Mortal Penance"],
                    description: "The scaled difficulty based on the evolution."
                  }
                },
                required: ["action", "newTitle", "newDescription", "newDifficulty"]
              }
            },
            required: ["reply", "proposal"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Ethereal void swallowed the chat response.');
      }

      return res.json(JSON.parse(responseText.trim()));

    } catch (error: any) {
      console.error('Error in Habit Evolve Chat API:', error);
      return res.json({
        reply: `Thy words echo in the dark sanctum, Penitent. The alchemical fire of thy intent is recognized. Let us mutate thy "${rootTitle}" into a more noble calling.`,
        proposal: {
          action: 'advance',
          newTitle: `Advanced ${rootTitle} of the Sentinel`,
          newDescription: `Deliver thy spirit unto higher repetitions with rigid daily commitment.`,
          newDifficulty: difficulty === 'Lesser Burden' ? 'Sinuous Vow' : 'Mortal Penance'
        }
      });
    }
  });

  // API Route for Conversational Habit Evolution & Intelligent level morphing
  app.post('/api/ai/habit-evolve', async (req, res) => {
    try {
      const { rootTitle, description, difficulty, completionRate, action, message } = req.body;

      if (!rootTitle) {
        return res.status(400).json({ error: 'Habit Title is required for evolution.' });
      }

      const apiKey = process.env.AI_API_KEY;
      if (!apiKey) {
        return res.status(550).json({ error: 'AI_API_KEY is not configured.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'icarus-local',
          }
        }
      });

      const systemMessage = `You are the High Alchemist of Habits and Vows. 
The user is at the end of a 40-day habit cycle (or interacts with a coach).
Current habit to evolve:
- Title: "${rootTitle}"
- Core Requirement: "${description}"
- Current Difficulty rating: ${difficulty}
- 40-day completion success rate: ${completionRate}%

The user is selecting an action or having a natural language conversation.
- Button selected action: "${action || 'none'}"
- Conversation chat text: "${message || 'No direct chat text'}"

Your duty is to:
1. Interpret their conversational intent/command and classify it as one of the following Actions (or match what they chose):
   - "advance" (User wants to make it more complex/intense, progress from Walk->Jog, raise intensity/numbers. e.g. "make it harder", "level up", "more pushups")
   - "continue" (User wants to keep practicing at this exact same level of intensity/repetition. e.g. "keep going", "do it again")
   - "modify" (User wants to alter the parameters or reduce/increase slightly. e.g. "change difficulty", "make it easier")
   - "replace" (User wants to fully swap this habit for an entirely different pursuit. e.g. "replace it with running", "change it to guitar")
   - "retire" (User wants to complete, sunset, and lay this habit to rest. e.g. "retire it", "I got bored")

2. Dynamically evolve or mutate the habit based on that action context.
   - If "advance": Intelligently increase numbers or step up to a harder form. E.g. "Morning Walk" -> "Morning Jog of the Swift Sentinel", "10 Pushups" -> "20 Pushups", "Meditate 5 mins" -> "Meditate 10 mins". Keep it challenging but proportional to their success probability!
   - If "continue": Keep it the same, perhaps giving it a slightly cooler, seasoned title extension.
   - If "modify": Alter according to their text request, or adjust the difficulty based on their feedback.
   - If "replace": Select a brand new gothic category activity based on what they suggested! E.g. if they say "replace it with running", build a gorgeous running trial.
   - If "retire": Put the habit to rest.

3. Formulate a majestic, encouraging, atmospheric gothic coach response detailing their transformation. State why it transitioned, and read their feedback with deep mystical wisdom. Keep descriptions tight and beautiful.`;

      const response = await ai.models.generateContent({
        model: getAIModel(),
        contents: `Evolve the habit based on user input message: "${message || ''}" and action "${action || 'none'}"`,
        config: {
          systemInstruction: systemMessage,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedAction: {
                type: Type.STRING,
                enum: ["advance", "continue", "modify", "replace", "retire"],
                description: "The classified high-level liturgical decision of the user."
              },
              newTitle: {
                type: Type.STRING,
                description: "A gorgeous, compact gothic/medieval style title for the evolved habit (e.g. 'Morning Jog of the Swift Sentinel', '20 Iron Pushups of the Sentinel')."
              },
              newDescription: {
                type: Type.STRING,
                description: "A 1-2 sentence immersive dark-fantasy description detailing the new ritual requirement (max 180 chars)."
              },
              newDifficulty: {
                type: Type.STRING,
                enum: ["Lesser Burden", "Sinuous Vow", "Mortal Penance"],
                description: "The scaled difficulty based on the evolution."
              },
              coachMessage: {
                type: Type.STRING,
                description: "The High Alchemist's conversational, evocative medieval feedback response (max 280 chars)."
              }
            },
            required: ["detectedAction", "newTitle", "newDescription", "newDifficulty", "coachMessage"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Ethereal void swallowed the alchemical transformation.');
      }

      return res.json(JSON.parse(responseText.trim()));

    } catch (error: any) {
      console.error('Error in Habit Evolve API:', error);
      // Fallback smart rule logic so system works beautifully offline
      const promptText = (req.body.message || '').toLowerCase();
      let actionClass = req.body.action || 'advance';
      
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

      let evolvedTitle = req.body.rootTitle;
      let evolvedDesc = req.body.description;
      let evolvedDiff = req.body.difficulty;
      let coachMsg = `Thy request has been distilled in the crucible. I have updated thy covenant.`;

      if (actionClass === 'advance') {
        evolvedTitle = `Advanced ${req.body.rootTitle} of the Sentinel`;
        evolvedDesc = `${req.body.description} with intensified, deeper vigor and higher repetition thresholds.`;
        evolvedDiff = req.body.difficulty === 'Lesser Burden' ? 'Sinuous Vow' : 'Mortal Penance';
        coachMsg = `You have proven thy metal, Penitent. I have evolved "${req.body.rootTitle}" into a higher form. Walk forth now with a heavier burden, as is the way of the sword.`;
      } else if (actionClass === 'replace') {
        const replaceMatch = promptText.match(/(?:with|to)\s+([a-z0-9\s]{3,20})/);
        const nextActivity = replaceMatch ? replaceMatch[1].trim() : 'Running';
        evolvedTitle = `${nextActivity.charAt(0).toUpperCase() + nextActivity.slice(1)} Pilgrimage`;
        evolvedDesc = `Wander out and conquer thy new calling of ${nextActivity} with rigid daily commitment.`;
        coachMsg = `The old vows are shattered and ground to dust. I have inscribed thy new calling: "${evolvedTitle}". Go forth and build thy flame from this brand new spark!`;
      } else if (actionClass === 'retire') {
        coachMsg = `It is finished. Thy heavy obligation of "${req.body.rootTitle}" has been laid to rest in the Mausoleum of Vows. Walk free of this weight.`;
      } else if (actionClass === 'modify') {
        evolvedDesc = `${req.body.description} (Modified slightly to match thy physical thresholds).`;
        evolvedDiff = 'Lesser Burden';
        coachMsg = `I have adjusted the thresholds of thy trial. A lighter step preserves momentum when the road is steep.`;
      } else {
        coachMsg = `Thy standard cycle is extended. Repetition is the ultimate alchemy of the soul. Practice until the vow becomes second nature.`;
      }

      return res.json({
        detectedAction: actionClass,
        newTitle: evolvedTitle,
        newDescription: evolvedDesc,
        newDifficulty: evolvedDiff,
        coachMessage: coachMsg
      });
    }
  });

  // API Route for comprehensive Character Profile performance assessment
  app.post('/api/ai/profile-assess', async (req, res) => {
    try {
      const { name, title, xp, stats, chronicle, unlockedSkillsCount, unlockedAchievementsCount, completedQuests } = req.body;

      const apiKey = process.env.AI_API_KEY;
      if (!apiKey) {
        return res.status(550).json({ error: 'AI_API_KEY is not configured.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'icarus-local',
          }
        }
      });

      const promptContext = `Character Name: ${name}
Current Title: ${title}
Total XP: ${xp}
Stats Summary: ${JSON.stringify(stats)}
Recent Completed Quests Data: ${JSON.stringify((completedQuests || []).slice(0, 15))}
Skills Unlocked Count: ${unlockedSkillsCount}
Achievements Unlocked Count: ${unlockedAchievementsCount}
Recent Chronicle Entries: ${JSON.stringify((chronicle || []).slice(0, 3))}
`;

      const systemMessage = `You are the Master Alchemist and Soul Evaluator of the Grand Crucible, an ancient Game Master.
You analyze the user's completed quests/trials and current character sheet to decide progression.

CRITICAL GOVERNMENT PRINCIPLES:
1. The user has NO manual power over titles, progression values, stats, or skill tree unlocks. You control everything.
2. Skill Unlocks & Discoveries: Examine recent completed quests. If the user presents substantial proof/evidence of activity, you may choose to unlock or level up a relevant skill node from these accurate system node IDs:
   - 'prog-fund' (Programming Fundamentals)
   - 'prog-java' (Java Sanctuary)
   - 'prog-oop' (OOP & Collections)
   - 'prog-spring' (Spring Boot Castle)
   - 'prog-front' (Frontend Guild)
   - 'prog-react' (React Componentry)
   - 'prog-next' (NextJS Realm)
   - 'prog-ai' (AI Engineering)
   - 'fit-will' (Ritual of Will)
   - 'fit-run' (Swift Sentinel Running)
   - 'fit-strength' (Iron Forging)
   - 'fit-mobility' (Shadow Reflexes)
   - 'fit-nutrition' (Herbology Alchemy)
   - 'dev-wake' (Dawn Vigil)
   - 'dev-time' (Hour Dial Management)
   - 'dev-read' (Scroll Reading studies)
   - 'dev-habit' (Chain of Iron Habits)
   - 'dev-journal' (Annals Inscription)
   If they have done Java quests, unlock 'prog-java'. If Web/UI quests, unlock 'prog-react'. If workouts, unlock 'fit-strength' or 'fit-run'. Return the list of IDs they qualify for in 'unlockedNodeIds'.
3. Title Awarding: Inspect their completed quests and stats. Award exactly ONE of these thematic legendary titles if they fit, or choose another equivalent dramatic dark fantasy title matching their performance:
   - "The Consistent" (requires high frequency/streak of completions)
   - "The Builder" (completed multiple engineering, creation or coding quests)
   - "The Scholar" (completed high studying/reading/learning quests)
   - "The Pathfinder" (completed diverse categories of quests)
   - "The Veteran" (long active history or high milestones)
4. Character Stat Boosts: Allocate up to +3 points in 1-3 attributes based on their actual activities (e.g. if they worked out, raise strength/endurance. If they coded, raise programming/focus).
5. Narrative Evaluation: Write a highly customized, 3-sentence gothic souls-like periodic report card analyze their progress and advising their future steps. Keep the tone majestic and deeply immersive.
Return a structured JSON. Do not include markdown code block formats in the outer body, return pure JSON.`;

      const response = await ai.models.generateContent({
        model: getAIModel(),
        contents: `Evaluate the pilgrim character performance:\n${promptContext}`,
        config: {
          systemInstruction: systemMessage,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              assessment: {
                type: Type.STRING,
                description: "A customized periodic evaluation analyzing stats and balances (max 260 chars)."
              },
              recommendedTitle: {
                type: Type.STRING,
                description: "A brand new legendary earned title based on requirements (e.g. 'The Consistent', 'The Builder', 'The Scholar', 'The Pathfinder', 'The Veteran')."
              },
              unlockedNodeIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of node IDs that should now be unlocked or promoted based on their quest evidence (e.g., ['prog-fund', 'prog-java'])."
              },
              statBoosts: {
                type: Type.OBJECT,
                description: "Key-value of attributes to increment (e.g., {'discipline': 3, 'focus': 2}).",
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

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Ethereal void swallowed the evaluation.');
      }

      return res.json(JSON.parse(responseText.trim()));

    } catch (error: any) {
      console.error('Error in profile-assess API:', error);
      // Perfect fallback response
      return res.json({
        assessment: "Thy discipline in mental studies remains incredibly steadfast, though development of physical fortitude has drifted to silence. Balance thy obligations in the coming days.",
        recommendedTitle: "The Consistent",
        unlockedNodeIds: ["prog-fund"],
        statBoosts: {
          programming: 2,
          discipline: 1
        }
      });
    }
  });

  // ==========================================
  // Serve static files in production vs middleware mode in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gothic Server ignited on http://0.0.0.0:${PORT}`);
  });
}

startServer();
