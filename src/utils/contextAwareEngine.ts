import { Goal, Quest, DarkQuote } from '../types';
import { CharacterProfile } from './progressionUtils';

export interface DayContext {
  date: Date;
  dateStr: string;
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  specialOccasion: string | null;
  historicalSignificance: string | null;
  campaignProgress: 'New' | 'Complete' | 'Ongoing' | 'None';
  streakMilestone: 'High' | 'None';
  skillDiscovery: boolean;
  streak: number;
}

/**
 * Calculates seasonal status based on Gregorian calendar months
 */
export function getSeason(month: number): 'Spring' | 'Summer' | 'Autumn' | 'Winter' {
  // Northern Hemisphere seasons for standard compliance
  // Mar (2), Apr (3), May (4) -> Spring
  if (month >= 2 && month <= 4) return 'Spring';
  // Jun (5), Jul (6), Aug (7) -> Summer
  if (month >= 5 && month <= 7) return 'Summer';
  // Sep (8), Oct (9), Nov (10) -> Autumn
  if (month >= 8 && month <= 10) return 'Autumn';
  // Dec (11), Jan (0), Feb (1) -> Winter
  return 'Winter';
}

/**
 * Determines if today is a special occasion or world observance
 */
export function getSpecialOccasion(date: Date): { occasion: string | null; history: string | null } {
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  // 1. New Year's Day (January 1)
  if (month === 0 && day === 1) {
    return {
      occasion: "New Year's Ascension",
      history: "A celestial synchronization marks the rebirth of the infinite sphere."
    };
  }

  // 2. User/Day of Inception Special (June 8) - Current local date in context
  if (month === 5 && day === 8) {
    return {
      occasion: "The Day of Inception",
      history: "The cosmic alignment honors the spark of the Penitent soul's emergence."
    };
  }

  // 3. Diwali Period (Approx. Oct 20 - Nov 15)
  if ((month === 9 && day >= 20) || (month === 10 && day <= 15)) {
    return {
      occasion: "The Festival of Lantern Embers",
      history: "Unseen lights pierce the deepest obsidian pits, overcoming ancient shadows."
    };
  }

  // 4. Christmas / Midwinter Oasis (December 20 - December 30)
  if (month === 11 && day >= 20 && day <= 30) {
    return {
      occasion: "The Midwinter Sanctuary",
      history: "Eldritch ash cools as warm rune fires bind wandering knights in unity."
    };
  }

  // 5. Solstices & Equinoxes
  if (month === 2 && day >= 19 && day <= 22) {
    return { occasion: "Vernal Equinox", history: "Perfect equilibrium of day and shadow." };
  }
  if (month === 5 && day >= 20 && day <= 22) {
    return { occasion: "Summer Solstice", history: "The zenith of the celestial flame's momentum." };
  }
  if (month === 8 && day >= 21 && day <= 23) {
    return { occasion: "Autumnal Equinox", history: "Balance restored, harvesting the lessons of the climb." };
  }
  if (month === 11 && day >= 20 && day <= 23) {
    return { occasion: "Winter Solstice", history: "The longest twilight, testing the endurance of vows." };
  }

  return { occasion: null, history: null };
}

/**
 * Orchestrates the full Daily DayContext object from state
 */
export function calculateDayContext(
  date: Date,
  goals: Goal[],
  quests: Quest[],
  streak: number,
  profile: CharacterProfile
): DayContext {
  const month = date.getMonth();
  const season = getSeason(month);
  const { occasion, history } = getSpecialOccasion(date);

  // Determine Campaign state
  // New campaign: created in last 48 hours
  const nowMs = Date.now();
  const hasNewCampaign = goals.some(g => {
    try {
      const createdMs = new Date(g.createdAt).getTime();
      return (nowMs - createdMs < 48 * 60 * 60 * 1000) && g.status === 'In Quest';
    } catch {
      return false;
    }
  });

  const hasCompletedCampaign = goals.some(g => g.status === 'Triumphant');

  let campaignProgress: 'New' | 'Complete' | 'Ongoing' | 'None' = 'None';
  if (hasCompletedCampaign) {
    campaignProgress = 'Complete';
  } else if (hasNewCampaign) {
    campaignProgress = 'New';
  } else if (goals.some(g => g.status === 'In Quest')) {
    campaignProgress = 'Ongoing';
  }

  // Determine streak milestones
  const streakMilestone = streak >= 5 ? 'High' : 'None';

  // Determine skill discovery (at least one node unlocked)
  const skillDiscovery = profile.skillTrees.some(tree => 
    tree.nodes.some(node => node.level > 0 || node.status === 'unlocked')
  );

  const formatStr = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return {
    date,
    dateStr: formatStr,
    season,
    specialOccasion: occasion,
    historicalSignificance: history,
    campaignProgress,
    streakMilestone,
    skillDiscovery,
    streak
  };
}

/**
 * Context-Aware Daily and Milestones Quote Generator
 */
export function getContextAwareQuote(context: DayContext, profile: CharacterProfile): DarkQuote {
  // 1. Birthday / Day of Inception
  if (context.specialOccasion === "The Day of Inception") {
    return {
      text: `Penitent ${profile.name}, the stars align to commemorate the hour thy spark was cast into the void. Another cycle coordinates; the geometric framework of thy life grows more complex and beautiful.`,
      author: "The High Oracle of Icarus"
    };
  }

  // 2. New Year's Day
  if (context.specialOccasion === "New Year's Ascension") {
    return {
      text: "Every ascent begins with a single stone laid upon another. The void recedes before the resolve of a new geometric cycle.",
      author: "The Ancient Mason"
    };
  }

  // 3. Christmas Period
  if (context.specialOccasion === "The Midwinter Sanctuary") {
    return {
      text: "Let the warmth of the hearth protect thy spirit from the freezing void. In the gathering of remnants, our vows stay pure.",
      author: "Keeper of Sanctuary"
    };
  }

  // 4. Diwali Period
  if (context.specialOccasion === "The Festival of Lantern Embers") {
    return {
      text: "Light is the absolute geometry that banishes the shadows of doubt. Walk the shining pathway, Ashen Sentinel.",
      author: "Illuminated Scribe"
    };
  }

  // 5. Special progression-based milestones: New Campaign Start!
  if (context.campaignProgress === 'New') {
    return {
      text: "A new name has been added to your Codex. Guard it well, for an unexplored path requires complete and absolute discipline.",
      author: "Altar Ledger"
    };
  }

  // 6. Campaign Complete Milestone
  if (context.campaignProgress === 'Complete') {
    return {
      text: "What was once a distant peak now stands as part of thy foundation. The monuments thy hands have built cannot be shaken.",
      author: "Chronology Pillar"
    };
  }

  // 7. Consistency Streaks
  if (context.streakMilestone === 'High') {
    return {
      text: `A chain of ${context.streak || 5} continuous steps is forged of tempered steel. The path remembers every footstep, even when the traveler falters.`,
      author: "Lurking Void"
    };
  }

  // 8. Seasonal Variations
  switch (context.season) {
    case 'Winter':
      return {
        text: "Endure the cold, for only the heaviest frost tempers the steel of thy vows. True quietude is found beneath the snow.",
        author: "Dismal Merchant"
      };
    case 'Spring':
      return {
        text: "The earth cracked with promises; let thy duties bloom from the ashes of forgotten trials. A seedling pierces obsidian.",
        author: "Weeping Willow"
      };
    case 'Summer':
      return {
        text: "Burn with the intensity of the midday sun, let thy momentum shatter the hollow shadows. Strength is propelled through action.",
        author: "Sun-Drenched obelisk"
      };
    case 'Autumn':
      return {
        text: "The harvest of the soul is written in the consistency of its penance. Reflect upon the architecture of thy balanced stone.",
        author: "Deogracias"
      };
  }
}
