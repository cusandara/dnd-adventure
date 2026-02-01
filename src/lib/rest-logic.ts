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

    const newChar = {
        ...character,
        hp: {
            ...character.hp,
            current: newCurrentHp,
            hitDiceCurrent: character.hp.hitDiceCurrent - 1
        }
    };

    return {
        character: newChar,
        healedCaused: actualHealed,
        message: `You spent a Hit Die (d${hitDieSize}). Rolled ${roll} + ${conMod} (Con) = Healed ${healing} HP.`,
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

    const newChar = {
        ...character,
        hp: {
            ...character.hp,
            current: character.hp.max,
            hitDiceCurrent: newHitDiceCurrent
        }
    };

    return {
        character: newChar,
        healedCaused: healedAmount,
        message: `Long Rest complete. You regained ${healedAmount} HP and ${hitDiceRegained} Hit Dice.`
    };
}
