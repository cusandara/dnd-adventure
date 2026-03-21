export const LOCATIONS = [
    "Ancient Ruins of a Forgotten Empire",
    "A Bustling City Market under Shadow",
    "The Cursed Swamp of Whispers",
    "A Floating Island above the Clouds",
    "The Underdark Caverns of glowing fungi",
    "A Wizard's Tower spiraling into the void",
    "A King's Throne Room, frozen in time"
];

export const VILLAINS = [
    "A Necromancer seeking eternal life",
    "A Corrupt Noble exploring forbidden magic",
    "A Dragon disguised as a humanoid",
    "A Mind Flayer gathering a hive",
    "A Bandit King with a heart of gold (allegedly)",
    "A Cult Leader worshipping a dark star"
];

export const PLOT_HOOKS = [
    "must recover a stolen artifact",
    "has to save the kidnapped heir",
    "needs to stop a ritual before midnight",
    "is hunting a beast that terrorizes the village",
    "seeks revenge for a fallen mentor"
];

export const TIER_1_ENCOUNTERS = [
    { type: 'combat', description: "A pack of Goblins ambushes you!", enemy: "Goblin", hp: 7, ac: 15, xp: 50 },
    { type: 'combat', description: "A hulking Orc blocks the path.", enemy: "Orc Warrior", hp: 15, ac: 13, xp: 100 },
    { type: 'combat', description: "A hungry Wolf stalks you from the bushes.", enemy: "Wolf", hp: 11, ac: 13, xp: 50 },
    { type: 'combat', description: "A Band of Thugs demands your coin.", enemy: "Thug", hp: 32, ac: 11, xp: 100 },
    { type: 'combat', description: "A group of highwaymen attacks!", enemy: "Bandit", hp: 11, ac: 12, xp: 25 },
    { type: 'combat', description: "A Kobold trap springs!", enemy: "Kobold", hp: 5, ac: 12, xp: 25 },
    { type: 'combat', description: "A Giant Rat scurries out of the shadows.", enemy: "Giant Rat", hp: 7, ac: 12, xp: 25 },
    { type: 'combat', description: "A rotting Zombie shuffles towards you.", enemy: "Zombie", hp: 22, ac: 8, xp: 50 },
    { type: 'combat', description: "A Skeleton rises from the earth.", enemy: "Skeleton", hp: 13, ac: 13, xp: 50 },
    { type: 'combat', description: "A Bandit Captain challenges you to a duel.", enemy: "Bandit Captain", hp: 65, ac: 15, xp: 450 }
];

export const TIER_2_ENCOUNTERS = [
    { type: 'combat', description: "A massive Ogre roars in your face!", enemy: "Ogre", hp: 59, ac: 11, xp: 450 },
    { type: 'combat', description: "An Owlbear screeches and charges!", enemy: "Owlbear", hp: 59, ac: 13, xp: 700 },
    { type: 'combat', description: "A hairy Bugbear attempts to surprise you.", enemy: "Bugbear", hp: 27, ac: 16, xp: 200 },
    { type: 'combat', description: "A Ghoul hungers for your flesh.", enemy: "Ghoul", hp: 22, ac: 12, xp: 200 },
    { type: 'combat', description: "A Wight commands the dead to rise.", enemy: "Wight", hp: 45, ac: 14, xp: 700 }
];

export const TIER_3_ENCOUNTERS = [
    { type: 'combat', description: "A regenerating Troll blocks the bridge.", enemy: "Troll", hp: 84, ac: 15, xp: 1800 },
    { type: 'combat', description: "A Wraith glides effectively through the walls.", enemy: "Wraith", hp: 67, ac: 13, xp: 1800 },
    { type: 'combat', description: "A Young Green Dragon descends from the sky!", enemy: "Young Green Dragon", hp: 136, ac: 18, xp: 3900 },
    { type: 'combat', description: "A Hill Giant demands food or your life.", enemy: "Hill Giant", hp: 105, ac: 13, xp: 1800 }
];

export const COMBAT_ENCOUNTERS = [...TIER_1_ENCOUNTERS]; // Default fallback

export const NON_COMBAT_ENCOUNTERS = [
    { type: 'roleplay', description: "A mysterious merchant offers a trade.", enemy: undefined },
    { type: 'exploration', description: "A trapped door blocks the way.", enemy: undefined },
    { type: 'roleplay', description: "A wounded soldier asks for help.", enemy: undefined },
    { type: 'exploration', description: "A glowing shrine hums with ancient power.", enemy: undefined, id: 'shrine' },
    { type: 'roleplay', description: "A traveling bard sits by the road, tuning a lute.", enemy: undefined, id: 'bard' },
    { type: 'exploration', description: "A sphinx statute blocks the path, its eyes glowing.", enemy: undefined, id: 'riddle' },
    { type: 'exploration', description: "The air crackles with unstable wild magic.", enemy: undefined, id: 'wild_magic' },
    { type: 'roleplay', description: "A sobbing child is looking for their lost pet.", enemy: undefined, id: 'lost_pet' },
    { type: 'roleplay', description: "A group of bandits blocks the road, demanding a toll.", enemy: undefined, id: 'bandit_toll' },
    { type: 'exploration', description: "A beautiful marble fountain stands in the ruins.", enemy: undefined, id: 'cursed_fountain' },
    { type: 'roleplay', description: "Another adventurer sharpens their blade by a fire.", enemy: undefined, id: 'rival_adventurer' },
    { type: 'exploration', description: "The bridge ahead has collapsed into the ravine.", enemy: undefined, id: 'collapsed_bridge' },
    { type: 'exploration', description: "A black obelisk hums with dark energy.", enemy: undefined, id: 'mysterious_obelisk' },
    { type: 'exploration', description: "A ring of mushrooms glows with fey magic.", enemy: undefined, id: 'fairy_circle' },
    { type: 'roleplay', description: "A large merchant caravan is encamped nearby.", enemy: undefined, id: 'merchant_caravan' }
];

export const ENCOUNTERS = [...COMBAT_ENCOUNTERS, ...NON_COMBAT_ENCOUNTERS]; // For fallback compatibility
