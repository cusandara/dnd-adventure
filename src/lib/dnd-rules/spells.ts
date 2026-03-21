import { Spell } from '@/types/dnd';

export const SPELLS: Record<string, Spell> = {
    // --- Cantrips ---
    'fire_bolt': {
        id: 'fire_bolt',
        name: 'Fire Bolt',
        level: 0,
        school: 'Evocation',
        castingTime: '1 Action',
        range: '120 feet',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'You hurl a mote of fire at a creature or object within range. Make a ranged spell attack against the target. On a hit, the target takes 1d10 fire damage.',
        damage: '1d10',
        damageType: 'fire',
        scaling: [
            { level: 5, damage: '2d10' },
            { level: 11, damage: '3d10' },
            { level: 17, damage: '4d10' }
        ]
    },
    'ray_of_frost': {
        id: 'ray_of_frost',
        name: 'Ray of Frost',
        level: 0,
        school: 'Evocation',
        castingTime: '1 Action',
        range: '60 feet',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'A frigid beam of blue-white light streaks toward a creature within range. Make a ranged spell attack against the target. On a hit, it takes 1d8 cold damage, and its speed is reduced by 10 feet until the start of your next turn.',
        damage: '1d8',
        damageType: 'cold',
        scaling: [
            { level: 5, damage: '2d8' },
            { level: 11, damage: '3d8' },
            { level: 17, damage: '4d8' }
        ]
    },
    'sacred_flame': {
        id: 'sacred_flame',
        name: 'Sacred Flame',
        level: 0,
        school: 'Evocation',
        castingTime: '1 Action',
        range: '60 feet',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'Flame-like radiance descends on a creature that you can see within range. The target must succeed on a Dexterity saving throw or take 1d8 radiant damage. The target gains no benefit from cover for this saving throw.',
        damage: '1d8',
        damageType: 'radiant',
        scaling: [
            { level: 5, damage: '2d8' },
            { level: 11, damage: '3d8' },
            { level: 17, damage: '4d8' }
        ]
    },
    'spare_the_dying': {
        id: 'spare_the_dying',
        name: 'Spare the Dying',
        level: 0,
        school: 'Necromancy',
        castingTime: '1 Action',
        range: 'Touch',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'You touch a living creature that has 0 hit points. The creature becomes stable. This spell has no effect on undead or constructs.',
        healing: '0' // Special handling: stabilizes
    },

    // --- Level 1 ---
    'magic_missile': {
        id: 'magic_missile',
        name: 'Magic Missile',
        level: 1,
        school: 'Evocation',
        castingTime: '1 Action',
        range: '120 feet',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target. The darts all strike simultaneously, and you can direct them to hit one creature or several.',
        damage: '3d4+3', // Simplified for single target MVP: 3 darts * (1d4+1). Actually roll logic might need 3 separate rolls? For MVP, let's treat as one big hit or implement multi-hit logic later.
        damageType: 'force'
    },
    'burning_hands': {
        id: 'burning_hands',
        name: 'Burning Hands',
        level: 1,
        school: 'Evocation',
        castingTime: '1 Action',
        range: 'Self (15-foot cone)',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'As you hold your hands with thumbs touching and fingers spread, a thin sheet of flames shoots forth from your outstretched fingertips. Each creature in a 15-foot cone must make a Dexterity saving throw. A creature takes 3d6 fire damage on a failed save, or half as much damage on a successful one.',
        damage: '3d6',
        damageType: 'fire'
    },
    'cure_wounds': {
        id: 'cure_wounds',
        name: 'Cure Wounds',
        level: 1,
        school: 'Evocation',
        castingTime: '1 Action',
        range: 'Touch',
        components: ['V', 'S'],
        duration: 'Instantaneous',
        description: 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.',
        healing: '1d8' // + modifier logic handled in code
    },
    'healing_word': {
        id: 'healing_word',
        name: 'Healing Word',
        level: 1,
        school: 'Evocation',
        castingTime: '1 Bonus Action',
        range: '60 feet',
        components: ['V'],
        duration: 'Instantaneous',
        description: 'A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier. This spell has no effect on undead or constructs.',
        healing: '1d4' // + modifier
    },
    'guiding_bolt': {
        id: 'guiding_bolt',
        name: 'Guiding Bolt',
        level: 1,
        school: 'Evocation',
        castingTime: '1 Action',
        range: '120 feet',
        components: ['V', 'S'],
        duration: '1 Round',
        description: 'A flash of light streaks toward a creature of your choice within range. Make a ranged spell attack against the target. On a hit, the target takes 4d6 radiant damage, and the next attack roll made against this target before the end of your next turn has advantage.',
        damage: '4d6',
        damageType: 'radiant'
    },
    'mage_armor': {
        id: 'mage_armor',
        name: 'Mage Armor',
        level: 1,
        school: 'Abjuration',
        castingTime: '1 Action',
        range: 'Touch',
        components: ['V', 'S', 'M'],
        duration: '8 Hours',
        description: 'You touch a willing creature who isn\'t wearing armor, and a protective magical force surrounds it until the spell ends. The target\'s base AC becomes 13 + its Dexterity modifier. The spell ends if the target dons armor or if you dismiss the spell as an action.',
        // Effect handled by status/AC logic
    },
    'shield': {
        id: 'shield',
        name: 'Shield',
        level: 1,
        school: 'Abjuration',
        castingTime: '1 Reaction',
        range: 'Self',
        components: ['V', 'S'],
        duration: '1 Round',
        description: 'An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from magic missile.',
        // Reaction logic to be implemented
    }
};
