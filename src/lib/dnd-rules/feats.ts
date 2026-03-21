import { Feat } from '@/types/dnd';

/**
 * D&D 5e Feats (PHB Ch.6, Variant Rule)
 * Simplified for the adventure sim.
 */
export const FEATS: Record<string, Feat> = {
    great_weapon_master: {
        id: 'great_weapon_master',
        name: 'Great Weapon Master',
        description: 'On a critical hit with a melee weapon, you can make one additional melee attack as a bonus action. You can also take -5 to attack for +10 damage.',
        effect: 'gwm'
    },
    sharpshooter: {
        id: 'sharpshooter',
        name: 'Sharpshooter',
        description: 'Attacking at long range doesn\'t impose disadvantage. You can take -5 to ranged attack for +10 damage.',
        effect: 'sharpshooter'
    },
    sentinel: {
        id: 'sentinel',
        name: 'Sentinel',
        description: 'When a creature you can see attacks a target other than you, you can use a reaction to make a melee attack against it.',
        effect: 'sentinel'
    },
    war_caster: {
        id: 'war_caster',
        name: 'War Caster',
        description: 'Advantage on Constitution saving throws to maintain concentration. Can perform somatic components with hands full.',
        effect: 'war_caster'
    },
    lucky: {
        id: 'lucky',
        name: 'Lucky',
        description: 'You have 3 luck points. You can spend one to reroll an attack, ability check, or saving throw.',
        effect: 'lucky'
    },
    tough: {
        id: 'tough',
        name: 'Tough',
        description: 'Your HP maximum increases by 2 for every level you have.',
        effect: 'tough'
    },
    alert: {
        id: 'alert',
        name: 'Alert',
        description: '+5 to initiative. You can\'t be surprised while conscious.',
        effect: 'alert'
    },
    resilient: {
        id: 'resilient',
        name: 'Resilient',
        description: 'Increase one ability score by 1 and gain proficiency in saving throws using that ability.',
        effect: 'resilient'
    }
};
