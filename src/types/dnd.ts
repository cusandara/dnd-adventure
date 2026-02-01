export type Ability = 'Strength' | 'Dexterity' | 'Constitution' | 'Intelligence' | 'Wisdom' | 'Charisma';

export type Skill =
  | 'Acrobatics' | 'Animal Handling' | 'Arcana' | 'Athletics' | 'Deception'
  | 'History' | 'Insight' | 'Intimidation' | 'Investigation' | 'Medicine'
  | 'Nature' | 'Perception' | 'Performance' | 'Persuasion' | 'Religion'
  | 'Sleight of Hand' | 'Stealth' | 'Survival'
  | 'Constitution' // Added for raw checks
  | 'Intelligence'; // Added for raw checks

export interface CharacterStats {
  Strength: number;
  Dexterity: number;
  Constitution: number;
  Intelligence: number;
  Wisdom: number;
  Charisma: number;
}

export interface Trait {
  name: string;
  description: string;
}

export interface Feature {
  name: string;
  description: string;
  level: number;
}

export interface Race {
  name: string;
  speed: number;
  abilityBonuses: Partial<Record<Ability, number>>;
  traits: Trait[];
}

export interface Class {
  name: string;
  hitDice: number; // e.g., 6, 8, 10, 12
  savingThrows: Ability[];
  features: Feature[];
}

export type ItemType = 'weapon' | 'armor' | 'potion' | 'misc' | 'currency';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export interface WeaponProperties {
  damage: string; // e.g. "1d8"
  damageType: 'slashing' | 'piercing' | 'bludgeoning';
  properties: ('light' | 'finesse' | 'heavy' | 'two-handed' | 'versatile' | 'range')[];
  range?: string; // "20/60"
}

export interface ArmorProperties {
  baseAC: number;
  type: 'light' | 'medium' | 'heavy' | 'shield';
  stealthDisadvantage: boolean;
  maxDexBonus?: number; // 2 for medium, 0 for heavy, Infinity for light
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  rarity: Rarity;
  value: number; // in cp
  weaponStats?: WeaponProperties;
  armorStats?: ArmorProperties;
}

export interface Wallet {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface EquipmentSlots {
  mainHand: Item | null;
  offHand: Item | null;
  armor: Item | null;
}

export interface Character {
  name: string;
  race: Race;
  class: Class;
  level: number;
  stats: CharacterStats;
  hp: {
    current: number;
    max: number;
    hitDiceCurrent: number;
    hitDiceMax: number;
  };
  xp: number;
  maxXp: number;
  skills: Skill[];
  inventory: Item[];
  wallet: Wallet;
  equipment: EquipmentSlots;
  quests: Quest[];
}

export interface Question {
  id: string;
  text: string;
  options: {
    label: string;
    value: string; // Could map to a Class or Playstyle
    scores?: Partial<Record<string, number>>; // e.g., { "Fighter": 2, "Wizard": -1 }
  }[];
}

export interface Choice {
  id: string;
  text: string;
  requiredCheck?: {
    skill: Skill;
    dc: number;
  };
  consequence?: {
    success: string;
    failure: string;
    damage?: number;
    reward?: string;
  };
}

export interface Combatant {
  id: string;
  name: string;
  type: 'player' | 'enemy';
  hp: number;
  maxHp: number;
  ac: number;
  initiative: number;
}

export interface CombatState {
  isActive: boolean;
  turnOrder: Combatant[];
  currentTurnIndex: number;
  log: string[];
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  type: 'exploration' | 'combat' | 'roleplay';
  choices: Choice[];
  enemy?: {
    name: string;
    hp: number;
    ac: number;
    attackLoading?: string;
    initiativeBonus?: number; // Added
  };
}

export interface QuestObjective {
  type: 'kill' | 'collect' | 'visit';
  target: string; // e.g. "Goblin", "Ancient Relic", "Old Ruins"
  count: number;
  current: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  reward: {
    xp: number;
    gp: number;
    items?: Item[];
  };
  status: 'active' | 'completed' | 'failed';
}


