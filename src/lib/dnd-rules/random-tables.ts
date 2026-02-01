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

export const COMBAT_ENCOUNTERS = [
    { type: 'combat', description: "A pack of Goblins ambushes you!", enemy: "Goblin", hp: 10, ac: 11 },
    { type: 'combat', description: "A hulking Orc blocks the path.", enemy: "Orc Warrior", hp: 20, ac: 12 },
    { type: 'combat', description: "A hungry Wolf stalks you from the bushes.", enemy: "Wolf", hp: 11, ac: 13 },
    { type: 'combat', description: "A Band of Thugs demands your coin.", enemy: "Thug", hp: 16, ac: 11 },
    { type: 'combat', description: "A group of highwaymen attacks!", enemy: "Bandit", hp: 11, ac: 12 }
];

export const NON_COMBAT_ENCOUNTERS = [
    { type: 'roleplay', description: "A mysterious merchant offers a trade.", enemy: undefined },
    { type: 'exploration', description: "A trapped door blocks the way.", enemy: undefined },
    { type: 'roleplay', description: "A wounded soldier asks for help.", enemy: undefined },
    { type: 'exploration', description: "A glowing shrine hums with ancient power.", enemy: undefined, id: 'shrine' },
    { type: 'roleplay', description: "A traveling bard sits by the road, tuning a lute.", enemy: undefined, id: 'bard' },
    { type: 'exploration', description: "A sphinx statute blocks the path, its eyes glowing.", enemy: undefined, id: 'riddle' },
    { type: 'exploration', description: "The air crackles with unstable wild magic.", enemy: undefined, id: 'wild_magic' },
    { type: 'roleplay', description: "A sobbing child is looking for their lost pet.", enemy: undefined, id: 'lost_pet' },
    { type: 'roleplay', description: "A group of bandits blocks the road, demanding a toll.", enemy: undefined, id: 'bandit_toll' }
];

export const ENCOUNTERS = [...COMBAT_ENCOUNTERS, ...NON_COMBAT_ENCOUNTERS]; // For fallback compatibility
