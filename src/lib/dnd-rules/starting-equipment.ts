import { Item, Character, EquipmentSlots } from '@/types/dnd';
import { getItem } from './items';

// Helper to get item ensuring it exists (for type safety in array)
const i = (id: string): Item => {
    const item = getItem(id);
    if (!item) throw new Error(`Starting Item not found: ${id}`);
    return item;
};

interface ClassKit {
    inventory: Item[];
    equipment: EquipmentSlots;
    wallet: number; // in cp
}

const KITS: Record<string, ClassKit> = {
    'Fighter': {
        inventory: [i('chain_mail'), i('longsword'), i('shield'), i('shortbow'), i('potion_healing')],
        equipment: {
            mainHand: i('longsword'),
            offHand: i('shield'),
            armor: i('chain_mail')
        },
        wallet: 1500 // 15gp
    },
    'Rotue': { // Typo fix: should be Ranger or Rogue? Assuming 'Rogue' from earlier implementation
        inventory: [i('leather_armor'), i('dagger'), i('shortsword'), i('shortbow'), i('potion_healing')],
        equipment: {
            mainHand: i('shortsword'),
            offHand: i('dagger'),
            armor: i('leather_armor')
        },
        wallet: 1500
    },
    'Rogue': {
        inventory: [i('leather_armor'), i('dagger'), i('shortsword'), i('shortbow'), i('potion_healing')],
        equipment: {
            mainHand: i('shortsword'),
            offHand: i('dagger'),
            armor: i('leather_armor')
        },
        wallet: 1500
    },
    'Wizard': {
        inventory: [i('staff'), i('dagger'), i('potion_healing')],
        equipment: {
            mainHand: i('staff'),
            offHand: null,
            armor: null
        },
        wallet: 1000 // 10gp
    },
    'Cleric': {
        inventory: [i('mace'), i('scale_mail'), i('shield'), i('potion_healing')],
        equipment: {
            mainHand: i('mace'),
            offHand: i('shield'),
            armor: i('scale_mail')
        },
        wallet: 500 // 5gp
    }
};

export function applyStartingEquipment(character: Character): Character {
    const className = character.class.name;
    const kit = KITS[className] || KITS['Fighter']; // Default to Fighter if unknown

    return {
        ...character,
        inventory: [...kit.inventory],
        equipment: { ...kit.equipment },
        wallet: {
            cp: 0,
            sp: 0,
            ep: 0,
            gp: Math.floor(kit.wallet / 100),
            pp: 0
        }
    };
}
