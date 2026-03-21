/**
 * D&D 5e Conditions & Status Effects (PHB Appendix A)
 * Simplified for the adventure sim.
 */

export interface Condition {
    id: string;
    name: string;
    description: string;
    effects: ConditionEffect[];
    duration: number; // Rounds remaining (-1 = until save)
}

export interface ConditionEffect {
    type: 'disadvantage_attacks' | 'disadvantage_ability_checks' | 'advantage_attacks_against' |
    'speed_zero' | 'auto_fail_str_dex' | 'half_speed' | 'ac_penalty' | 'damage_per_turn';
    value?: number; // For numeric effects like damage
}

export const CONDITIONS: Record<string, Omit<Condition, 'duration'>> = {
    poisoned: {
        id: 'poisoned',
        name: 'Poisoned',
        description: 'Disadvantage on attack rolls and ability checks.',
        effects: [
            { type: 'disadvantage_attacks' },
            { type: 'disadvantage_ability_checks' }
        ]
    },
    frightened: {
        id: 'frightened',
        name: 'Frightened',
        description: 'Disadvantage on ability checks and attack rolls while source is in sight.',
        effects: [
            { type: 'disadvantage_attacks' },
            { type: 'disadvantage_ability_checks' }
        ]
    },
    prone: {
        id: 'prone',
        name: 'Prone',
        description: 'Disadvantage on attack rolls. Attacks from nearby have advantage.',
        effects: [
            { type: 'disadvantage_attacks' },
            { type: 'advantage_attacks_against' }
        ]
    },
    restrained: {
        id: 'restrained',
        name: 'Restrained',
        description: 'Speed 0. Disadvantage on attacks. Attacks against have advantage.',
        effects: [
            { type: 'speed_zero' },
            { type: 'disadvantage_attacks' },
            { type: 'advantage_attacks_against' }
        ]
    },
    stunned: {
        id: 'stunned',
        name: 'Stunned',
        description: 'Can\'t move or take actions. Auto-fail Str/Dex saves. Attacks against have advantage.',
        effects: [
            { type: 'speed_zero' },
            { type: 'auto_fail_str_dex' },
            { type: 'advantage_attacks_against' }
        ]
    }
};

/**
 * Check if a combatant has disadvantage on attacks due to conditions.
 */
export function hasDisadvantageOnAttacks(conditions: Condition[]): boolean {
    return conditions.some(c => c.effects.some(e => e.type === 'disadvantage_attacks'));
}

/**
 * Check if attacks against a combatant have advantage due to conditions.
 */
export function hasAdvantageAgainst(targetConditions: Condition[]): boolean {
    return targetConditions.some(c => c.effects.some(e => e.type === 'advantage_attacks_against'));
}

/**
 * Check if a combatant is stunned (can't act).
 */
export function isStunned(conditions: Condition[]): boolean {
    return conditions.some(c => c.id === 'stunned');
}

/**
 * Tick down condition durations by 1 and return remaining active conditions.
 */
export function tickConditions(conditions: Condition[]): Condition[] {
    return conditions
        .map(c => ({ ...c, duration: c.duration - 1 }))
        .filter(c => c.duration !== 0); // Remove expired (duration was 1, now 0)
}

/**
 * Apply a condition with a set duration.
 */
export function applyCondition(conditionId: string, duration: number): Condition | null {
    const template = CONDITIONS[conditionId];
    if (!template) return null;
    return { ...template, duration };
}

/**
 * Roll with advantage (take higher of 2d20).
 */
export function rollWithAdvantage(): number {
    const r1 = Math.floor(Math.random() * 20) + 1;
    const r2 = Math.floor(Math.random() * 20) + 1;
    return Math.max(r1, r2);
}

/**
 * Roll with disadvantage (take lower of 2d20).
 */
export function rollWithDisadvantage(): number {
    const r1 = Math.floor(Math.random() * 20) + 1;
    const r2 = Math.floor(Math.random() * 20) + 1;
    return Math.min(r1, r2);
}
