import React, { useState, useEffect, useRef } from 'react';
import { Character, Scene, CombatState, Quest } from '@/types/dnd';
import { generateNextScene, performCheck, generateLoot, generateShopScene } from '@/lib/adventure-logic';
import { getItem } from '@/lib/dnd-rules/items';
import { generateQuest, checkQuestProgress } from '@/lib/quests';

// ... (keep imports)
import { CharacterSheet } from '../character/CharacterSheet';
import { Scroll, Sword, Dices, Tent } from 'lucide-react';
import { startCombat, nextTurn, updateCombatantHp, checkCombatStatus, castSpell } from '@/lib/combat-logic';
import { checkLevelUp } from '@/lib/dnd-rules/leveling';
import { performShortRest, performLongRest } from '@/lib/rest-logic';
import { autoSave, saveGame, loadGame, getSaveSlotInfo, SaveSlotInfo } from '@/lib/save-system';
import { SPELLS } from '@/lib/dnd-rules/spells';
import { FEATS } from '@/lib/dnd-rules/feats';
import { hasDisadvantageOnAttacks, hasAdvantageAgainst, tickConditions, rollWithAdvantage, rollWithDisadvantage } from '@/lib/dnd-rules/conditions';
import { advanceChapter, getChapterIntroScene, getCampaignSideQuests, getNextCampaignScene } from '@/lib/campaign-logic';

interface AdventureViewProps {
    character: Character;
    onReset: () => void;
    initialScene?: Scene | null;
    initialLog?: LogEntry[];
}

export interface LogEntry {
    text: string;
    type: 'narrative' | 'success' | 'failure' | 'info';
}

// Helper to format combat log text with vivid colors
function formatLogText(text: string, type: string) {
    if (type === 'narrative' || type === 'info') return text;

    // Split text by common combat patterns
    const parts = text.split(/(\d+\s*damage|\d+\s*HP|CRITICAL HIT!|MISS!)/g);

    return parts.map((part, i) => {
        if (part.includes('damage') || part.includes('MISS!')) {
            return <span key={i} className="text-red-400 font-bold">{part}</span>;
        }
        if (part.includes('HP')) {
            return <span key={i} className="text-green-400 font-bold">{part}</span>;
        }
        if (part.includes('CRITICAL HIT!')) {
            return <span key={i} className="text-amber-400 font-black tracking-widest">{part}</span>;
        }
        return part;
    });
}

export function AdventureView({ character, onReset, initialScene, initialLog }: AdventureViewProps) {
    const [scene, setScene] = useState<Scene | null>(initialScene || null);
    const [log, setLog] = useState<LogEntry[]>(initialLog || []);
    const [showSheet, setShowSheet] = useState(false);
    const [charState, setCharState] = useState<Character>(character);
    const [combatState, setCombatState] = useState<CombatState | null>(null);
    const [showCamp, setShowCamp] = useState(false);
    const [scenesSinceLongRest, setScenesSinceLongRest] = useState(8);
    const [showSaveMenu, setShowSaveMenu] = useState(false);
    const [saveSlots, setSaveSlots] = useState<(SaveSlotInfo | null)[]>([]);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [showSpellMenu, setShowSpellMenu] = useState(false);
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const initialized = useRef(false);
    const combatEndedRef = useRef(false);  // Prevents useEffect from restarting combat after boss/stabilize

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            if (initialScene) {
                // If loading a game, reset combat lock if it's not a combat scene
                if (initialScene.type !== 'combat') {
                    combatEndedRef.current = false;
                }
            } else {
                let firstScene: Scene;
                if (charState.campaignState && charState.campaignState.mode === 'campaign') {
                    const { scene: campScene, updatedState } = getNextCampaignScene(charState.campaignState, charState.level);
                    firstScene = campScene;
                    setCharState((prev: Character) => ({ ...prev, campaignState: updatedState }));
                } else {
                    firstScene = generateNextScene(null, charState.level, charState.quests, charState);
                }
                setScene(firstScene);
                addLog(firstScene.description, 'narrative');
            }
        }
    }, []);

    useEffect(() => {
        // Reset combatEndedRef when scene changes to a non-combat scene
        if (scene && scene.type !== 'combat') {
            combatEndedRef.current = false;
        }

        if (scene?.type === 'combat' && !combatState && charState.hp.current > 0 && !combatEndedRef.current) {
            const newState = startCombat(charState, scene);
            setCombatState(newState);
            newState.log.forEach(l => addLog(l, 'info'));
        }

        // Auto-save on scene transitions (non-combat only)
        if (scene && scene.type !== 'combat' && charState.hp.current > 0) {
            autoSave(charState, scene, log);
        }
    }, [scene]);

    const addLog = (text: string, type: LogEntry['type']) => {
        setLog(prev => [...prev, { text, type }]);
    };

    // Helper: Campaign-aware scene transition
    const advanceCampaignScene = (currentChar: Character, currentSceneId: string) => {
        if (currentChar.campaignState && currentChar.campaignState.mode === 'campaign') {
            const { scene: campScene, updatedState } = getNextCampaignScene(currentChar.campaignState, currentChar.level);
            setCharState((prev: Character) => ({ ...prev, campaignState: updatedState }));
            return campScene;
        } else {
            return generateNextScene(currentSceneId, currentChar.level, currentChar.quests, currentChar);
        }
    };

    // Helper: Handle boss victory in campaign mode
    const handleBossVictory = (currentChar: Character, currentScene: Scene) => {
        if (!currentChar.campaignState) return false;
        if (!currentScene.isBoss) return false;

        let nextCampaignState = { ...currentChar.campaignState } as NonNullable<Character['campaignState']>;
        if (currentScene.setFlags) nextCampaignState.flags = { ...nextCampaignState.flags, ...currentScene.setFlags };
        if (!nextCampaignState.defeatedBosses.includes(currentScene.id)) nextCampaignState.defeatedBosses.push(currentScene.id);
        nextCampaignState = advanceChapter(nextCampaignState);

        setCharState((prev: Character) => ({ ...prev, campaignState: nextCampaignState }));
        combatEndedRef.current = true;  // Prevent useEffect from restarting combat
        setCombatState(null);

        setTimeout(() => {
            const nextScene = getChapterIntroScene(nextCampaignState);
            if (nextScene) {
                setScene(nextScene);
                addLog("---", 'info');
                addLog(nextScene.description, 'narrative');
            } else if (nextCampaignState.flags.campaign_complete) {
                // Campaign complete - get the victory scene
                const { scene: victoryScene, updatedState: finalState } = getNextCampaignScene(nextCampaignState, currentChar.level);
                setCharState((prev: Character) => ({ ...prev, campaignState: finalState }));
                setScene(victoryScene);
                addLog("---", 'info');
                addLog(victoryScene.description, 'narrative');
            }
        }, 3000);
        return true;
    };

    const handleRest = (type: 'short' | 'long') => {
        if (type === 'short') {
            const result = performShortRest(charState);
            setCharState(result.character);
            addLog(result.message, 'info');
        } else {
            const result = performLongRest(charState);
            setCharState(result.character);
            setScenesSinceLongRest(0);
            addLog(result.message, 'success');
            setShowCamp(false);
            addLog("You feel refreshed and ready for adventure.", 'narrative');
        }
    };

    const handleCombatAction = (action: string, spellId?: string) => {
        if (!combatState) return;

        if (action === 'spell') {
            setShowSpellMenu(true);
            return;
        }

        // Find the targeted enemy (or first living enemy)
        const player = combatState.turnOrder.find(c => c.type === 'player');
        const livingEnemies = combatState.turnOrder.filter(c => c.type === 'enemy' && c.hp > 0);
        const enemy = livingEnemies.find(e => e.id === selectedTargetId) || livingEnemies[0];

        if (!player || !enemy) return;

        let dmg = 0;
        let logMsg = '';
        let healing = 0;

        if (action === 'cast' && spellId) {
            const result = castSpell(player, enemy, spellId);
            dmg = result.damage || 0;
            healing = result.healing || 0;
            logMsg = result.log;
            addLog(logMsg, (dmg > 0 || healing > 0) ? 'success' : 'info');

            // Deduct Slot if leveled
            const spell = SPELLS[spellId];
            if (spell.level > 0) {
                setCharState(prev => {
                    const slots = prev.resources?.['Spell Slots'];
                    if (slots) {
                        return {
                            ...prev,
                            resources: {
                                ...prev.resources,
                                'Spell Slots': { ...slots, current: Math.max(0, slots.current - 1) }
                            }
                        };
                    }
                    return prev;
                });
            }
            setShowSpellMenu(false);

            // --- APPLY SPELL DAMAGE TO ENEMY ---
            let spellState = combatState;
            if (dmg > 0) {
                const updatedOrder = spellState.turnOrder.map(c =>
                    c.id === enemy.id ? { ...c, hp: Math.max(0, c.hp - dmg) } : c
                );
                spellState = { ...spellState, turnOrder: updatedOrder };

                // Check if targeted enemy just died
                const targetAfter = updatedOrder.find(c => c.id === enemy.id);
                if (targetAfter && targetAfter.hp <= 0) {
                    const xpReward = enemy.xpReward || (50 * Math.max(1, Math.floor(enemy.maxHp / 10)));
                    addLog(`You defeated the ${enemy.name}! (+${xpReward} XP)`, 'success');

                    let newChar = { ...charState, xp: charState.xp + xpReward };
                    const questResult = checkQuestProgress(newChar, { type: 'kill', target: enemy.name });
                    newChar = questResult.character;
                    questResult.messages.forEach(msg => addLog(msg, 'success'));

                    const { leveledUp, newCharacter } = checkLevelUp(newChar);
                    if (leveledUp) {
                        newChar = newCharacter;
                        addLog(`🌟 LEVEL UP! You are now Level ${newChar.level}! Max HP increased to ${newChar.hp.max}.`, 'success');
                    }

                    setCharState(newChar);
                    setSelectedTargetId(null);

                    // Check if ALL enemies are dead
                    const allEnemiesDead = updatedOrder.filter(c => c.type === 'enemy').every(c => c.hp <= 0);

                    // Special Campaign Logic: Boss Victory via Spell
                    if (enemy.hp <= 0 && scene?.isBoss && charState.campaignState) {
                        const handled = handleBossVictory({ ...charState, xp: charState.xp + (enemy.xpReward || 0) }, scene);
                        if (handled) return;
                    }

                    setTimeout(() => {
                        if (allEnemiesDead) {
                            const loot = generateLoot(charState.level);
                            setCharState(prev => ({
                                ...prev,
                                wallet: { ...prev.wallet, gp: prev.wallet.gp + loot.gp },
                                inventory: [...prev.inventory, ...loot.items]
                            }));
                            addLog(`Victory!`, 'success');
                            addLog(`Loot: ${loot.gp}gp ${loot.items.length > 0 ? `and ${loot.items.map(i => i.name).join(', ')}` : ''}`, 'success');

                            setCombatState(null);

                            setTimeout(() => {
                                if (scene) {
                                    const next = advanceCampaignScene(charState, scene.id);
                                    setScene(next);
                                    setScenesSinceLongRest(prev => prev + 1);
                                    addLog("---", 'info');
                                    addLog(next.description, 'narrative');
                                }
                            }, 1500);
                            return;
                        }
                    }, 1000);
                }
            }

            // --- APPLY SPELL HEALING TO PLAYER ---
            if (healing > 0) {
                const newPlayerHp = Math.min(player.maxHp, player.hp + healing);
                const updatedOrder = spellState.turnOrder.map(c =>
                    c.type === 'player' ? { ...c, hp: newPlayerHp } : c
                );
                spellState = { ...spellState, turnOrder: updatedOrder };

                setCharState(prev => ({
                    ...prev,
                    hp: { ...prev.hp, current: Math.min(prev.hp.max, prev.hp.current + healing) }
                }));
            }

            // --- ENEMY AI TURN AFTER SPELL ---
            const livingEnemiesAfterSpell = spellState.turnOrder.filter(c => c.type === 'enemy' && c.hp > 0);
            let aiStateSpell = spellState;
            let totalEnemyDmgSpell = 0;

            for (const aiEnemy of livingEnemiesAfterSpell) {
                aiStateSpell = nextTurn(aiStateSpell);
                const atkBonus = aiEnemy.attackBonus ?? Math.max(2, Math.floor(aiEnemy.maxHp / 10));
                const atkRoll = Math.floor(Math.random() * 20) + 1;
                const atkTotal = atkRoll + atkBonus;
                const pAC = player.ac;

                if (atkRoll === 20 || (atkRoll !== 1 && atkTotal >= pAC)) {
                    const isCrit = atkRoll === 20;
                    let baseDmg = Math.floor(Math.random() * 6) + 1;
                    if (aiEnemy.damageDice) {
                        const parts = aiEnemy.damageDice.split('d').map(Number);
                        baseDmg = 0;
                        for (let d = 0; d < (parts[0] || 1); d++) baseDmg += Math.floor(Math.random() * (parts[1] || 6)) + 1;
                    }
                    const eDmg = isCrit ? baseDmg * 2 : baseDmg;
                    totalEnemyDmgSpell += eDmg;
                    const hitMsg = `${isCrit ? '💥 CRITICAL! ' : ''}${aiEnemy.name} attacks! (${atkRoll}+${atkBonus}=${atkTotal} vs AC ${pAC}) - ${eDmg} damage!`;
                    aiStateSpell = { ...aiStateSpell, log: [...aiStateSpell.log, hitMsg] };
                    addLog(hitMsg, 'failure');
                } else {
                    const missMsg = `${aiEnemy.name} swings and misses! (${atkRoll}+${atkBonus}=${atkTotal} vs AC ${pAC})`;
                    aiStateSpell = { ...aiStateSpell, log: [...aiStateSpell.log, missMsg] };
                    addLog(missMsg, 'info');
                }
            }

            if (totalEnemyDmgSpell > 0) {
                const finalOrder = aiStateSpell.turnOrder.map(c => c.type === 'player' ? { ...c, hp: Math.max(0, c.hp - totalEnemyDmgSpell) } : c);
                aiStateSpell = { ...aiStateSpell, turnOrder: finalOrder };
            }

            const finalPlayerHpSpell = aiStateSpell.turnOrder.find(c => c.type === 'player')?.hp || 0;
            setCharState(prev => ({
                ...prev,
                hp: { ...prev.hp, current: finalPlayerHpSpell }
            }));

            if (finalPlayerHpSpell <= 0) {
                addLog("💀 You fall unconscious! Death Saving Throws begin...", 'failure');
                setCharState(prev => ({
                    ...prev,
                    hp: { ...prev.hp, current: 0 },
                    deathSaves: { successes: 0, failures: 0 }
                }));
                aiStateSpell = nextTurn(aiStateSpell);
                setCombatState(aiStateSpell);
                return;
            }

            aiStateSpell = nextTurn(aiStateSpell);
            setCombatState(aiStateSpell);
            return;
        } else if (charState.hp.current <= 0 && action === 'deathsave') {
            const roll = Math.floor(Math.random() * 20) + 1;
            let newSaves = { ...charState.deathSaves };

            if (roll === 20) {
                // Nat 20: Regain 1 HP, conscious again!
                addLog(`💀 Death Save: Rolled a natural 20! You cling to life!`, 'success');
                setCharState(prev => ({
                    ...prev,
                    hp: { ...prev.hp, current: 1 },
                    deathSaves: { successes: 0, failures: 0 }
                }));
                // Update player HP in combat state
                const updatedOrder = combatState.turnOrder.map(c =>
                    c.type === 'player' ? { ...c, hp: 1 } : c
                );
                let newState = { ...combatState, turnOrder: updatedOrder };
                newState = nextTurn(newState);
                setCombatState(newState);
                return;
            } else if (roll === 1) {
                // Nat 1: Two failures
                newSaves.failures += 2;
                addLog(`💀 Death Save: Rolled a 1! Critical failure — two failures counted! (${newSaves.failures}/3 failures)`, 'failure');
            } else if (roll >= 10) {
                newSaves.successes += 1;
                addLog(`💀 Death Save: Rolled ${roll} — Success! (${newSaves.successes}/3 successes)`, 'success');
            } else {
                newSaves.failures += 1;
                addLog(`💀 Death Save: Rolled ${roll} — Failure! (${newSaves.failures}/3 failures)`, 'failure');
            }

            if (newSaves.failures >= 3) {
                // True death
                addLog(`☠️ You have failed your death saves. Your journey ends here...`, 'failure');
                setCharState(prev => ({
                    ...prev,
                    deathSaves: newSaves
                }));
                setCombatState(null);
                return;
            }

            if (newSaves.successes >= 3) {
                // Stabilized at 0 HP — end combat, transition to next scene
                addLog(`🛡️ You are stabilized! You regain consciousness with 1 HP.`, 'success');
                setCharState(prev => ({
                    ...prev,
                    hp: { ...prev.hp, current: 1 },
                    deathSaves: { successes: 0, failures: 0 }
                }));
                combatEndedRef.current = true;  // Prevent combat restart
                setCombatState(null);

                // Transition to next scene after a delay
                setTimeout(() => {
                    if (scene) {
                        const next = advanceCampaignScene(charState, scene.id);
                        setScene(next);
                        setScenesSinceLongRest(prev => prev + 1);
                        addLog("---", 'info');
                        addLog('You shakily get to your feet...', 'narrative');
                        addLog(next.description, 'narrative');
                    }
                }, 2000);
                return;
            }

            setCharState(prev => ({
                ...prev,
                deathSaves: newSaves
            }));

            // Enemy still gets a turn
            let newState = nextTurn(combatState);
            setCombatState(newState);
            return;
        }

        // If player is dying, only allow death saves
        if (charState.hp.current <= 0) {
            addLog("You are unconscious. Roll a death save!", 'failure');
            return;
        }

        let newState = combatState;
        let nextInventory = [...charState.inventory];

        // --- SPELL RESTRICTION ---
        if (action === 'spell') {
            if (!charState.class.canCastSpells) {
                addLog(`You are a ${charState.class.name} and cannot cast spells!`, 'failure');
                return;
            }
            // MVP Spell Slot Check
            if (charState.resources?.['Spell Slots']) {
                if (charState.resources['Spell Slots'].current <= 0) {
                    addLog(`You possess no remaining Spell Slots! Rest to recover magical energy.`, 'failure');
                    return;
                }
                const newResources = { ...charState.resources };
                newResources['Spell Slots'] = { ...newResources['Spell Slots'], current: newResources['Spell Slots'].current - 1 };
                // We must update state here, but we also modify 'newState' later? 
                // Actually setCharState is async. We need to pass this update through.
                // For simplified flow, we'll assume the setCharState at the end (victory) or just do it here?
                // If we don't win, we don't setCharState?? 
                // AdventureView only setsCharState on Victory or Rest. 
                // WAIT! We need to update charState immediately or combatState needs to track it?
                // Correct path: Check if we win this turn. If not, we still need to deduct slot. 
                // Simplest: Deduct immediately via setCharState, but we also need local reference for this render cycle?
                // React State update isn't instant.

                // Let's do setCharState(prev => ...) for resource deduction.
                setCharState(prev => ({ ...prev, resources: newResources }));
            }
        }

        // --- CLASS FEATURE (SECOND WIND) ---
        if (action === 'feature') {
            if (charState.class.name === 'Fighter') {
                const sw = charState.resources?.['Second Wind'];
                if (sw && sw.current <= 0) {
                    addLog("You have already used your Second Wind this rest.", 'failure');
                    return;
                }

                const healRoll = Math.floor(Math.random() * 10) + 1;
                const healAmount = healRoll + charState.level;

                const newResources = { ...charState.resources };
                if (newResources['Second Wind']) {
                    newResources['Second Wind'] = { ...newResources['Second Wind'], current: 0 };
                }

                setCharState(prev => ({
                    ...prev,
                    hp: { ...prev.hp, current: Math.min(prev.hp.max, prev.hp.current + healAmount) },
                    resources: newResources
                }));

                const updatedOrder = newState.turnOrder.map(c => c.id === player.id ? { ...c, hp: Math.min(c.maxHp, c.hp + healAmount) } : c);
                newState = { ...newState, turnOrder: updatedOrder };

                addLog(`Result: Second Wind heals for ${healAmount} HP! (${healRoll} + ${charState.level})`, 'success');
            } else {
                addLog("You don't have an active combat feature available.", 'info');
                return;
            }
        }


        // Player Turn: Attack or Spell
        if (action === 'attack' || action === 'spell') {
            // Calculate stats
            const strMod = Math.floor((charState.stats.Strength - 10) / 2);
            const dexMod = Math.floor((charState.stats.Dexterity - 10) / 2);
            const intMod = Math.floor((charState.stats.Intelligence - 10) / 2); // Wizard
            const wisMod = Math.floor((charState.stats.Wisdom - 10) / 2); // Cleric
            const profBonus = 2 + Math.floor((charState.level - 1) / 4);

            let attackMod = 0;
            let dmgMod = 0;

            if (action === 'attack') {
                // Check Weapon Properties
                const weapon = charState.equipment.mainHand;
                const isFinesse = weapon?.weaponStats?.properties.includes('finesse');
                const isRanged = weapon?.weaponStats?.properties.includes('range'); // or type check
                const magicBonus = weapon?.weaponStats?.magicBonus || 0; // Magic Weapon Bonus

                // 5e Rules:
                // Finesse: Choice of Str or Dex (We pick higher)
                // Ranged: Dex
                // Melee (Standard): Str

                if (isRanged) {
                    attackMod = dexMod + profBonus + magicBonus;
                    dmgMod = dexMod + magicBonus;
                } else if (isFinesse) {
                    const betterMod = Math.max(strMod, dexMod);
                    attackMod = betterMod + profBonus + magicBonus;
                    dmgMod = betterMod + magicBonus;
                } else {
                    attackMod = strMod + profBonus + magicBonus;
                    dmgMod = strMod + magicBonus;
                }
            } else if (action === 'spell') {
                // Use spellcasting ability
                const ability = charState.class.spellcastingAbility || 'Intelligence';
                const mod = ability === 'Intelligence' ? intMod : ability === 'Wisdom' ? wisMod : intMod;
                attackMod = mod + profBonus;
                dmgMod = mod; // Spells usually don't add mod to damage unless specific features, but we keep it for scaling
            }

            // Roll to hit (with advantage/disadvantage from conditions)
            const playerConditions = player.conditions || [];
            const targetConditions = enemy.conditions || [];
            const hasDisadv = hasDisadvantageOnAttacks(playerConditions);
            const hasAdv = hasAdvantageAgainst(targetConditions);

            let attackRoll: number;
            if (hasAdv && !hasDisadv) {
                attackRoll = rollWithAdvantage();
            } else if (hasDisadv && !hasAdv) {
                attackRoll = rollWithDisadvantage();
            } else {
                attackRoll = Math.floor(Math.random() * 20) + 1;
            }
            const totalAttack = attackRoll + attackMod;

            if (attackRoll === 20 || (attackRoll !== 1 && totalAttack >= enemy.ac)) {
                // Hit!
                const isCrit = attackRoll === 20;

                // Determine Damage Base
                let baseDamage = 0;
                if (action === 'attack') {
                    // Parse damage string "1d8" -> 8. Simple parser
                    const dmgStr = charState.equipment.mainHand?.weaponStats?.damage || "1d4"; // default punch
                    const sides = parseInt(dmgStr.split('d')[1]) || 4;
                    const diceCount = parseInt(dmgStr.split('d')[0]) || 1; // e.g. "2d6"
                    for (let i = 0; i < diceCount; i++) {
                        baseDamage += Math.floor(Math.random() * sides) + 1;
                    }
                } else {
                    // Spell damage placeholder
                    baseDamage = Math.floor(Math.random() * 8) + 1; // Firebolt-ish
                }

                const damage = isCrit ? (baseDamage * 2) + dmgMod : baseDamage + dmgMod;

                const hitMsg = `${isCrit ? '🎯 CRITICAL HIT! ' : ''}You ${action} the ${enemy.name}! (Rolled ${attackRoll}+${attackMod}=${totalAttack} vs AC ${enemy.ac}) - ${damage} damage!`;
                newState = { ...newState, log: [...newState.log, hitMsg] };
                addLog(hitMsg, 'success');


                const updatedOrder = newState.turnOrder.map(c => c.id === enemy.id ? { ...c, hp: Math.max(0, c.hp - damage) } : c);
                newState = { ...newState, turnOrder: updatedOrder };

                // Check if targeted enemy just died
                if (updatedOrder.find(c => c.id === enemy.id)?.hp === 0) {
                    // Award XP for this enemy
                    const xpReward = enemy.xpReward || (50 * Math.max(1, Math.floor(enemy.maxHp / 10)));
                    addLog(`You defeated the ${enemy.name}! (+${xpReward} XP)`, 'success');

                    // Check Quest Progress
                    let newChar = { ...charState, xp: charState.xp + xpReward };
                    const questResult = checkQuestProgress(newChar, { type: 'kill', target: enemy.name });
                    newChar = questResult.character;
                    questResult.messages.forEach(msg => addLog(msg, 'success'));

                    const { leveledUp, newCharacter } = checkLevelUp(newChar);
                    if (leveledUp) {
                        newChar = newCharacter;
                        addLog(`🌟 LEVEL UP! You are now Level ${newChar.level}! Max HP increased to ${newChar.hp.max}.`, 'success');
                    }

                    setCharState(newChar);
                    setSelectedTargetId(null); // Reset target

                    // Check if ALL enemies are dead
                    const allEnemiesDead = updatedOrder.filter(c => c.type === 'enemy').every(c => c.hp <= 0);
                    if (allEnemiesDead) {
                        // Campaign boss victory check (standard attack path)
                        if (scene?.isBoss && newChar.campaignState) {
                            const handled = handleBossVictory(newChar, scene);
                            if (handled) {
                                setCharState(newChar);
                                return;
                            }
                        }

                        // Full victory — generate loot and transition
                        const loot = generateLoot(newChar.level);
                        newChar = {
                            ...newChar,
                            wallet: { ...newChar.wallet, gp: newChar.wallet.gp + loot.gp },
                            inventory: [...newChar.inventory, ...loot.items]
                        };
                        addLog(`Victory!`, 'success');
                        addLog(`Loot: ${loot.gp}gp ${loot.items.length > 0 ? `and ${loot.items.map(i => i.name).join(', ')}` : ''}`, 'success');

                        setCharState(newChar);
                        setCombatState(null);

                        setTimeout(() => {
                            if (scene) {
                                const next = advanceCampaignScene(newChar, scene.id);
                                setScene(next);
                                setScenesSinceLongRest(prev => prev + 1);
                                addLog("---", 'info');
                                addLog(next.description, 'narrative');
                            }
                        }, 1500);
                        return;
                    }
                }
            } else {
                // Miss!
                const missMsg = `Your ${action} misses! (Rolled ${attackRoll}+${attackMod}=${totalAttack} vs AC ${enemy.ac})`;
                newState = { ...newState, log: [...newState.log, missMsg] };
                addLog(missMsg, 'failure');

            }
        } else if (action === 'potion') {
            const potionIndex = nextInventory.findIndex(i => i.id === 'potion_healing');
            if (potionIndex > -1) {
                const healAmount = Math.floor(Math.random() * 4) + Math.floor(Math.random() * 4) + 2; // 2d4 + 2
                const currentHp = newState.turnOrder.find(c => c.type === 'player')?.hp || charState.hp.current;
                const newHp = Math.min(charState.hp.max, currentHp + healAmount);

                nextInventory.splice(potionIndex, 1);

                const healMsg = `You drink a potion and heal for ${healAmount} HP.`;
                newState = { ...newState, log: [...newState.log, healMsg] };
                addLog(healMsg, 'success');

                const updatedOrder = newState.turnOrder.map(c => c.type === 'player' ? { ...c, hp: newHp } : c);
                newState = { ...newState, turnOrder: updatedOrder };

            } else {
                // Should not happen if button is hidden, but safe guard
                const fumbleMsg = `You fumble for a potion but find none!`;
                newState = { ...newState, log: [...newState.log, fumbleMsg] };
                addLog(fumbleMsg, 'failure');
            }

        } else if (action === 'flee') {
            // ... (keep Flee Logic) ...
            const roll = performCheck(charState, 'Stealth', 12);
            if (roll.success) {
                addLog("You successfully managed to escape!", 'success');
                setCombatState(null);
                setTimeout(() => {
                    if (scene) {
                        const next = advanceCampaignScene(charState, scene.id);
                        setScene(next);
                        setScenesSinceLongRest(prev => prev + 1);
                        addLog("---", 'info');
                        addLog(next.description, 'narrative');
                    }
                }, 1500);
                return;
            } else {
                const fleeFailMsg = `Failed to flee! (Rolled ${roll.total})`;
                newState = { ...newState, log: [...newState.log, fleeFailMsg] };
                addLog(fleeFailMsg, 'failure');
            }

        }

        const newPlayerHp = newState.turnOrder.find(c => c.type === 'player')?.hp || 0;

        // --- MULTI-ENEMY AI ---
        // Each living enemy gets an attack
        const livingEnemiesForAI = newState.turnOrder.filter(c => c.type === 'enemy' && c.hp > 0);
        let aiState = newState;
        let totalEnemyDmg = 0;

        for (const aiEnemy of livingEnemiesForAI) {
            aiState = nextTurn(aiState);

            const atkBonus = aiEnemy.attackBonus ?? Math.max(2, Math.floor(aiEnemy.maxHp / 10));
            const atkRoll = Math.floor(Math.random() * 20) + 1;
            const atkTotal = atkRoll + atkBonus;
            const pAC = player.ac;

            if (atkRoll === 20 || (atkRoll !== 1 && atkTotal >= pAC)) {
                const isCrit = atkRoll === 20;
                // Parse damageDice or fallback
                let baseDmg = Math.floor(Math.random() * 6) + 1;
                if (aiEnemy.damageDice) {
                    const parts = aiEnemy.damageDice.split('d').map(Number);
                    baseDmg = 0;
                    for (let d = 0; d < (parts[0] || 1); d++) baseDmg += Math.floor(Math.random() * (parts[1] || 6)) + 1;
                }
                const eDmg = isCrit ? baseDmg * 2 : baseDmg;
                totalEnemyDmg += eDmg;

                const hitMsg = `${isCrit ? '💥 CRITICAL! ' : ''}${aiEnemy.name} attacks! (${atkRoll}+${atkBonus}=${atkTotal} vs AC ${pAC}) - ${eDmg} damage!`;
                aiState = { ...aiState, log: [...aiState.log, hitMsg] };
                addLog(hitMsg, 'failure');
            } else {
                const missMsg = `${aiEnemy.name} swings and misses! (${atkRoll}+${atkBonus}=${atkTotal} vs AC ${pAC})`;
                aiState = { ...aiState, log: [...aiState.log, missMsg] };
                addLog(missMsg, 'info');
            }
        }

        // Apply total enemy damage to player
        if (totalEnemyDmg > 0) {
            const finalOrder = aiState.turnOrder.map(c => c.type === 'player' ? { ...c, hp: Math.max(0, c.hp - totalEnemyDmg) } : c);
            aiState = { ...aiState, turnOrder: finalOrder };
        }

        const finalPlayerHp = aiState.turnOrder.find(c => c.type === 'player')?.hp || 0;
        setCharState(prev => ({
            ...prev,
            hp: { ...prev.hp, current: finalPlayerHp },
            inventory: nextInventory
        }));

        if (finalPlayerHp <= 0) {
            addLog("💀 You fall unconscious! Death Saving Throws begin...", 'failure');
            setCharState(prev => ({
                ...prev,
                hp: { ...prev.hp, current: 0 },
                inventory: nextInventory,
                deathSaves: { successes: 0, failures: 0 }
            }));
            aiState = nextTurn(aiState);
            setCombatState(aiState);
            return;
        }

        aiState = nextTurn(aiState);
        setCombatState(aiState);
    };


    const handleChoice = (choiceId: string) => {
        if (!scene) return;

        // Quest Giver Logic
        if (choiceId === 'find_quest') {
            let newQuest: Quest | null = null;

            // If in Campaign Mode, try to get a chapter-specific side quest
            if (charState.campaignState && charState.campaignState.mode === 'campaign') {
                const chapterQuests = getCampaignSideQuests(charState.campaignState.chapter, charState.level);
                // Filter out quests the player already has
                const availableQuests = chapterQuests.filter(cq =>
                    !charState.quests.some(q => q.title === cq.title)
                );

                if (availableQuests.length > 0) {
                    newQuest = availableQuests[Math.floor(Math.random() * availableQuests.length)];
                }
            }

            // Fallback to random sandbox quest
            if (!newQuest) {
                newQuest = generateQuest(charState.level);
            }

            setCharState((prev: Character) => ({
                ...prev,
                quests: [...prev.quests, newQuest!]
            }));

            addLog(`📜 New Quest Accepted: ${newQuest.title}`, 'success');
            addLog(newQuest.description, 'narrative');
            addLog(`Objective: Defeat ${newQuest.objectives[0].count} ${newQuest.objectives[0].target}(s)`, 'info');
            return;
        }

        // Shop & Town Logic
        if (choiceId === 'shop') {
            setScene(generateShopScene(charState.inventory, charState.level));
            addLog("You enter the shop.", 'narrative');
            return;
        }
        if (choiceId.startsWith('sell_item_')) {
            const indexStr = choiceId.replace('sell_item_', '');
            const index = parseInt(indexStr);
            const item = charState.inventory[index];

            if (item) {
                const sellPriceGp = Math.floor((item.value || 0) / 200);

                // Remove from inventory
                const newInventory = [...charState.inventory];
                newInventory.splice(index, 1);

                setCharState(prev => ({
                    ...prev,
                    wallet: { ...prev.wallet, gp: prev.wallet.gp + sellPriceGp },
                    inventory: newInventory
                }));

                addLog(`Sold ${item.name} for ${sellPriceGp}gp.`, 'success');

                // Refresh Scene to update choices
                setScene(generateShopScene(newInventory, charState.level));
            }
            return;
        }

        if (choiceId === 'leave_shop') {
            const next = advanceCampaignScene(charState, scene.id);
            setScene(next);
            addLog("You leave the shop.", 'narrative');
            addLog("---", 'info');
            addLog(next.description, 'narrative');
            return;
        }

        // Inn Rest Logic
        if (choiceId === 'rest') {
            const result = performLongRest(charState);
            setCharState(result.character);
            setScenesSinceLongRest(0);
            addLog(result.message, 'success');
            addLog("You sleep soundly in a warm bed.", 'narrative');

            setTimeout(() => {
                const next = advanceCampaignScene(charState, scene.id);
                setScene(next);
                addLog("---", 'info');
                addLog(next.description, 'narrative');
            }, 1500);
            return;
        }

        if (choiceId.startsWith('buy_')) {
            const itemId = choiceId.replace('buy_', '');
            const item = getItem(itemId);

            if (item) {
                const costGp = Math.ceil(item.value / 100);

                if (charState.wallet.gp >= costGp) {
                    setCharState(prev => ({
                        ...prev,
                        wallet: { ...prev.wallet, gp: prev.wallet.gp - costGp },
                        inventory: [...prev.inventory, item]
                    }));
                    addLog(`Bought ${item.name} for ${costGp}gp.`, 'success');
                } else {
                    addLog("Not enough gold!", 'failure');
                }
            } else {
                addLog(`Error: Item '${itemId}' not found in database.`, 'failure');
                console.error(`Shop Error: Item ID '${itemId}' does not exist in ITEMS database.`);
            }
            return;
        }

        const choice = scene.choices.find(c => c.id === choiceId);
        if (!choice) return;

        addLog(`> ${choice.text}`, 'info');

        let success = true;
        let nextCharState = { ...charState };

        if (choice.requiredCheck) {
            const result = performCheck(charState, choice.requiredCheck.skill, choice.requiredCheck.dc);
            success = result.success;
            addLog(`[${choice.requiredCheck.skill} Check] Rolled ${result.roll} + ${result.mod} (mod) ${result.bonus ? `+ ${result.bonus} (prof) ` : ''}= ${result.total} (DC ${choice.requiredCheck.dc})`, success ? 'success' : 'failure');
        }

        if (choice.consequence) {
            const outcomeText = success ? choice.consequence.success : choice.consequence.failure;
            addLog(outcomeText, success ? 'success' : 'failure');

            // Handle Costs (e.g. buying a potion)
            let affordable = true;
            if (choice.consequence.cost) {
                const costGp = Math.floor(choice.consequence.cost / 100);
                if (charState.wallet.gp >= costGp) {
                    nextCharState = {
                        ...nextCharState,
                        wallet: { ...nextCharState.wallet, gp: nextCharState.wallet.gp - costGp }
                    };
                    addLog(`Spent ${costGp}gp.`, "info");
                } else {
                    affordable = false;
                    success = false;
                    addLog("Not enough gold!", "failure");
                }
            }

            // Handle Rewards (Gold or Items)
            if (choice.consequence.reward && affordable) {
                const rewardStr = choice.consequence.reward;
                const rewardMatch = rewardStr.match(/(-?\d+)gp/);

                if (rewardMatch) {
                    const gpAmount = parseInt(rewardMatch[1]);
                    // Prevent positive rewards on failure
                    if (!(gpAmount > 0 && !success)) {
                        nextCharState = {
                            ...nextCharState,
                            wallet: { ...nextCharState.wallet, gp: nextCharState.wallet.gp + gpAmount }
                        };
                        if (gpAmount > 0) addLog(`You gained ${gpAmount}gp!`, 'success');
                        else addLog(`You lost ${Math.abs(gpAmount)}gp.`, 'failure');
                    }
                } else if (!rewardStr.endsWith('xp') && (success || choice.id === 'trade')) {
                    // Treat as an item ID
                    const item = getItem(rewardStr);
                    if (item) {
                        nextCharState = {
                            ...nextCharState,
                            inventory: [...nextCharState.inventory, item]
                        };
                        addLog(`You received an item: ${item.name}!`, 'success');
                    }
                }
            }

            // Handle Damage on failure
            if (!success && choice.consequence.damage) {
                nextCharState = {
                    ...nextCharState,
                    hp: { ...nextCharState.hp, current: Math.max(0, nextCharState.hp.current - (choice.consequence?.damage || 0)) }
                };
                addLog(`You took ${choice.consequence.damage} damage!`, 'failure');
            }
        }

        // Apply any flags set by this scene before transitioning
        if (scene.setFlags && nextCharState.campaignState) {
            nextCharState = {
                ...nextCharState,
                campaignState: {
                    ...nextCharState.campaignState,
                    flags: { ...nextCharState.campaignState.flags, ...scene.setFlags }
                }
            };
        }

        // Apply accumulated state changes immediately
        setCharState(nextCharState);

        setTimeout(() => {
            // Special Case: Failed Intimidation vs Bandits -> Trigger Combat
            if (choiceId === 'intimidate' && !success && scene.description.includes('toll')) {
                const banditMsgs = [
                    "The bandits draw their weapons! 'You made a mistake, traveler!'",
                    "A fight breaks out!",
                ];
                banditMsgs.forEach(m => addLog(m, 'failure'));

                // Manually construct bandit combat scene
                const banditEncounter = {
                    type: 'combat',
                    description: "The bandits attack!",
                    enemy: "Bandit",
                    hp: 11,
                    ac: 12
                };

                // We need to use similar logic as generateNextScene's combat block
                // But simplified for this forced event
                const baseEnemy = { name: banditEncounter.enemy, hp: banditEncounter.hp, ac: banditEncounter.ac };
                // Re-using scaleEnemy from logic would be best but it's not imported directly here easily without changing imports?
                // Actually it imports { generateNextScene } from logic.. 
                // We can't access scaleEnemy easily unless we import it or duplicate logic.
                // Wait, performCheck is imported. Let's import scaleEnemy too or just simple math.
                // Actually, let's just make generateNextScene handle it? No, that's complex state.
                // Simple inline scaling:
                const scaledHp = banditEncounter.hp + (charState.level * 5);

                const banditScene: Scene = {
                    id: 'combat_bandit_' + Math.random(),
                    title: 'Bandit Ambush',
                    description: 'The bandits surround you, weapons drawn.',
                    type: 'combat',
                    enemy: { name: 'Bandit', hp: scaledHp, ac: 12 },
                    choices: [
                        { id: 'melee', text: 'Attack!', consequence: { success: '', failure: '' } },
                        { id: 'magic', text: 'Cast Spell!', consequence: { success: '', failure: '' } },
                        { id: 'run', text: 'Flee!', consequence: { success: '', failure: '' } }
                    ]
                };
                setScene(banditScene);
                setCombatState(null); // Will trigger effect to start combat
                return;
            }

            let next: Scene;
            if (nextCharState.campaignState && nextCharState.campaignState.mode === 'campaign') {
                const { scene: campScene, updatedState } = getNextCampaignScene(nextCharState.campaignState, nextCharState.level);
                next = campScene;
                setCharState((prev: Character) => ({ ...prev, campaignState: updatedState }));
            } else {
                next = generateNextScene(scene.id, nextCharState.level, nextCharState.quests, nextCharState);
            }
            setScene(next);
            setCombatState(null);
            setScenesSinceLongRest(prev => prev + 1);
            addLog("---", 'info');
            addLog(next.description, 'narrative');
        }, 1500);
    };



    if (charState.hp.current <= 0 && charState.deathSaves?.failures >= 3) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-red-600 animate-in zoom-in duration-500">
                <h1 className="text-6xl font-black mb-6 uppercase tracking-widest drop-shadow-lg">Game Over</h1>
                <p className="text-slate-400 text-xl mb-8">Your journey ends here...</p>
                <button
                    onClick={onReset}
                    className="px-8 py-3 bg-red-900/50 hover:bg-red-800 border border-red-600 rounded text-red-100 font-bold transition-all"
                >
                    Return to Title
                </button>
            </div>
        );
    }

    if (!scene) return <div className="text-white text-center mt-20">Loading world...</div>;

    return (
        <div className="flex flex-col h-screen max-w-6xl mx-auto p-4 gap-4">
            {/* ... Top Bar Same ... */}
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-amber-500 overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-amber-600 to-slate-900" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-100">{charState.name}</h2>
                        <div className="bg-slate-800 h-2 w-32 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full transition-all" style={{ width: `${(charState.hp.current / charState.hp.max) * 100}%` }} />
                        </div>
                        <span className="text-xs text-red-400 block">{charState.hp.current}/{charState.hp.max} HP</span>

                        <div className="bg-slate-800 h-1 w-32 rounded-full overflow-hidden mt-1">
                            <div className="bg-amber-500 h-full transition-all" style={{ width: `${(charState.xp / charState.maxXp) * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-amber-500 block">Lvl {charState.level} ({charState.xp}/{charState.maxXp} XP)</span>
                        <span className="text-[10px] text-yellow-400 block mt-0.5">💰 {charState.wallet.gp} GP</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {combatState && <div className="px-3 py-1 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm font-bold animate-pulse">COMBAT ACTIVE</div>}
                    {saveMessage && <div className="px-3 py-1 bg-green-900/50 border border-green-600 rounded text-green-200 text-xs animate-in fade-in">{saveMessage}</div>}
                    <button
                        onClick={() => {
                            setSaveSlots(getSaveSlotInfo());
                            setShowSaveMenu(!showSaveMenu);
                        }}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-emerald-400 border border-slate-600 transition-colors text-sm"
                    >
                        💾 Save
                    </button>
                    <button
                        onClick={() => setShowSheet(!showSheet)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-amber-500 border border-slate-600 transition-colors"
                    >
                        {showSheet ? 'Hide Sheet' : 'Show Sheet'}
                    </button>
                </div>
            </div>

            {/* Save Menu Overlay */}
            {showSaveMenu && (
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 animate-in slide-in-from-top">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-wider">💾 Save Slots</h3>
                        <button onClick={() => setShowSaveMenu(false)} className="text-slate-400 hover:text-white text-sm">✕ Close</button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {[0, 1, 2].map(slot => {
                            const info = saveSlots[slot];
                            return (
                                <div key={slot} className="bg-slate-800 border border-slate-600 rounded-lg p-3">
                                    <div className="text-xs text-slate-400 mb-1">Slot {slot + 1}</div>
                                    {info ? (
                                        <>
                                            <div className="text-sm text-slate-200 font-bold">{info.characterName}</div>
                                            <div className="text-xs text-slate-400">Lv {info.level} {info.raceName} {info.className}</div>
                                            <div className="text-xs text-slate-500">{info.hp.current}/{info.hp.max} HP • {info.gp} GP</div>
                                            <div className="text-[10px] text-slate-600 mt-1">{new Date(info.timestamp).toLocaleString()}</div>
                                        </>
                                    ) : (
                                        <div className="text-xs text-slate-500 italic">Empty</div>
                                    )}
                                    <button
                                        onClick={() => {
                                            if (saveGame(slot, charState, scene, log)) {
                                                setSaveMessage(`Saved to Slot ${slot + 1}!`);
                                                setSaveSlots(getSaveSlotInfo());
                                                setTimeout(() => setSaveMessage(null), 2000);
                                            }
                                        }}
                                        className="w-full mt-2 px-2 py-1 bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-700 rounded text-emerald-200 text-xs font-bold"
                                    >
                                        {info ? 'Overwrite' : 'Save Here'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
                <div className={`flex-1 flex flex-col bg-slate-900 rounded-xl border border-slate-700 overflow-hidden ${showSheet ? 'hidden md:flex' : 'flex'}`}>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
                        {log.map((entry, i) => (
                            <div key={i} className={`p-3 rounded-lg border-l-4 animate-in fade-in slide-in-from-bottom-2
                             ${entry.type === 'narrative' ? 'bg-slate-800/50 border-slate-500 text-slate-100 font-serif text-lg leading-relaxed' : ''}
                             ${entry.type === 'success' ? 'bg-green-900/20 border-green-500 text-green-200' : ''}
                             ${entry.type === 'failure' ? 'bg-red-900/20 border-red-500 text-red-200' : ''}
                             ${entry.type === 'info' ? 'text-slate-500 text-sm border-transparent italic' : ''}
                        `}>
                                {formatLogText(entry.text, entry.type)}
                            </div>
                        ))}
                    </div>

                    {/* Choices / Combat Interface */}
                    <div className="p-6 bg-slate-950 border-t border-slate-800">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-amber-500 text-sm uppercase font-bold tracking-widest flex items-center gap-2">
                                <Sword className="w-4 h-4" /> Actions
                            </h3>
                            {combatState && (
                                <div className="flex flex-wrap items-center gap-2">
                                    {combatState.turnOrder.filter(c => c.type === 'enemy').map((e: any) => {
                                        const isSelected = selectedTargetId === e.id || (!selectedTargetId && combatState.turnOrder.filter(c => c.type === 'enemy' && c.hp > 0)[0]?.id === e.id);
                                        const isDead = e.hp <= 0;
                                        return (
                                            <button
                                                key={e.id}
                                                onClick={() => !isDead && setSelectedTargetId(e.id)}
                                                disabled={isDead}
                                                className={`flex items-center gap-2 px-2 py-1 rounded border text-xs transition-all
                                                    ${isDead ? 'opacity-40 border-slate-700 cursor-not-allowed' : ''}
                                                    ${isSelected && !isDead ? 'border-amber-500 bg-amber-900/20 ring-1 ring-amber-500/50' : 'border-slate-700 hover:border-red-500'}
                                                `}
                                            >
                                                <span className={`font-bold ${isDead ? 'line-through text-slate-600' : 'text-red-300'}`}>{e.name}</span>
                                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-red-600 transition-all" style={{ width: `${(e.hp / e.maxHp) * 100}%` }} />
                                                </div>
                                                <span className="text-slate-400">{e.hp}/{e.maxHp}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>





                        {combatState ? (
                            <div className="grid grid-cols-3 gap-3">
                                {charState.hp.current <= 0 ? (
                                    /* Dying State — Death Saves Only */
                                    <button
                                        onClick={() => handleCombatAction('deathsave')}
                                        className="col-span-3 p-4 bg-red-950/50 hover:bg-red-900/60 border border-red-600 rounded-lg text-red-200 font-bold animate-pulse"
                                    >
                                        💀 Roll Death Save ({charState.deathSaves?.successes || 0}✓ / {charState.deathSaves?.failures || 0}✗)
                                    </button>

                                ) : showSpellMenu ? (
                                    <div className="col-span-3 grid grid-cols-2 gap-2 animate-in slide-in-from-right">
                                        <button
                                            onClick={() => setShowSpellMenu(false)}
                                            className="col-span-2 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-slate-400 text-xs font-bold"
                                        >
                                            ⬅ Back
                                        </button>
                                        {charState.knownSpells?.length ? charState.knownSpells.map(spellId => {
                                            const spell = SPELLS[spellId];
                                            if (!spell) return null;
                                            const isLeveled = spell.level > 0;
                                            const hasSlots = !isLeveled || (charState.resources['Spell Slots']?.current || 0) > 0;

                                            // Handle special case: Shield is a reaction, minimal support here or skip? 
                                            // Assume all Action spells for now.

                                            return (
                                                <button
                                                    key={spellId}
                                                    disabled={!hasSlots}
                                                    onClick={() => handleCombatAction('cast', spellId)}
                                                    className={`p-3 text-left rounded-lg border text-sm font-bold transition-all
                                                        ${hasSlots
                                                            ? 'bg-blue-900/40 hover:bg-blue-800/60 border-blue-600 text-blue-200'
                                                            : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'}
                                                    `}
                                                >
                                                    <div>{spell.name}</div>
                                                    <div className="text-[10px] font-normal opacity-70">
                                                        {isLeveled ? 'Lvl 1' : 'Cantrip'} • {spell.range}
                                                    </div>
                                                </button>
                                            );
                                        }) : (
                                            <div className="col-span-2 text-slate-500 italic text-center text-sm py-4">No spells known.</div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {/* ... combat buttons ... */}
                                        <button onClick={() => handleCombatAction('attack')} className="p-4 bg-red-900/30 hover:bg-red-900/50 border border-red-700 rounded-lg text-red-200 font-bold">
                                            ⚔️ Attack
                                        </button>

                                        {charState.class.canCastSpells && (
                                            <button onClick={() => handleCombatAction('spell')} className="p-4 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700 rounded-lg text-blue-200 font-bold">
                                                ✨ Cast Spell {charState.resources?.['Spell Slots'] ? `(${charState.resources['Spell Slots'].current}/${charState.resources['Spell Slots'].max})` : ''}
                                            </button>
                                        )}

                                        {charState.class.name === 'Fighter' && (
                                            <button onClick={() => handleCombatAction('feature')} className="p-4 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700 rounded-lg text-amber-200 font-bold">
                                                💪 Second Wind {charState.resources?.['Second Wind'] ? `(${charState.resources['Second Wind'].current}/${charState.resources['Second Wind'].max})` : ''}
                                            </button>
                                        )}
                                        {charState.inventory.some(i => i.id === 'potion_healing') && (
                                            <button onClick={() => handleCombatAction('potion')} className="p-4 bg-green-900/30 hover:bg-green-900/50 border border-green-700 rounded-lg text-green-200 font-bold">
                                                🧪 Potion
                                            </button>
                                        )}
                                        <button onClick={() => handleCombatAction('flee')} className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300">
                                            🏃 Flee
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : charState.hp.current <= 0 ? (
                            <div className="bg-red-950 p-6 rounded-lg border border-red-500/50">
                                <h4 className="text-red-400 font-bold text-xl mb-4">You are Unconscious</h4>
                                <p className="text-red-200 mb-6 font-serif">You survived, but were left unconscious. You rest for hours, recovering your senses. However, the world moved on without you.</p>
                                <button
                                    onClick={() => {
                                        setCharState(prev => ({
                                            ...prev,
                                            hp: { ...prev.hp, current: 1 },
                                            wallet: { ...prev.wallet, gp: Math.floor(prev.wallet.gp / 2) }
                                        }));
                                        addLog("You awaken with 1 HP. Some of your gold is missing.", "info");
                                        const next = generateNextScene(scene?.id || null, charState.level, charState.quests);
                                        setScene(next);
                                    }}
                                    className="p-4 bg-red-900 border border-red-700 hover:bg-red-800 text-white rounded font-bold w-full shadow-lg"
                                >
                                    Recover & Continue
                                </button>
                            </div>
                        ) : charState.pendingChoice ? (
                            <div className="bg-slate-900 p-6 rounded-lg border border-indigo-500/50 animate-in slide-in-from-bottom shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                <h4 className="font-serif text-indigo-400 text-xl font-bold mb-2">
                                    {charState.pendingChoice === 'subclass' ? 'Choose Your Subclass' : 'Level Up: Feat or Ability Score Improvement'}
                                </h4>
                                <p className="text-slate-400 text-sm mb-6">
                                    {charState.pendingChoice === 'subclass'
                                        ? `At 3rd level, a ${charState.class.name} chooses a specialization.`
                                        : 'You have reached a milestone! Choose to increase your ability scores or take a powerful Feat.'}
                                </p>

                                {charState.pendingChoice === 'subclass' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {charState.class.subclasses?.map((sub: any) => (
                                            <button
                                                key={sub.id}
                                                onClick={() => {
                                                    setCharState((prev: Character) => ({
                                                        ...prev,
                                                        subclass: sub,
                                                        pendingChoice: undefined
                                                    }));
                                                    addLog(`You are now a ${sub.name}!`, 'success');
                                                }}
                                                className="p-4 bg-slate-800 hover:bg-slate-750 border border-slate-600 hover:border-indigo-500 rounded-lg text-left transition-all group"
                                            >
                                                <div className="font-bold text-indigo-300 group-hover:text-indigo-200">{sub.name}</div>
                                                <div className="text-xs text-slate-400 mt-2 h-10">{sub.description}</div>
                                                <div className="mt-4 border-t border-slate-700 pt-2">
                                                    <span className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider">Features:</span>
                                                    <ul className="text-xs text-slate-500 mt-1 space-y-1">
                                                        {sub.features.map((f: any) => <li key={f.name}>• {f.name}</li>)}
                                                    </ul>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {charState.pendingChoice === 'feat_or_asi' && (
                                    <div className="space-y-6">
                                        <div className="bg-slate-950 p-4 border border-slate-800 rounded-lg">
                                            <h5 className="text-amber-500 font-bold mb-2">Option 1: Ability Score Improvement (ASI)</h5>
                                            <p className="text-xs text-slate-400 mb-3">Increase your primary ability score by +2 (simulated for ease of play).</p>
                                            <button
                                                onClick={() => {
                                                    setCharState((prev: Character) => {
                                                        const newStats = { ...prev.stats };
                                                        const primaryStat = (Object.entries(newStats) as [keyof typeof newStats, number][]).reduce((a, b) => a[1] > b[1] ? a : b)[0];
                                                        newStats[primaryStat] += 2;
                                                        return {
                                                            ...prev,
                                                            stats: newStats,
                                                            pendingChoice: undefined
                                                        };
                                                    });
                                                    addLog(`You improved your primary ability score!`, 'success');
                                                }}
                                                className="w-full py-2 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700 rounded text-amber-200 font-bold transition-all"
                                            >
                                                Take ASI (+2 to highest stat)
                                            </button>
                                        </div>

                                        <div className="bg-slate-950 p-4 border border-slate-800 rounded-lg">
                                            <h5 className="text-indigo-400 font-bold mb-2">Option 2: Choose a Feat</h5>
                                            <p className="text-xs text-slate-400 mb-3">Select a specialized talent that grants new capabilities.</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                                {Object.values(FEATS).map((feat: any) => {
                                                    const alreadyHas = charState.feats?.some((f: any) => f.id === feat.id);
                                                    return (
                                                        <button
                                                            key={feat.id}
                                                            disabled={alreadyHas}
                                                            onClick={() => {
                                                                setCharState((prev: Character) => ({
                                                                    ...prev,
                                                                    feats: [...(prev.feats || []), feat],
                                                                    pendingChoice: undefined
                                                                }));
                                                                addLog(`You gained the ${feat.name} feat!`, 'success');
                                                            }}
                                                            className={`p-3 text-left border rounded transition-all ${alreadyHas ? 'opacity-50 border-slate-800 bg-slate-900 cursor-not-allowed' : 'border-slate-700 hover:border-indigo-500 bg-slate-800 hover:bg-slate-750'}`}
                                                        >
                                                            <div className="font-bold text-sm text-slate-200">{feat.name} {alreadyHas && '(Owned)'}</div>
                                                            <div className="text-[10px] text-slate-400 mt-1 leading-snug">{feat.description}</div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : showCamp ? (
                            <div className="bg-slate-900 p-4 rounded-lg border border-amber-900/50 animate-in slide-in-from-bottom">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-serif text-amber-500 text-xl">Campfire</h4>
                                    <button onClick={() => setShowCamp(false)} className="text-slate-400 hover:text-white text-sm">Close</button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleRest('short')}
                                        disabled={charState.hp.hitDiceCurrent === 0 || charState.hp.current === charState.hp.max}
                                        className="p-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600 rounded-lg text-left"
                                    >
                                        <div className="font-bold text-slate-200">Short Rest</div>
                                        <div className="text-xs text-slate-400 mt-1">Spend 1 Hit Die to heal.</div>
                                        <div className="text-xs text-amber-500 mt-2">Remaining HD: {charState.hp.hitDiceCurrent}/{charState.hp.hitDiceMax}</div>
                                    </button>

                                    <button
                                        onClick={() => handleRest('long')}
                                        disabled={scenesSinceLongRest < 10}
                                        className="p-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600 rounded-lg text-left"
                                    >
                                        <div className="font-bold text-slate-200">Long Rest</div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {scenesSinceLongRest >= 10
                                                ? "Restore HP & Hit Dice."
                                                : `Unavailable (Wait ${10 - scenesSinceLongRest} scenes)`}
                                        </div>
                                        <div className="text-xs text-blue-400 mt-2">
                                            {scenesSinceLongRest >= 10 ? "Ready" : "Too dangerous to rest long."}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        ) : scene.type === 'combat' && combatEndedRef.current ? (
                            <div className="bg-slate-900 p-8 rounded-lg border border-amber-500/50 text-center animate-pulse">
                                <h4 className="font-serif text-amber-500 text-2xl mb-2">Victory!</h4>
                                <p className="text-slate-400">Taking a moment to catch your breath...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {scene.choices.map(choice => (
                                    <button
                                        key={choice.id}
                                        onClick={() => handleChoice(choice.id)}
                                        className="group relative p-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500 rounded-lg text-left transition-all"
                                    >
                                        <span className="block font-bold text-slate-200 group-hover:text-amber-400">{choice.text}</span>
                                        {choice.requiredCheck && (
                                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <Dices className="w-3 h-3" /> Check: {choice.requiredCheck.skill} (DC {choice.requiredCheck.dc})
                                            </span>
                                        )}
                                    </button>
                                ))}
                                {scene.type === 'exploration' && (
                                    <button
                                        onClick={() => setShowCamp(true)}
                                        className="p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-700 border-dashed rounded-lg text-center text-slate-400 hover:text-amber-500 transition-colors flex flex-col items-center justify-center gap-2"
                                    >
                                        <Tent className="w-5 h-5" />
                                        <span className="font-bold text-sm">Make Camp</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {showSheet && (
                    <div className="flex-1 md:max-w-md overflow-y-auto animate-in slide-in-from-right">
                        <CharacterSheet character={charState} />
                    </div>
                )}
            </div>
        </div >
    );
}
