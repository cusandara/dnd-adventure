import React, { useState, useEffect, useRef } from 'react';
import { Character, Scene, CombatState } from '@/types/dnd';
import { generateNextScene, performCheck, generateLoot, generateShopScene } from '@/lib/adventure-logic';
import { getItem } from '@/lib/dnd-rules/items';
import { generateQuest, checkQuestProgress } from '@/lib/quests';

// ... (keep imports)
import { CharacterSheet } from '../character/CharacterSheet';
import { Scroll, Sword, Dices, Tent } from 'lucide-react';
import { startCombat, nextTurn } from '@/lib/combat-logic';
import { checkLevelUp } from '@/lib/dnd-rules/leveling';
import { performShortRest, performLongRest } from '@/lib/rest-logic';

interface AdventureViewProps {
    character: Character;
    onReset: () => void;
}

export interface LogEntry {
    text: string;
    type: 'narrative' | 'success' | 'failure' | 'info';
}

export function AdventureView({ character, onReset }: AdventureViewProps) {
    const [scene, setScene] = useState<Scene | null>(null);
    const [log, setLog] = useState<LogEntry[]>([]);
    const [showSheet, setShowSheet] = useState(false);
    const [charState, setCharState] = useState(character);
    const [combatState, setCombatState] = useState<CombatState | null>(null);
    const [showCamp, setShowCamp] = useState(false);
    const [scenesSinceLongRest, setScenesSinceLongRest] = useState(8);
    const initialized = useRef(false);

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            const firstScene = generateNextScene(null, charState.level, charState.quests);
            setScene(firstScene);
            addLog(firstScene.description, 'narrative');
        }
    }, []);

    useEffect(() => {
        if (scene?.type === 'combat' && !combatState && charState.hp.current > 0) {
            const newState = startCombat(charState, scene);
            setCombatState(newState);
            newState.log.forEach(l => addLog(l, 'info'));
        }
    }, [scene]);

    const addLog = (text: string, type: LogEntry['type']) => {
        setLog(prev => [...prev, { text, type }]);
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

    const handleCombatAction = (action: 'attack' | 'spell' | 'flee' | 'potion') => {
        // ... (keep existing beginning) ...
        if (!combatState || !scene) return;

        const player = combatState.turnOrder.find(c => c.type === 'player');
        const enemy = combatState.turnOrder.find(c => c.type === 'enemy');

        if (!player || !enemy) return;

        let newState = combatState;
        let nextInventory = [...charState.inventory];

        // Player Turn: Attack or Spell
        if (action === 'attack' || action === 'spell') {
            // Calculate attack bonus
            const strMod = Math.floor((charState.stats.Strength - 10) / 2);
            const dexMod = Math.floor((charState.stats.Dexterity - 10) / 2);
            const intMod = Math.floor((charState.stats.Intelligence - 10) / 2);
            const profBonus = 2 + Math.floor((charState.level - 1) / 4);

            // Attack uses Str, Spell uses Int
            const attackMod = action === 'attack' ? strMod + profBonus : intMod + profBonus;

            // Roll to hit
            const attackRoll = Math.floor(Math.random() * 20) + 1;
            const totalAttack = attackRoll + attackMod;

            if (attackRoll === 20 || (attackRoll !== 1 && totalAttack >= enemy.ac)) {
                // Hit!
                const isCrit = attackRoll === 20;
                const baseDamage = Math.floor(Math.random() * 8) + 1;
                const damage = isCrit ? baseDamage * 2 : baseDamage + (action === 'attack' ? strMod : intMod);

                const hitMsg = `${isCrit ? '🎯 CRITICAL HIT! ' : ''}You ${action} the ${enemy.name}! (Rolled ${attackRoll}+${attackMod}=${totalAttack} vs AC ${enemy.ac}) - ${damage} damage!`;
                newState = { ...newState, log: [...newState.log, hitMsg] };
                addLog(hitMsg, 'success');


                const updatedOrder = newState.turnOrder.map(c => c.id === enemy.id ? { ...c, hp: Math.max(0, c.hp - damage) } : c);
                newState = { ...newState, turnOrder: updatedOrder };

                if (updatedOrder.find(c => c.id === enemy.id)?.hp === 0) {
                    // Victory Logic
                    const xpReward = 50 * Math.max(1, Math.floor(enemy.maxHp / 10));
                    const loot = generateLoot(Math.max(1, Math.floor(enemy.maxHp / 10)));

                    let newChar = {
                        ...charState,
                        xp: charState.xp + xpReward,
                        wallet: { ...charState.wallet, gp: charState.wallet.gp + loot.gp },
                        inventory: [...charState.inventory, ...loot.items]
                    };

                    addLog(`Victory! You defeated the ${enemy.name}.`, 'success');
                    addLog(`You gained ${xpReward} XP!`, 'info');
                    addLog(`Loot: ${loot.gp}gp ${loot.items.length > 0 ? `and ${loot.items.map(i => i.name).join(', ')}` : ''}`, 'success');

                    // Check Quest Progress
                    const questResult = checkQuestProgress(newChar, { type: 'kill', target: enemy.name });
                    newChar = questResult.character;
                    questResult.messages.forEach(msg => addLog(msg, 'success'));

                    const { leveledUp, newCharacter } = checkLevelUp(newChar);
                    if (leveledUp) {
                        newChar = newCharacter;
                        addLog(`🌟 LEVEL UP! You are now Level ${newChar.level}! Max HP increased to ${newChar.hp.max}.`, 'success');
                    }

                    setCharState(newChar);
                    setCombatState(null);

                    setTimeout(() => {
                        const next = generateNextScene(scene.id, newChar.level, newChar.quests);
                        setScene(next);
                        setScenesSinceLongRest(prev => prev + 1);
                        addLog("---", 'info');
                        addLog(next.description, 'narrative');
                    }, 1500);
                    return;
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
                    const next = generateNextScene(scene.id, charState.level);
                    setScene(next);
                    setScenesSinceLongRest(prev => prev + 1);
                    addLog("---", 'info');
                    addLog(next.description, 'narrative');
                }, 1500);
                return;
            } else {
                const fleeFailMsg = `Failed to flee! (Rolled ${roll.total})`;
                newState = { ...newState, log: [...newState.log, fleeFailMsg] };
                addLog(fleeFailMsg, 'failure');
            }

        }

        newState = nextTurn(newState);

        // Enemy Turn: Attack Roll vs Player AC
        // Calculate player AC (base 10 + Dex mod, or use equipped armor if available)
        const playerDexMod = Math.floor((charState.stats.Dexterity - 10) / 2);
        const playerAC = 10 + playerDexMod; // Base AC calculation (no armor equipped logic for now)

        // Enemy attack roll (d20 + attack bonus based on their stats)
        const enemyAttackBonus = Math.max(2, Math.floor(enemy.maxHp / 10)); // Simple scaling
        const enemyAttackRoll = Math.floor(Math.random() * 20) + 1;
        const enemyTotalAttack = enemyAttackRoll + enemyAttackBonus;

        if (enemyAttackRoll === 20 || (enemyAttackRoll !== 1 && enemyTotalAttack >= playerAC)) {
            // Enemy hits!
            const isCrit = enemyAttackRoll === 20;
            const baseDmg = Math.floor(Math.random() * 6) + 1;
            const enemyDmg = isCrit ? baseDmg * 2 : baseDmg;

            const enemyHitMsg = `${isCrit ? '💥 CRITICAL! ' : ''}The ${enemy.name} attacks! (${enemyAttackRoll}+${enemyAttackBonus}=${enemyTotalAttack} vs AC ${playerAC}) - ${enemyDmg} damage!`;
            newState = { ...newState, log: [...newState.log, enemyHitMsg] };
            addLog(enemyHitMsg, 'failure');


            const finalOrder = newState.turnOrder.map(c => c.type === 'player' ? { ...c, hp: Math.max(0, c.hp - enemyDmg) } : c);
            newState = { ...newState, turnOrder: finalOrder };
        } else {
            // Enemy misses!
            const enemyMissMsg = `The ${enemy.name} swings and misses! (${enemyAttackRoll}+${enemyAttackBonus}=${enemyTotalAttack} vs AC ${playerAC})`;
            newState = { ...newState, log: [...newState.log, enemyMissMsg] };
            addLog(enemyMissMsg, 'info');


            const finalOrder = newState.turnOrder; // No change to HP
            newState = { ...newState, turnOrder: finalOrder };
        }

        const newPlayerHp = newState.turnOrder.find(c => c.type === 'player')?.hp || 0;
        setCharState(prev => ({
            ...prev,
            hp: { ...prev.hp, current: newPlayerHp },
            inventory: nextInventory
        }));

        if (newPlayerHp <= 0) {
            addLog("You have been defeated...", 'failure');
            setCombatState(null); // End combat
            return;
        }

        newState = nextTurn(newState);
        setCombatState(newState);
    };


    const handleChoice = (choiceId: string) => {
        if (!scene) return;

        // Quest Giver Logic
        if (choiceId === 'find_quest') {
            const newQuest = generateQuest(charState.level);
            setCharState(prev => ({
                ...prev,
                quests: [...prev.quests, newQuest]
            }));
            addLog(`📜 New Quest Accepted: ${newQuest.title}`, 'success');
            addLog(newQuest.description, 'narrative');
            addLog(`Objective: Defeat ${newQuest.objectives[0].count} ${newQuest.objectives[0].target}(s)`, 'info');
            return;
        }

        // Shop & Town Logic
        if (choiceId === 'shop') {
            setScene(generateShopScene(charState.inventory));
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
                setScene(generateShopScene(newInventory));
            }
            return;
        }

        if (choiceId === 'leave_shop') {
            const next = generateNextScene(scene.id, charState.level, charState.quests);
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
                const next = generateNextScene(scene.id, charState.level, charState.quests);
                setScene(next);
                addLog("---", 'info');
                addLog(next.description, 'narrative');
            }, 1500);
            return;
        }

        if (choiceId === 'buy_potion') {
            // ... (keep buy logic) ...
            if (charState.wallet.gp >= 50) {
                const potion = getItem('potion_healing');
                if (potion) {
                    setCharState(prev => ({
                        ...prev,
                        wallet: { ...prev.wallet, gp: prev.wallet.gp - 50 },
                        inventory: [...prev.inventory, potion]
                    }));
                    addLog("Bought Potion of Healing.", 'success');
                }
            } else {
                addLog("Not enough gold!", 'failure');
            }
            return;
        }
        if (choiceId === 'buy_sword') {
            // ... (keep buy logic) ...
            if (charState.wallet.gp >= 15) {
                const sword = getItem('longsword');
                if (sword) {
                    setCharState(prev => ({
                        ...prev,
                        wallet: { ...prev.wallet, gp: prev.wallet.gp - 15 },
                        inventory: [...prev.inventory, sword]
                    }));
                    addLog("Bought Longsword.", 'success');
                }
            } else {
                addLog("Not enough gold!", 'failure');
            }
            return;
        }


        const choice = scene.choices.find(c => c.id === choiceId);
        if (!choice) return;

        addLog(`> ${choice.text}`, 'info');

        let success = true;

        if (choice.requiredCheck) {
            const result = performCheck(charState, choice.requiredCheck.skill, choice.requiredCheck.dc);
            success = result.success;
            addLog(`[${choice.requiredCheck.skill} Check] Rolled ${result.roll} + ${result.mod} (mod) ${result.bonus ? `+ ${result.bonus} (prof) ` : ''}= ${result.total} (DC ${choice.requiredCheck.dc})`, success ? 'success' : 'failure');
        }

        if (choice.consequence) {
            const outcomeText = success ? choice.consequence.success : choice.consequence.failure;
            addLog(outcomeText, success ? 'success' : 'failure');

            // Handle Gold Rewards (reward field like '10gp' or '-10gp')
            if (choice.consequence.reward) { // Allow reward even if not 'success' technically, dependent on logic
                const rewardMatch = choice.consequence.reward.match(/(-?\d+)gp/);
                if (rewardMatch) {
                    const gpAmount = parseInt(rewardMatch[1]);

                    // Prevent positive rewards on failure
                    if (gpAmount > 0 && !success) {
                        // logic fallthrough effectively skips reward
                    } else {
                        setCharState(prev => ({
                            ...prev,
                            wallet: { ...prev.wallet, gp: prev.wallet.gp + gpAmount }
                        }));
                        if (gpAmount > 0) {
                            addLog(`You gained ${gpAmount}gp!`, 'success');
                        } else {
                            addLog(`You lost ${Math.abs(gpAmount)}gp.`, 'failure');
                        }
                    }
                }
            }

            // Handle Damage on failure
            if (!success && choice.consequence.damage) {
                setCharState(prev => ({
                    ...prev,
                    hp: { ...prev.hp, current: Math.max(0, prev.hp.current - (choice.consequence?.damage || 0)) }
                }));
                addLog(`You took ${choice.consequence.damage} damage!`, 'failure');
            }
        }

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

            const next = generateNextScene(scene.id, charState.level, charState.quests);
            setScene(next);
            setCombatState(null);
            setScenesSinceLongRest(prev => prev + 1);
            addLog("---", 'info');
            addLog(next.description, 'narrative');
        }, 1500);
    };



    if (charState.hp.current <= 0) {
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
                    </div>
                </div>
                <div className="flex gap-2">
                    {combatState && <div className="px-3 py-1 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm font-bold animate-pulse">COMBAT ACTIVE</div>}
                    <button
                        onClick={() => setShowSheet(!showSheet)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-amber-500 border border-slate-600 transition-colors"
                    >
                        {showSheet ? 'Hide Sheet' : 'Show Sheet'}
                    </button>
                </div>
            </div>

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
                                {entry.text}
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
                                <div className="text-xs text-slate-400 flex items-center gap-2">
                                    <span>Enemy:</span>
                                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-600 transition-all"
                                            style={{ width: `${(combatState.turnOrder.find(c => c.type === 'enemy')?.hp || 0) / (combatState.turnOrder.find(c => c.type === 'enemy')?.maxHp || 1) * 100}%` }}
                                        />
                                    </div>
                                    <span>{combatState.turnOrder.find(c => c.type === 'enemy')?.hp} HP</span>
                                </div>
                            )}
                        </div>





                        {combatState ? (
                            <div className="grid grid-cols-3 gap-3">
                                {/* ... combat buttons ... */}
                                <button onClick={() => handleCombatAction('attack')} className="p-4 bg-red-900/30 hover:bg-red-900/50 border border-red-700 rounded-lg text-red-200 font-bold">
                                    ⚔️ Attack
                                </button>
                                <button onClick={() => handleCombatAction('spell')} className="p-4 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700 rounded-lg text-blue-200 font-bold">
                                    ✨ Cast Spell
                                </button>
                                {charState.inventory.some(i => i.id === 'potion_healing') && (
                                    <button onClick={() => handleCombatAction('potion')} className="p-4 bg-green-900/30 hover:bg-green-900/50 border border-green-700 rounded-lg text-green-200 font-bold">
                                        🧪 Potion
                                    </button>
                                )}
                                <button onClick={() => handleCombatAction('flee')} className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-slate-300">
                                    🏃 Flee
                                </button>
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
        </div>
    );
}
