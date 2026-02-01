import { Race } from '@/types/dnd';

export const RACES: Record<string, Race> = {
    "Human": {
        name: "Human",
        speed: 30,
        abilityBonuses: { Strength: 1, Dexterity: 1, Constitution: 1, Intelligence: 1, Wisdom: 1, Charisma: 1 },
        traits: [
            { name: "Versatile", description: "Humans adapt to any situation." }
        ]
    },
    "Elf": {
        name: "Elf",
        speed: 30,
        abilityBonuses: { Dexterity: 2 },
        traits: [
            { name: "Darkvision", description: "Can see 60ft in dim light as if bright, and darkness as if dim." },
            { name: "Fey Ancestry", description: "Advantage on saves vs Charm, immune to sleep magic." },
            { name: "Trance", description: "Meditate for 4 hours instead of sleeping 8." }
        ]
    },
    "Dwarf": {
        name: "Dwarf",
        speed: 25,
        abilityBonuses: { Constitution: 2 },
        traits: [
            { name: "Darkvision", description: "Can see 60ft in dim light as if bright, and darkness as if dim." },
            { name: "Dwarven Resilience", description: "Advantage on saves vs Poison, resistance to Poison damage." }
        ]
    },
    "Halfling": {
        name: "Halfling",
        speed: 25,
        abilityBonuses: { Dexterity: 2 },
        traits: [
            { name: "Lucky", description: "Reroll 1s on attacks, ability checks, and saves." },
            { name: "Halfling Nimbleness", description: "Can move through the space of any creature larger than you." }
        ]
    }
};
