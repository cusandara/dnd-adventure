import { Character } from '@/types/dnd';
import { rollDie } from './adventure-logic';

export interface RestResult {
    character: Character;
    healedCaused: number;
    message: string;
    hitDiceSpent?: number;
}

/**
 * Performs a Short Rest.
 * Rules: Spend Hit Dice to regain HP. (1 HD per use for simplicity in this function, loop in UI if needed)
 */
export function performShortRest(character: Character): RestResult {
    if (character.hp.hitDiceCurrent <= 0) {
        return {
            character,
            healedCaused: 0,
            message: "You have no Hit Dice remaining to spend on a Short Rest."
        };
    }

    if (character.hp.current >= character.hp.max) {
        return {
            character,
            healedCaused: 0,
            message: "You are already at full health."
        };
    }

    // Roll based on Class Hit Die (e.g., d10 for Fighter)
    const hitDieSize = character.class.hitDice;
    const conMod = Math.floor((character.stats.Constitution - 10) / 2);

    // Minimum healing is 0? 1? PHB says: "add your Constitution modifier... (minimum of 0)" effectively, though dice is min 1.
    // Actually PHB: "roll the die and add your Constitution modifier."
    const roll = rollDie(hitDieSize);
    const healing = Math.max(0, roll + conMod);

    const newCurrentHp = Math.min(character.hp.max, character.hp.current + healing);
    const actualHealed = newCurrentHp - character.hp.current;

    // --- RESOURCE RECOVERY (SHORT REST) ---
    // Make sure resources object exists (for old saves stability)
    const resources = { ...character.resources };

    // Fighter: Recover Second Wind
    if (character.class.name === 'Fighter' && resources['Second Wind']) {
        resources['Second Wind'] = { ...resources['Second Wind'], current: resources['Second Wind'].max };
    }

    // Wizard: Arcane Recovery (Recover 1 spell slot level for now - MVP)
    if (character.class.name === 'Wizard' && resources['Spell Slots']) {
        const current = resources['Spell Slots'].current;
        const max = resources['Spell Slots'].max;
        if (current < max) {
            resources['Spell Slots'] = { ...resources['Spell Slots'], current: Math.min(max, current + 1) };
        }
    }

    const newChar = {
        ...character,
        hp: {
            ...character.hp,
            current: newCurrentHp,
            hitDiceCurrent: character.hp.hitDiceCurrent - 1
        },
        resources
    };

    return {
        character: newChar,
        healedCaused: actualHealed,
        message: `You spent a Hit Die (d${hitDieSize}). Rolled ${roll} + ${conMod} (Con) = Healed ${healing} HP. Resources recovered.`,
        hitDiceSpent: 1
    };
}

/**
 * Performs a Long Rest.
 * Rules: Regain all HP. Regain half of Max Hit Dice (min 1).
 */
export function performLongRest(character: Character): RestResult {
    const healedAmount = character.hp.max - character.hp.current;

    // Regain Hit Dice: Half of Max, minimum 1
    const hitDiceRegained = Math.max(1, Math.floor(character.hp.hitDiceMax / 2));
    const newHitDiceCurrent = Math.min(
        character.hp.hitDiceMax,
        character.hp.hitDiceCurrent + hitDiceRegained
    );

    // --- RESOURCE RECOVERY (LONG REST) ---
    const resources = { ...character.resources };

    // Recover Everything to Max
    Object.keys(resources).forEach(key => {
        resources[key] = { ...resources[key], current: resources[key].max };
    });

    const newChar = {
        ...character,
        hp: {
            ...character.hp,
            current: character.hp.max,
            hitDiceCurrent: newHitDiceCurrent
        },
        resources
    };

    return {
        character: newChar,
        healedCaused: healedAmount,
        message: `Long Rest complete. You regained ${healedAmount} HP and ${hitDiceRegained} Hit Dice. All abilities recovered.`
    };
}
