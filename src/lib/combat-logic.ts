import { Character, Combatant, CombatState, Scene } from '@/types/dnd';
import { rollDie } from './adventure-logic';

export function rollInitiative(dexScore: number): number {
    const mod = Math.floor((dexScore - 10) / 2);
    return rollDie(20) + mod;
}

export function startCombat(character: Character, scene: Scene): CombatState {
    const playerInit = rollInitiative(character.stats.Dexterity);
    const enemyInit = scene.enemy ? rollDie(20) + (scene.enemy.initiativeBonus || 0) : 0;

    const player: Combatant = {
        id: 'player',
        name: character.name,
        type: 'player',
        hp: character.hp.current,
        maxHp: character.hp.max,
        ac: 10 + Math.floor((character.stats.Dexterity - 10) / 2), // Simple AC calc
        initiative: playerInit
    };

    const enemy: Combatant = {
        id: 'enemy',
        name: scene.enemy?.name || 'Enemy',
        type: 'enemy',
        hp: scene.enemy?.hp || 10,
        maxHp: scene.enemy?.hp || 10,
        ac: scene.enemy?.ac || 10,
        initiative: enemyInit
    };

    // Sort by initiative (descending)
    const turnOrder = [player, enemy].sort((a, b) => b.initiative - a.initiative);

    return {
        isActive: true,
        turnOrder,
        currentTurnIndex: 0,
        log: [`Combat Started! ${player.name} (Init ${playerInit}) vs ${enemy.name} (Init ${enemyInit})`]
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

    if (player && player.hp <= 0) return 'defeat';
    if (enemies.every(e => e.hp <= 0)) return 'victory';

    return 'active';
}
