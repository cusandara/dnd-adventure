import { Class } from '@/types/dnd';

export const CLASSES: Record<string, Class> = {
    "Fighter": {
        name: "Fighter",
        hitDice: 10,
        savingThrows: ['Strength', 'Constitution'],
        features: [
            { name: "Second Wind", description: "Bonus Action: Regain 1d10 + Level HP. (Once per Short Rest)", level: 1 },
            { name: "Fighting Style", description: "Choose a specialization (Defense, Dueling, etc).", level: 1 }
        ],
        canCastSpells: false,
        subclasses: [
            {
                id: 'champion', name: 'Champion', className: 'Fighter',
                description: 'A master of raw combat prowess. Improved critical hits.',
                features: [
                    { name: "Improved Critical", description: "Your weapon attacks score a critical hit on a roll of 19 or 20.", level: 3 }
                ]
            },
            {
                id: 'battle_master', name: 'Battle Master', className: 'Fighter',
                description: 'A tactical fighter who uses combat maneuvers.',
                features: [
                    { name: "Combat Superiority", description: "You learn maneuvers fueled by superiority dice (1d8). Trip Attack: Add die to damage and knock prone.", level: 3 }
                ]
            }
        ]
    },
    "Wizard": {
        name: "Wizard",
        hitDice: 6,
        savingThrows: ['Intelligence', 'Wisdom'],
        features: [
            { name: "Arcane Recovery", description: "Regain some spell slots on Short Rest.", level: 1 },
            { name: "Spellcasting", description: "Cast Wizard spells using Intelligence.", level: 1 }
        ],
        canCastSpells: true,
        spellcastingAbility: 'Intelligence',
        subclasses: [
            {
                id: 'evocation', name: 'School of Evocation', className: 'Wizard',
                description: 'Master of destructive energy and offensive spells.',
                features: [
                    { name: "Sculpt Spells", description: "Allies auto-succeed on saves vs your evocation spells.", level: 3 },
                    { name: "Potent Cantrip", description: "Creatures that save against your cantrips still take half damage.", level: 3 }
                ]
            },
            {
                id: 'abjuration', name: 'School of Abjuration', className: 'Wizard',
                description: 'Master of protective and defensive magic.',
                features: [
                    { name: "Arcane Ward", description: "When you cast an abjuration spell, gain a ward with HP equal to twice your wizard level + Int mod.", level: 3 }
                ]
            }
        ]
    },
    "Rogue": {
        name: "Rogue",
        hitDice: 8,
        savingThrows: ['Dexterity', 'Intelligence'],
        features: [
            { name: "Sneak Attack", description: "Deal extra damage if you have advantage or an ally is nearby.", level: 1 },
            { name: "Thieves' Cant", description: "Speak a secret code language.", level: 1 }
        ],
        canCastSpells: false,
        subclasses: [
            {
                id: 'thief', name: 'Thief', className: 'Rogue',
                description: 'A nimble burglar with quick hands.',
                features: [
                    { name: "Fast Hands", description: "Use items as a Bonus Action.", level: 3 },
                    { name: "Second-Story Work", description: "Climbing doesn't cost extra movement.", level: 3 }
                ]
            },
            {
                id: 'assassin', name: 'Assassin', className: 'Rogue',
                description: 'A deadly killer who strikes from the shadows.',
                features: [
                    { name: "Assassinate", description: "Advantage on attacks vs creatures that haven't acted. Automatic critical on surprised targets.", level: 3 }
                ]
            }
        ]
    },
    "Cleric": {
        name: "Cleric",
        hitDice: 8,
        savingThrows: ['Wisdom', 'Charisma'],
        features: [
            { name: "Spellcasting", description: "Cast Cleric spells using Wisdom.", level: 1 },
            { name: "Divine Domain", description: "Choose a deity and gain domain spells.", level: 1 }
        ],
        canCastSpells: true,
        spellcastingAbility: 'Wisdom',
        subclasses: [
            {
                id: 'life_domain', name: 'Life Domain', className: 'Cleric',
                description: 'Devoted to healing and vitality.',
                features: [
                    { name: "Disciple of Life", description: "Healing spells restore additional HP equal to 2 + spell level.", level: 3 }
                ]
            },
            {
                id: 'war_domain', name: 'War Domain', className: 'Cleric',
                description: 'A warrior-priest who channels divine power into combat.',
                features: [
                    { name: "War Priest", description: "When you make an attack, you can make one extra weapon attack as a bonus action (Wisdom mod times per long rest).", level: 3 }
                ]
            }
        ]
    }
};
