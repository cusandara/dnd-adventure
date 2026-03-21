import { Character, Combatant, CombatState, Scene } from '@/types/dnd';
import { rollDie } from './adventure-logic';

export function rollInitiative(dexScore: number): number {
    const mod = Math.floor((dexScore - 10) / 2);
    return rollDie(20) + mod;
}

export function calculateAC(character: Character): number {
    const dexMod = Math.floor((character.stats.Dexterity - 10) / 2);
    const armor = character.equipment.armor;
    const shield = character.equipment.offHand;

    let baseAC = 10 + dexMod; // Unarmored default

    if (armor?.armorStats) {
        const stats = armor.armorStats;
        const armorMagic = stats.magicBonus || 0;
        switch (stats.type) {
            case 'light':
                baseAC = stats.baseAC + dexMod + armorMagic;
                break;
            case 'medium':
                baseAC = stats.baseAC + Math.min(dexMod, stats.maxDexBonus ?? 2) + armorMagic;
                break;
            case 'heavy':
                baseAC = stats.baseAC + armorMagic; // No Dex bonus
                break;
        }
    }

    // Shield bonus
    if (shield && shield.armorStats?.type === 'shield') {
        const shieldStats = shield.armorStats;
        const shieldMagic = shieldStats.magicBonus || 0;
        baseAC += shieldStats.baseAC + shieldMagic; // Typically +2
    }

    return baseAC;
}

export function startCombat(character: Character, scene: Scene): CombatState {
    // Calculate Spell Stats
    const spellAbility = character.class.spellcastingAbility;
    let spellMod = 0;
    let spellSaveDC = 0;

    if (spellAbility) {
        const score = character.stats[spellAbility];
        const mod = Math.floor((score - 10) / 2);
        const prof = 2 + Math.floor((character.level - 1) / 4);
        spellMod = mod + prof;
        spellSaveDC = 8 + mod + prof;
    }

    const hasAlert = character.feats?.some(f => f.id === 'alert');
    const alertBonus = hasAlert ? 5 : 0;
    const playerInit = rollInitiative(character.stats.Dexterity) + alertBonus;

    // Apply Tough Feat HP bonus if not already factored into base hp.max
    // For simplicity in this logic, we assume Leveling.ts already applied it, or we apply a virtual maxHp buff here.
    // Wait, it's better if Leveling.ts handles Tough HP, but if gained mid-game, let's just show it here.
    const hasTough = character.feats?.some(f => f.id === 'tough');
    const toughBonus = hasTough ? character.level * 2 : 0;
    const effectiveMaxHp = character.hp.max + toughBonus;
    // Current HP gets a bump too if Tough was recently added, but let's just bump max for now to avoid healing exploits.

    const player: Combatant = {
        id: 'player',
        name: character.name,
        type: 'player',
        hp: character.hp.current + toughBonus, // Virtual buff to current combat
        maxHp: effectiveMaxHp,
        ac: calculateAC(character),
        initiative: playerInit,
        spellMod,
        spellSaveDC,
        conditions: []
    };

    // Build enemy list from scene.enemies (multi) or scene.enemy (single, backward compat)
    const enemyDefs = scene.enemies || (scene.enemy ? [scene.enemy] : []);
    const enemies: Combatant[] = enemyDefs.map((e, i) => {
        const init = rollDie(20) + (e.initiativeBonus || 0);
        return {
            id: `enemy_${i}`,
            name: e.name,
            type: 'enemy' as const,
            hp: e.hp,
            maxHp: e.hp,
            ac: e.ac,
            initiative: init,
            spellMod: 0,
            spellSaveDC: 10,
            xpReward: e.xpReward,
            attackBonus: e.attackBonus,
            damageDice: e.damageDice
        };
    });

    // Sort all combatants by initiative (descending)
    const turnOrder = [player, ...enemies].sort((a, b) => b.initiative - a.initiative);

    const enemyNames = enemies.map(e => `${e.name} (Init ${e.initiative})`).join(', ');
    return {
        isActive: true,
        turnOrder,
        currentTurnIndex: 0,
        log: [`Combat Started! ${player.name} (Init ${playerInit}, AC ${player.ac}) vs ${enemyNames}`]
    };
}

export function nextTurn(state: CombatState): CombatState {
    const nextIndex = (state.currentTurnIndex + 1) % state.turnOrder.length;
    return {
        ...state,
        currentTurnIndex: nextIndex
    };
}

export function updateCombatantHp(state: CombatState, id: string, change: number): CombatState {
    const newOrder = state.turnOrder.map(c => {
        if (c.id === id) {
            const newHp = Math.max(0, c.hp + change);
            return { ...c, hp: newHp };
        }
        return c;
    });
    return { ...state, turnOrder: newOrder };
}

export function checkCombatStatus(state: CombatState): 'active' | 'victory' | 'defeat' {
    const player = state.turnOrder.find(c => c.type === 'player');
    const enemies = state.turnOrder.filter(c => c.type === 'enemy');

    if (player && player.hp <= 0 && (!player.deathSaves || player.deathSaves.failures < 3)) return 'active'; // Dying state
    if (player && player.hp <= 0) return 'defeat';
    if (enemies.every(e => e.hp <= 0)) return 'victory'; // Assumes enemies die at 0

    return 'active';
}

import { SPELLS } from '@/lib/dnd-rules/spells';

export interface SpellResult {
    damage?: number;
    healing?: number;
    log: string;
    hit?: boolean;
    crit?: boolean;
}

export function castSpell(attacker: Combatant, target: Combatant, spellId: string): SpellResult {
    const spell = SPELLS[spellId];
    if (!spell) return { log: 'Spell failed: Unknown spell.' };

    const logs: string[] = [];
    let totalDamage = 0;
    let totalHealing = 0;
    let hit = false;
    let crit = false;

    logs.push(`${attacker.name} casts ${spell.name}!`);

    // 1. Attack Roll
    if (spell.description.includes('spell attack')) {
        const d20 = rollDie(20);
        const mod = attacker.spellMod || 0;
        const total = d20 + mod;

        crit = d20 === 20;

        if (d20 === 1) {
            logs.push(`>> MISS! (Nat 1)`);
        } else if (d20 === 20 || total >= target.ac) {
            hit = true;
            logs.push(`>> HIT! (${d20} + ${mod} = ${total} vs AC ${target.ac})`);

            // Roll Damage
            if (spell.damage) {
                // Parse "1d10" -> count=1, die=10
                const [count, die] = spell.damage.split('d').map(Number);
                const roll = rollDie(die) * count; // Simplified for MVP (should loop count)
                // Actually let's do loop for better dist
                let dmg = 0;
                for (let i = 0; i < count; i++) dmg += rollDie(die);

                if (crit) {
                    for (let i = 0; i < count; i++) dmg += rollDie(die);
                    logs.push(`>> CRITICAL HIT!`);
                }

                totalDamage = dmg;
            }
        } else {
            logs.push(`>> MISS! (${total} vs AC ${target.ac})`);
        }
    }

    // 2. Saving Throw (Simple implementation: Dex or Wis mostly)
    else if (spell.description.includes('saving throw')) {
        // Assume Dex save for MVP unless specified? 
        // Logic: Parse "Dexterity saving throw"
        let saveType = 'Dexterity'; // Default for sacred flame/burning hands?
        // Actually Sacred Flame is Dex. Burning Hands is Dex.
        // Frostbite is Con.

        const dc = attacker.spellSaveDC || 12;
        const saveRoll = rollDie(20); // Enemy simple roll
        // Enemy save mod?
        const saveMod = 1; // Basic enemy mod
        const saveTotal = saveRoll + saveMod;

        if (saveTotal >= dc) {
            logs.push(`>> ${target.name} saved! (${saveTotal} vs DC ${dc})`);
            // Half damage handling?
            if (spell.description.includes('half as much damage')) {
                if (spell.damage) {
                    const [count, die] = spell.damage.split('d').map(Number);
                    let dmg = 0;
                    for (let i = 0; i < count; i++) dmg += rollDie(die);
                    totalDamage = Math.floor(dmg / 2);
                }
            }
        } else {
            logs.push(`>> ${target.name} failed save! (${saveTotal} vs DC ${dc})`);
            if (spell.damage) {
                const [count, die] = spell.damage.split('d').map(Number);
                let dmg = 0;
                for (let i = 0; i < count; i++) dmg += rollDie(die);
                totalDamage = dmg;
            }
        }
    }

    // 3. Auto-Hit (Magic Missile)
    else if (spell.id === 'magic_missile') {
        if (spell.damage) {
            // 3d4+3 logic
            // const [count, die] = ... 
            // Logic specific to MM: 1d4+1 x 3
            // My data says "3d4+3"
            // Let's just parse standard dice notation
            const parts = spell.damage.split('+');
            const dicePart = parts[0]; // "3d4"
            const modPart = parts[1] ? parseInt(parts[1]) : 0;
            const [count, die] = dicePart.split('d').map(Number);

            let dmg = 0;
            for (let i = 0; i < count; i++) dmg += rollDie(die);
            totalDamage = dmg + modPart;
            logs.push(`>> Magic Missiles strike unerringly!`);
        }
    }

    // 4. Healing
    else if (spell.healing) {
        const parts = spell.healing.split('+');
        const dicePart = parts[0]; // "1d8"
        // Spell mod is added code-side usually
        const [count, die] = dicePart.split('d').map(Number);

        // Handle "0" healing (Spare the Dying)
        if (spell.id === 'spare_the_dying') {
            logs.push(`>> ${target.name} is stabilized.`);
            // Special logic needs to happen in AdventureView to set death saves failures to 0?
            // Or remove 'dying' state?
            // "The creature becomes stable."
            // We'll handle this via `healing: 0` return, but specific flag?
        } else {
            let heal = 0;
            for (let i = 0; i < count; i++) heal += rollDie(die);
            totalHealing = heal + (attacker.spellMod || 0);
            logs.push(`>> Heals for ${totalHealing} HP.`);
        }
    }

    if (totalDamage > 0) logs.push(`>> Dealt ${totalDamage} ${spell.damageType} damage.`);

    return {
        damage: totalDamage,
        healing: totalHealing,
        log: logs.join(' ')
    };
}
