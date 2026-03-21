import { Item } from '@/types/dnd';

export const ITEMS: Record<string, Item> = {
    // Weapons
    'dagger': {
        id: 'dagger',
        name: 'Dagger',
        type: 'weapon',
        description: 'A small, easily concealed knife.',
        rarity: 'common',
        value: 200, // 2gp
        weaponStats: {
            damage: '1d4',
            damageType: 'piercing',
            properties: ['finesse', 'light', 'range'],
            range: '20/60'
        }
    },
    'shortsword': {
        id: 'shortsword',
        name: 'Shortsword',
        type: 'weapon',
        description: 'A standard soldier\'s blade.',
        rarity: 'common',
        value: 1000, // 10gp
        weaponStats: {
            damage: '1d6',
            damageType: 'piercing',
            properties: ['finesse', 'light']
        }
    },
    'longsword': {
        id: 'longsword',
        name: 'Longsword',
        type: 'weapon',
        description: 'A versatile blade favored by knights.',
        rarity: 'common',
        value: 1500, // 15gp
        weaponStats: {
            damage: '1d8',
            damageType: 'slashing',
            properties: ['versatile']
        }
    },
    'greatsword': {
        id: 'greatsword',
        name: 'Greatsword',
        type: 'weapon',
        description: 'A massive blade requiring two hands.',
        rarity: 'common',
        value: 5000, // 50gp
        weaponStats: {
            damage: '2d6',
            damageType: 'slashing',
            properties: ['heavy', 'two-handed']
        }
    },
    'shortbow': {
        id: 'shortbow',
        name: 'Shortbow',
        type: 'weapon',
        description: 'A light bow.',
        rarity: 'common',
        value: 2500, // 25gp
        weaponStats: {
            damage: '1d6',
            damageType: 'piercing',
            properties: ['two-handed', 'range'],
            range: '80/320'
        }
    },
    'staff': {
        id: 'staff',
        name: 'Quarterstaff',
        type: 'weapon',
        description: 'A simple length of wood.',
        rarity: 'common',
        value: 20, // 2sp
        weaponStats: {
            damage: '1d6',
            damageType: 'bludgeoning',
            properties: ['versatile']
        }
    },
    'mace': {
        id: 'mace',
        name: 'Mace',
        type: 'weapon',
        description: 'A heavy club with a metal head.',
        rarity: 'common',
        value: 500, // 5gp
        weaponStats: {
            damage: '1d6',
            damageType: 'bludgeoning',
            properties: []
        }
    },

    // Armor
    'leather_armor': {
        id: 'leather_armor',
        name: 'Leather Armor',
        type: 'armor',
        description: 'Stiff leather protecting the torso.',
        rarity: 'common',
        value: 1000, // 10gp
        armorStats: {
            baseAC: 11,
            type: 'light',
            stealthDisadvantage: false,
            maxDexBonus: Infinity
        }
    },
    'studded_leather': {
        id: 'studded_leather',
        name: 'Studded Leather',
        type: 'armor',
        description: 'Enhanced leather with metal rivets.',
        rarity: 'common',
        value: 4500, // 45gp
        armorStats: {
            baseAC: 12,
            type: 'light',
            stealthDisadvantage: false,
            maxDexBonus: Infinity
        }
    },
    'chain_shirt': {
        id: 'chain_shirt',
        name: 'Chain Shirt',
        type: 'armor',
        description: 'Interlocked metal rings worn between layers of clothing.',
        rarity: 'common',
        value: 5000, // 50gp
        armorStats: {
            baseAC: 13,
            type: 'medium',
            stealthDisadvantage: false,
            maxDexBonus: 2
        }
    },
    'scale_mail': {
        id: 'scale_mail',
        name: 'Scale Mail',
        type: 'armor',
        description: 'Overlapping metal scales.',
        rarity: 'common',
        value: 5000, // 50gp
        armorStats: {
            baseAC: 14,
            type: 'medium',
            stealthDisadvantage: true,
            maxDexBonus: 2
        }
    },
    'chain_mail': {
        id: 'chain_mail',
        name: 'Chain Mail',
        type: 'armor',
        description: 'Heavy rings covering the entire body.',
        rarity: 'common',
        value: 7500, // 75gp
        armorStats: {
            baseAC: 16,
            type: 'heavy',
            stealthDisadvantage: true,
            maxDexBonus: 0
        }
    },
    'shield': {
        id: 'shield',
        name: 'Shield',
        type: 'armor',
        description: 'A basic wooden or metal shield.',
        rarity: 'common',
        value: 1000, // 10gp
        armorStats: {
            baseAC: 2,
            type: 'shield',
            stealthDisadvantage: false
        }
    },
    'potion_healing': {
        id: 'potion_healing',
        name: 'Potion of Healing',
        type: 'potion',
        description: 'Restores 2d4+2 Hit Points.',
        rarity: 'common',
        value: 5000 // 50gp
    },
    // --- More Weapons (PHB) ---
    'rapier': {
        id: 'rapier',
        name: 'Rapier',
        type: 'weapon',
        description: 'A slender, sharp-pointed sword.',
        rarity: 'common',
        value: 2500, // 25gp
        weaponStats: { damage: '1d8', damageType: 'piercing', properties: ['finesse'] }
    },
    'battleaxe': {
        id: 'battleaxe',
        name: 'Battleaxe',
        type: 'weapon',
        description: 'A heavy axe with a broad edge.',
        rarity: 'common',
        value: 1000, // 10gp
        weaponStats: { damage: '1d8', damageType: 'slashing', properties: ['versatile'] }
    },
    'greataxe': {
        id: 'greataxe',
        name: 'Greataxe',
        type: 'weapon',
        description: 'A massive double-bladed axe.',
        rarity: 'common',
        value: 3000, // 30gp
        weaponStats: { damage: '1d12', damageType: 'slashing', properties: ['heavy', 'two-handed'] }
    },

    // --- More Armor (PHB) ---
    'plate_armor': {
        id: 'plate_armor',
        name: 'Plate Armor',
        type: 'armor',
        description: 'Fitted metal plates covering the entire body.',
        rarity: 'rare', // Expensive common
        value: 150000, // 1500gp
        armorStats: { baseAC: 18, type: 'heavy', stealthDisadvantage: true, maxDexBonus: 0 }
    },
    'splint_armor': {
        id: 'splint_armor',
        name: 'Splint Armor',
        type: 'armor',
        description: 'Vertical strips of metal riveted to leather.',
        rarity: 'uncommon', // Mid-range
        value: 20000, // 200gp
        armorStats: { baseAC: 17, type: 'heavy', stealthDisadvantage: true, maxDexBonus: 0 }
    },

    // --- Magic Items (DMG) ---
    'potion_greater_healing': {
        id: 'potion_greater_healing',
        name: 'Potion of Greater Healing',
        type: 'potion',
        description: 'Restores 4d4+4 Hit Points.',
        rarity: 'uncommon',
        value: 15000 // 150gp (Approx DMG price)
    },
    'longsword_plus1': {
        id: 'longsword_plus1',
        name: 'Longsword +1',
        type: 'weapon',
        description: 'A finely crafted magical blade.',
        rarity: 'uncommon',
        value: 50000, // 500gp? DMG prices vary. Let's say 500gp.
        weaponStats: { damage: '1d8', damageType: 'slashing', properties: ['versatile'], magicBonus: 1 }
    },
    'dagger_plus1': {
        id: 'dagger_plus1',
        name: 'Dagger +1',
        type: 'weapon',
        description: 'A magical dagger that hums with power.',
        rarity: 'uncommon',
        value: 40000, // 400gp
        weaponStats: { damage: '1d4', damageType: 'piercing', properties: ['finesse', 'light', 'range'], range: '20/60', magicBonus: 1 }
    },
    'shield_plus1': {
        id: 'shield_plus1',
        name: 'Shield +1',
        type: 'armor',
        description: 'A glowing shield that repels attacks.',
        rarity: 'rare',
        value: 100000, // 1000gp
        armorStats: { baseAC: 2, type: 'shield', stealthDisadvantage: false, magicBonus: 1 }
    },
    'chain_mail_plus1': {
        id: 'chain_mail_plus1',
        name: 'Chain Mail +1',
        type: 'armor',
        description: 'Enchanted chain mail that is lighter than it looks.',
        rarity: 'rare',
        value: 200000, // 2000gp
        armorStats: { baseAC: 16, type: 'heavy', stealthDisadvantage: true, maxDexBonus: 0, magicBonus: 1 }
    }
};

export function getItem(id: string): Item | null {
    return ITEMS[id] ? { ...ITEMS[id] } : null; // Return copy
}
