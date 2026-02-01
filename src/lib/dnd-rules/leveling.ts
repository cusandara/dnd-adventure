import { Character, CharacterStats } from "@/types/dnd";

export const XP_TABLE: Record<number, number> = {
    1: 0,
    2: 300,
    3: 900,
    4: 2700,
    5: 6500,
    6: 14000,
    7: 23000,
    8: 34000,
    9: 48000,
    10: 64000
    // Simplified cap at 10 for this sim
};

export function getProficiencyBonus(level: number): number {
    return 2 + Math.floor((level - 1) / 4);
}

export function checkLevelUp(character: Character): { leveledUp: boolean; newCharacter: Character } {
    const nextLevel = character.level + 1;
    const threshold = XP_TABLE[nextLevel];

    if (!threshold || character.xp < threshold) {
        return { leveledUp: false, newCharacter: character };
    }

    // Process Level Up
    const newStats = { ...character.stats };

    // Auto-increase Primary Stat every 4 levels (ASI simulator)
    // Simplified: Just +1 to Con and Primary Stat every level for arcade feeling? 
    // Or stick to rules: Level 4, 8. 
    // The user said "based on PHB". So Level 4 ASI.
    if (nextLevel % 4 === 0) {
        // Find highest stat
        const primaryStat = Object.entries(newStats).reduce((a, b) => a[1] > b[1] ? a : b)[0] as keyof CharacterStats;
        newStats[primaryStat] += 2; // +2 to primary
    }

    // HP Increase: Roll Hit Dice (avg) + Con Mod
    const conMod = Math.floor((newStats.Constitution - 10) / 2);
    const hpGain = Math.max(1, (character.class.hitDice / 2) + 1 + conMod);
    const newMaxHp = character.hp.max + hpGain;

    return {
        leveledUp: true,
        newCharacter: {
            ...character,
            level: nextLevel,
            maxXp: XP_TABLE[nextLevel + 1] || 999999,
            stats: newStats,
            hp: {
                ...character.hp,
                max: newMaxHp,
                current: newMaxHp, // Heal on level up
                hitDiceMax: nextLevel,
                hitDiceCurrent: nextLevel
            }
        }
    };
}

export interface EnemyBase {
    name: string;
    hp: number;
    ac: number;
}

export function scaleEnemy(enemy: EnemyBase, playerLevel: number): EnemyBase {
    if (playerLevel === 1) return enemy;

    // Gentler Scaling for a fun experience:
    // HP: +15% per level (was 30%)
    // AC: +1 every 4 levels (was 3)
    const scalingFactor = playerLevel - 1;

    return {
        name: enemy.name,
        hp: Math.floor(enemy.hp * (1 + 0.15 * scalingFactor)), // +15% HP per level
        ac: Math.min(18, enemy.ac + Math.floor(scalingFactor / 4)), // AC caps at 18, roughly +1 per 4 lvls
    };
}
