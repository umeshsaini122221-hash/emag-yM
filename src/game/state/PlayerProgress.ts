import { MapId, GameMode, RankTier } from '../types';

export interface StoreItem {
  id: string;
  name: string;
  category: 'outfit' | 'weapon' | 'backpack' | 'parachute' | 'avatar';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  priceCredits: number;
  priceDiamonds: number;
  description: string;
  previewColor: string;
  accentColor: string;
  colors?: { suit: number; armor: number; visor: number };
}

export interface MissionItem {
  id: string;
  title: string;
  desc: string;
  target: number;
  current: number;
  rewardCredits: number;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
}

export interface DailyReward {
  day: number;
  title: string;
  rewardText: string;
  credits: number;
  diamonds: number;
  unlockedItem?: string;
}

export interface PlayerData {
  displayName: string;
  level: number;
  xp: number;
  credits: number;
  diamonds: number;
  rank: RankTier;
  rankPoints: number;
  totalMatches: number;
  totalKills: number;
  totalWins: number;
  selectedMap: MapId;
  selectedMode: GameMode;
  equippedOutfit: string;
  equippedWeaponWrap: string;
  equippedBackpack: string;
  equippedAvatar: string;
  ownedItemIds: string[];
  lastClaimDate: string;
  claimedLoginDays: number[];
  missions: MissionItem[];
  passTier: number;
  passXp: number;
  hasPremiumPass: boolean;
  claimedPassTiers: number[];
}

export const STORE_CATALOG: StoreItem[] = [
  // Outfits
  {
    id: 'outfit_shadow',
    name: 'Tactical Shadow Operator',
    category: 'outfit',
    rarity: 'Common',
    priceCredits: 0,
    priceDiamonds: 0,
    description: 'Standard issue composite stealth recon gear.',
    previewColor: '#1e293b',
    accentColor: '#06b6d4',
    colors: { suit: 0x1e293b, armor: 0x334155, visor: 0x06b6d4 },
  },
  {
    id: 'outfit_rajput',
    name: 'Royal Rajput Commander',
    category: 'outfit',
    rarity: 'Legendary',
    priceCredits: 850,
    priceDiamonds: 0,
    description: 'Gold-embossed royal crimson armor honoring Indian warrior heritage.',
    previewColor: '#991b1b',
    accentColor: '#f59e0b',
    colors: { suit: 0x831843, armor: 0xb91c1c, visor: 0xfbbf24 },
  },
  {
    id: 'outfit_nomad',
    name: 'Desert Nomad Vanguard',
    category: 'outfit',
    rarity: 'Rare',
    priceCredits: 450,
    priceDiamonds: 0,
    description: 'Sandstone desert combat chassis crafted for Rajasthan sandstorms.',
    previewColor: '#78350f',
    accentColor: '#d97706',
    colors: { suit: 0x451a03, armor: 0xb45309, visor: 0xfef08a },
  },
  {
    id: 'outfit_cyber',
    name: 'Neo Cyber Commando',
    category: 'outfit',
    rarity: 'Epic',
    priceCredits: 650,
    priceDiamonds: 0,
    description: 'Electric violet composite exoskeleton with hyper-luminescent visor.',
    previewColor: '#4c1d95',
    accentColor: '#a855f7',
    colors: { suit: 0x2e1065, armor: 0x7e22ce, visor: 0xc084fc },
  },

  // Weapon Wraps
  {
    id: 'wrap_default',
    name: 'Matte Obsidian AR',
    category: 'weapon',
    rarity: 'Common',
    priceCredits: 0,
    priceDiamonds: 0,
    description: 'Standard factory dark nitride finish.',
    previewColor: '#1e293b',
    accentColor: '#64748b',
  },
  {
    id: 'wrap_dragon',
    name: 'Crimson Dragon Blaze',
    category: 'weapon',
    rarity: 'Legendary',
    priceCredits: 700,
    priceDiamonds: 0,
    description: 'Forged with molten red and gold energy conduits.',
    previewColor: '#dc2626',
    accentColor: '#f59e0b',
  },
  {
    id: 'wrap_gold',
    name: 'Golden Sovereign Luxury',
    category: 'weapon',
    rarity: 'Epic',
    priceCredits: 550,
    priceDiamonds: 0,
    description: 'Polished 24k gold leaf inlay with custom muzzle crest.',
    previewColor: '#d97706',
    accentColor: '#fde047',
  },
  {
    id: 'wrap_desert',
    name: 'Dune Striker Camo',
    category: 'weapon',
    rarity: 'Rare',
    priceCredits: 350,
    priceDiamonds: 0,
    description: 'Tactical arid tan camouflage for desert engagements.',
    previewColor: '#b45309',
    accentColor: '#fef3c7',
  },

  // Backpacks
  {
    id: 'pack_titan',
    name: 'Titan Core Energy Rig',
    category: 'backpack',
    rarity: 'Epic',
    priceCredits: 400,
    priceDiamonds: 0,
    description: 'Compact fusion cell power pack with dual emergency thrusters.',
    previewColor: '#0f172a',
    accentColor: '#10b981',
  },
  {
    id: 'pack_scout',
    name: 'Recon Field Carrier',
    category: 'backpack',
    rarity: 'Rare',
    priceCredits: 250,
    priceDiamonds: 0,
    description: 'Lightweight tactical survival frame with rapid access pouches.',
    previewColor: '#334155',
    accentColor: '#38bdf8',
  },

  // Avatars
  {
    id: 'avatar_tiger',
    name: 'Bengal Tiger Insignia',
    category: 'avatar',
    rarity: 'Epic',
    priceCredits: 200,
    priceDiamonds: 0,
    description: 'Fierce Bengal tiger crest of royal courage.',
    previewColor: '#ea580c',
    accentColor: '#fed7aa',
  },
  {
    id: 'avatar_falcon',
    name: 'Desert Falcon Sigil',
    category: 'avatar',
    rarity: 'Rare',
    priceCredits: 150,
    priceDiamonds: 0,
    description: 'Sharp-eyed raptor emblem representing precision aim.',
    previewColor: '#0284c7',
    accentColor: '#bae6fd',
  },
];

export const DAILY_LOGIN_REWARDS: DailyReward[] = [
  { day: 1, title: 'Day 1: Recruit Bonus', rewardText: '+200 Credits', credits: 200, diamonds: 0 },
  { day: 2, title: 'Day 2: Ammo Supply', rewardText: '+250 Credits', credits: 250, diamonds: 0 },
  { day: 3, title: 'Day 3: Battle Pass XP', rewardText: '+300 Credits & 20 Diamonds', credits: 300, diamonds: 20 },
  { day: 4, title: 'Day 4: Tactical Drop', rewardText: '+350 Credits', credits: 350, diamonds: 0 },
  { day: 5, title: 'Day 5: Diamond Cache', rewardText: '+400 Credits & 30 Diamonds', credits: 400, diamonds: 30 },
  { day: 6, title: 'Day 6: Elite Token', rewardText: '+500 Credits', credits: 500, diamonds: 0 },
  { day: 7, title: 'Day 7: Royal Rajput Outfit', rewardText: 'Royal Rajput Skin!', credits: 500, diamonds: 50, unlockedItem: 'outfit_rajput' },
];

const DEFAULT_MISSIONS: MissionItem[] = [
  {
    id: 'm_first_blood',
    title: 'First Blood',
    desc: 'Eliminate at least 1 enemy bot in combat',
    target: 1,
    current: 0,
    rewardCredits: 150,
    rewardXp: 50,
    completed: false,
    claimed: false,
  },
  {
    id: 'm_sharpshooter',
    title: 'Precision Marksman',
    desc: 'Eliminate 3 enemy bots across any map',
    target: 3,
    current: 0,
    rewardCredits: 300,
    rewardXp: 100,
    completed: false,
    claimed: false,
  },
  {
    id: 'm_field_medic',
    title: 'Field Triage',
    desc: 'Collect 2 medical kits from the island',
    target: 2,
    current: 0,
    rewardCredits: 180,
    rewardXp: 60,
    completed: false,
    claimed: false,
  },
  {
    id: 'm_explorer',
    title: 'Island Deployment',
    desc: 'Complete 1 full battle royale deployment',
    target: 1,
    current: 0,
    rewardCredits: 200,
    rewardXp: 80,
    completed: false,
    claimed: false,
  },
  {
    id: 'm_survivor',
    title: 'Apex Survivor',
    desc: 'Survive combat without being eliminated',
    target: 1,
    current: 0,
    rewardCredits: 250,
    rewardXp: 120,
    completed: false,
    claimed: false,
  },
];

const STORAGE_KEY = 'aegis_horizon_progress_v2';

export class PlayerProgressManager {
  public data: PlayerData;

  constructor() {
    this.data = this.loadData();
    this.checkDailyLoginEligibility();
  }

  private loadData(): PlayerData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...this.getDefaultData(),
          ...parsed,
          missions: parsed.missions || DEFAULT_MISSIONS,
        };
      }
    } catch {
      // fallback
    }
    return this.getDefaultData();
  }

  private getDefaultData(): PlayerData {
    return {
      displayName: 'Operator-7',
      level: 1,
      xp: 45,
      credits: 1200, // Pre-seeded with generous balance for instant Store testing!
      diamonds: 60,
      rank: 'Bronze',
      rankPoints: 180,
      totalMatches: 0,
      totalKills: 0,
      totalWins: 0,
      selectedMap: 'india',
      selectedMode: 'solo_practice',
      equippedOutfit: 'outfit_shadow',
      equippedWeaponWrap: 'wrap_default',
      equippedBackpack: 'pack_titan',
      equippedAvatar: 'avatar_tiger',
      ownedItemIds: ['outfit_shadow', 'wrap_default', 'pack_titan', 'avatar_tiger'],
      lastClaimDate: '',
      claimedLoginDays: [],
      missions: JSON.parse(JSON.stringify(DEFAULT_MISSIONS)),
      passTier: 3,
      passXp: 150,
      hasPremiumPass: false,
      claimedPassTiers: [1],
    };
  }

  public save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Ignore storage errors
    }
  }

  public getData(): PlayerData {
    return this.data;
  }

  public setMap(mapId: MapId) {
    this.data.selectedMap = mapId;
    this.save();
  }

  public setMode(mode: GameMode) {
    this.data.selectedMode = mode;
    this.save();
  }

  public buyItem(item: StoreItem): { success: boolean; message: string } {
    if (this.data.ownedItemIds.includes(item.id)) {
      return { success: false, message: 'Item is already in your Vault!' };
    }

    if (item.priceDiamonds > 0) {
      if (this.data.diamonds < item.priceDiamonds) {
        return { success: false, message: 'Insufficient Battle Diamonds!' };
      }
      this.data.diamonds -= item.priceDiamonds;
    } else {
      if (this.data.credits < item.priceCredits) {
        return { success: false, message: 'Insufficient Aegis Credits! Complete matches to earn more.' };
      }
      this.data.credits -= item.priceCredits;
    }

    this.data.ownedItemIds.push(item.id);

    // Auto-equip purchased item
    if (item.category === 'outfit') this.data.equippedOutfit = item.id;
    if (item.category === 'weapon') this.data.equippedWeaponWrap = item.id;
    if (item.category === 'backpack') this.data.equippedBackpack = item.id;
    if (item.category === 'avatar') this.data.equippedAvatar = item.id;

    this.save();
    return { success: true, message: `Acquired & equipped ${item.name}!` };
  }

  public equipItem(item: StoreItem) {
    if (!this.data.ownedItemIds.includes(item.id)) return;
    if (item.category === 'outfit') this.data.equippedOutfit = item.id;
    if (item.category === 'weapon') this.data.equippedWeaponWrap = item.id;
    if (item.category === 'backpack') this.data.equippedBackpack = item.id;
    if (item.category === 'avatar') this.data.equippedAvatar = item.id;
    this.save();
  }

  public claimDailyLogin(dayNumber: number): { success: boolean; message: string } {
    const todayStr = new Date().toISOString().split('T')[0];

    if (this.data.lastClaimDate === todayStr) {
      return { success: false, message: 'Already claimed today! Return tomorrow for next reward.' };
    }

    const reward = DAILY_LOGIN_REWARDS.find((r) => r.day === dayNumber);
    if (!reward) return { success: false, message: 'Invalid reward day.' };

    this.data.credits += reward.credits;
    this.data.diamonds += reward.diamonds;
    if (reward.unlockedItem && !this.data.ownedItemIds.includes(reward.unlockedItem)) {
      this.data.ownedItemIds.push(reward.unlockedItem);
      this.data.equippedOutfit = reward.unlockedItem;
    }

    this.data.claimedLoginDays.push(dayNumber);
    this.data.lastClaimDate = todayStr;
    this.save();

    return { success: true, message: `Claimed ${reward.title} (+${reward.credits} Credits)!` };
  }

  private checkDailyLoginEligibility() {
    // If today is a new day, allow claiming next day
  }

  public recordMatchFinish(kills: number, victory: boolean) {
    this.data.totalMatches++;
    this.data.totalKills += kills;
    if (victory) this.data.totalWins++;

    // Calculate match rewards
    const matchCredits = 150 + kills * 50 + (victory ? 200 : 0);
    const matchXp = 80 + kills * 30 + (victory ? 150 : 0);
    const matchRp = victory ? 40 + kills * 15 : kills * 10 - (kills === 0 ? 8 : 0);

    this.data.credits += matchCredits;
    this.addXp(matchXp);
    this.addRankPoints(matchRp);

    // Update mission progress
    for (const m of this.data.missions) {
      if (m.id === 'm_first_blood' && kills >= 1) {
        m.current = Math.min(m.target, m.current + kills);
        m.completed = m.current >= m.target;
      }
      if (m.id === 'm_sharpshooter') {
        m.current = Math.min(m.target, m.current + kills);
        m.completed = m.current >= m.target;
      }
      if (m.id === 'm_explorer') {
        m.current = Math.min(m.target, m.current + 1);
        m.completed = m.current >= m.target;
      }
      if (m.id === 'm_survivor' && victory) {
        m.current = 1;
        m.completed = true;
      }
    }

    this.save();
  }

  public recordMedkitCollected() {
    for (const m of this.data.missions) {
      if (m.id === 'm_field_medic') {
        m.current = Math.min(m.target, m.current + 1);
        m.completed = m.current >= m.target;
      }
    }
    this.save();
  }

  public claimMission(missionId: string): { success: boolean; message: string } {
    const mission = this.data.missions.find((m) => m.id === missionId);
    if (!mission || !mission.completed || mission.claimed) {
      return { success: false, message: 'Mission conditions not met or already claimed.' };
    }

    mission.claimed = true;
    this.data.credits += mission.rewardCredits;
    this.addXp(mission.rewardXp);
    this.save();

    return {
      success: true,
      message: `Claimed ${mission.title}! +${mission.rewardCredits} Credits, +${mission.rewardXp} XP`,
    };
  }

  public claimPassTier(tier: number): { success: boolean; message: string } {
    if (this.data.claimedPassTiers.includes(tier)) {
      return { success: false, message: 'Tier reward already claimed.' };
    }
    if (this.data.passTier < tier) {
      return { success: false, message: 'Reach tier ' + tier + ' to unlock this reward.' };
    }

    this.data.claimedPassTiers.push(tier);
    const creditsReward = 150 + tier * 50;
    this.data.credits += creditsReward;
    this.save();

    return { success: true, message: `Claimed Tier ${tier} Reward (+${creditsReward} Credits)!` };
  }

  private addXp(amount: number) {
    this.data.xp += amount;
    this.data.passXp += amount;

    // Check level up
    const xpForNextLevel = this.data.level * 200;
    if (this.data.xp >= xpForNextLevel) {
      this.data.level++;
      this.data.xp -= xpForNextLevel;
      this.data.credits += 250; // Level up bonus
    }

    // Check pass tier up
    const passTierXp = 120;
    while (this.data.passXp >= passTierXp && this.data.passTier < 20) {
      this.data.passTier++;
      this.data.passXp -= passTierXp;
    }
  }

  private addRankPoints(rp: number) {
    this.data.rankPoints = Math.max(0, this.data.rankPoints + rp);

    // Rank milestones
    if (this.data.rankPoints >= 3000) this.data.rank = 'Legend';
    else if (this.data.rankPoints >= 2500) this.data.rank = 'Master';
    else if (this.data.rankPoints >= 2000) this.data.rank = 'Diamond';
    else if (this.data.rankPoints >= 1500) this.data.rank = 'Platinum';
    else if (this.data.rankPoints >= 1000) this.data.rank = 'Gold';
    else if (this.data.rankPoints >= 500) this.data.rank = 'Silver';
    else this.data.rank = 'Bronze';
  }
}

export { PlayerProgressManager as PlayerProgress };
