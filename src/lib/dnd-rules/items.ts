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
    }
};

export function getItem(id: string): Item | null {
    return ITEMS[id] ? { ...ITEMS[id] } : null; // Return copy
}
