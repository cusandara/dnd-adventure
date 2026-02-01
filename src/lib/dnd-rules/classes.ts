import { Class } from '@/types/dnd';

export const CLASSES: Record<string, Class> = {
    "Fighter": {
        name: "Fighter",
        hitDice: 10,
        savingThrows: ['Strength', 'Constitution'],
        features: [
            { name: "Second Wind", description: "Bonus Action: Regain 1d10 + Level HP. (Once per Short Rest)", level: 1 },
            { name: "Fighting Style", description: "Choose a specialization (Defense, Dueling, etc).", level: 1 }
        ]
    },
    "Wizard": {
        name: "Wizard",
        hitDice: 6,
        savingThrows: ['Intelligence', 'Wisdom'],
        features: [
            { name: "Arcane Recovery", description: "Regain some spell slots on Short Rest.", level: 1 },
            { name: "Spellcasting", description: "Cast Wizard spells using Intelligence.", level: 1 }
        ]
    },
    "Rogue": {
        name: "Rogue",
        hitDice: 8,
        savingThrows: ['Dexterity', 'Intelligence'],
        features: [
            { name: "Sneak Attack", description: "Deal extra damage if you have advantage or an ally is nearby.", level: 1 },
            { name: "Thieves' Cant", description: "Speak a secret code language.", level: 1 }
        ]
    },
    "Cleric": {
        name: "Cleric",
        hitDice: 8,
        savingThrows: ['Wisdom', 'Charisma'],
        features: [
            { name: "Spellcasting", description: "Cast Cleric spells using Wisdom.", level: 1 },
            { name: "Divine Domain", description: "Choose a deity and gain domain spells.", level: 1 }
        ]
    }
};
