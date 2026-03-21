import { Scene, Choice, Skill, Character, Item } from '@/types/dnd';
import { LOCATIONS, VILLAINS, PLOT_HOOKS, ENCOUNTERS, COMBAT_ENCOUNTERS, NON_COMBAT_ENCOUNTERS, TIER_1_ENCOUNTERS, TIER_2_ENCOUNTERS, TIER_3_ENCOUNTERS } from './dnd-rules/random-tables';
import { scaleEnemy } from './dnd-rules/leveling';
import { ITEMS, getItem } from './dnd-rules/items';
import { generateQuest } from './quests';
import { Quest } from '@/types/dnd';
import { getNextCampaignScene } from './campaign-logic';

// Simple Dice Roll
export function rollDie(sides: number = 20): number {
    return Math.floor(Math.random() * sides) + 1;
}

export function performCheck(character: Character, skill: Skill, dc: number): { success: boolean; roll: number; total: number; mod: number; bonus: number } {
    // Calculate modifier
    // Mapping Skill -> Attribute
    let statName: keyof typeof character.stats = 'Dexterity'; // Default

    // Strength
    if (['Athletics', 'Strength'].includes(skill as string)) statName = 'Strength';

    // Intelligence
    if (['Arcana', 'History', 'Nature', 'Religion', 'Investigation', 'Intelligence'].includes(skill as string)) statName = 'Intelligence';

    // Wisdom
    if (['Insight', 'Medicine', 'Perception', 'Survival', 'Animal Handling', 'Wisdom'].includes(skill as string)) statName = 'Wisdom';

    // Charisma
    if (['Deception', 'Intimidation', 'Performance', 'Persuasion', 'Charisma'].includes(skill as string)) statName = 'Charisma';

    // Constitution
    if (['Constitution'].includes(skill as string)) statName = 'Constitution';

    // Dexterity (Default but explicit check for others)
    if (['Acrobatics', 'Sleight of Hand', 'Stealth', 'Dexterity'].includes(skill as string)) statName = 'Dexterity';


    const statVal = character.stats[statName];
    const mod = Math.floor((statVal - 10) / 2);

    // Proficiency Check
    const isProficient = character.skills.includes(skill);
    const proficiencyBonus = 2 + Math.floor((character.level - 1) / 4); // Standard 5e progression

    const bonus = isProficient ? proficiencyBonus : 0;

    const roll = rollDie(20);
    const total = roll + mod + bonus;

    return { success: total >= dc, roll, total, mod, bonus };
}


export function generateLoot(level: number): { items: Item[], gp: number } {
    const loot: { items: Item[], gp: number } = { items: [], gp: 0 };

    // Tier 1 (Levels 1-4)
    if (level <= 4) {
        loot.gp = Math.floor(Math.random() * 20) + 5; // 5-25gp
        if (Math.random() < 0.15) { // 15% chance
            const keys = Object.keys(ITEMS).filter(k => ITEMS[k].rarity === 'common');
            if (keys.length) {
                const item = getItem(keys[Math.floor(Math.random() * keys.length)]);
                if (item) loot.items.push(item);
            }
        }
    }
    // Tier 2 (Levels 5-8)
    else if (level <= 8) {
        loot.gp = Math.floor(Math.random() * 50) + 20; // 20-70gp
        const roll = Math.random();
        if (roll < 0.25) { // 25% item chance
            const rarity = Math.random() < 0.8 ? 'common' : 'uncommon';
            const keys = Object.keys(ITEMS).filter(k => ITEMS[k].rarity === rarity);
            if (keys.length) {
                const item = getItem(keys[Math.floor(Math.random() * keys.length)]);
                if (item) loot.items.push(item);
            }
        }
    }
    // Tier 3+ (Levels 9+)
    else {
        loot.gp = Math.floor(Math.random() * 200) + 50; // 50-250gp
        const roll = Math.random();
        if (roll < 0.40) { // 40% item
            const rarity = Math.random() < 0.6 ? 'uncommon' : 'rare';
            const keys = Object.keys(ITEMS).filter(k => ITEMS[k].rarity === rarity);
            if (keys.length) {
                const item = getItem(keys[Math.floor(Math.random() * keys.length)]);
                if (item) loot.items.push(item);
            }
        }
    }

    return loot;
}

export function generateNextScene(
    previousSceneId: string | null,
    playerLevel: number = 1,
    activeQuests?: Quest[],
    character?: Character
): Scene {
    // If playing in Campaign Mode, delegate to campaign engine
    if (character?.campaignState && character.campaignState.mode === 'campaign') {
        const { scene } = getNextCampaignScene(character.campaignState, playerLevel);
        return scene;
    }

    // 10% Chance for a Town/Shop Scene in Sandbox Mode
    const isTown = Math.random() < 0.1;

    if (isTown) {
        const choices: Choice[] = [
            {
                id: 'shop',
                text: 'Visit the General Store',
                consequence: { success: 'You browse the wares.', failure: '' }
            },
            {
                id: 'rest',
                text: 'Stay at the Inn (Long Rest)',
                consequence: { success: 'You sleep soundly.', failure: '' }
            },
            {
                id: 'leave',
                text: 'Leave Town',
                consequence: { success: 'You head back into the wild.', failure: '' }
            }
        ];

        // If player has < 3 quests, add chance for a Quest Giver
        if (!activeQuests || activeQuests.filter(q => q.status === 'active').length < 3) {
            choices.splice(1, 0, {
                id: 'find_quest',
                text: 'Check the Job Board',
                consequence: { success: 'You look for work.', failure: 'Nothing catches your eye.' }
            });
        }

        return {
            id: 'town_' + Math.random().toString(36).substring(7),
            title: 'Nearby Town',
            description: 'You arrive at a safe settlement. Merchants and guards go about their business.',
            type: 'roleplay',
            choices
        };
    }

    // Quest Influence: Check if an active quest targets a specific enemy type
    let forcedEncounter: typeof ENCOUNTERS[0] | null = null;
    if (activeQuests) {
        const killObjective = activeQuests
            .filter(q => q.status === 'active')
            .flatMap(q => q.objectives)
            .find(o => o.type === 'kill' && o.current < o.count);

        if (killObjective && Math.random() < 0.5) { // 50% chance to find quest target
            const matchingHelper = ENCOUNTERS.find(e => e.enemy?.includes(killObjective.target));
            if (matchingHelper) {
                forcedEncounter = matchingHelper;
            } else {
                forcedEncounter = {
                    description: `You track down the ${killObjective.target}s you were hunting.`,
                    type: 'combat',
                    enemy: killObjective.target,
                    hp: 15 + (playerLevel * 5),
                    ac: 12
                } as any;
            }
        }
    }

    // Pick random elements
    const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

    let encounter = forcedEncounter;
    if (!encounter) {
        // 70% Chance for Non-Combat Encounter
        if (Math.random() < 0.7) {
            encounter = NON_COMBAT_ENCOUNTERS[Math.floor(Math.random() * NON_COMBAT_ENCOUNTERS.length)];
        } else {

            // Tiered Combat Encounters
            let pool = TIER_1_ENCOUNTERS;
            if (playerLevel >= 5 && playerLevel <= 8) pool = TIER_2_ENCOUNTERS;
            if (playerLevel >= 9) pool = TIER_3_ENCOUNTERS;

            // Mix in lower tiers for variety?
            // For now, strict tiers to show progression.

            encounter = pool[Math.floor(Math.random() * pool.length)];
        }
    }

    const id = Math.random().toString(36).substring(7);

    // Construct Description
    let description = `You arrive at ${location}. `;
    description += encounter.description;

    // Generate Choices based on type
    const choices: Choice[] = [];

    if (encounter.type === 'combat') {
        const combatEncounter = encounter as typeof COMBAT_ENCOUNTERS[0];
        const baseEnemy = { name: combatEncounter.enemy, hp: combatEncounter.hp, ac: combatEncounter.ac };
        const scaledEnemy = scaleEnemy(baseEnemy, playerLevel);
        const enemyName = scaledEnemy.name;

        choices.push({
            id: 'melee',
            text: 'Attack with your weapon!',
            requiredCheck: { skill: 'Athletics', dc: 12 + Math.floor((playerLevel - 1) / 2) },
            consequence: { success: `You strike the ${enemyName} down!`, failure: `The ${enemyName} counters and hits you!`, damage: Math.max(1, rollDie(4) + Math.floor(playerLevel / 2)) }
        });
        choices.push({
            id: 'magic',
            text: 'Cast a spell!',
            requiredCheck: { skill: 'Arcana', dc: 13 + Math.floor((playerLevel - 1) / 2) },
            consequence: { success: `Your magic blast incinerates the ${enemyName}!`, failure: `The spell fizzles The ${enemyName} attacks!`, damage: Math.max(1, rollDie(4) + Math.floor(playerLevel / 2)) }
        });
        choices.push({
            id: 'run',
            text: 'Try to flee!',
            requiredCheck: { skill: 'Acrobatics', dc: 15 },
            consequence: { success: `You escape into the shadows.`, failure: `You are cornered!`, damage: Math.max(1, rollDie(4)) }
        });

        // Multi-enemy: 30% chance for group encounter (2-3 enemies) ONLY if level 3+
        const isGroup = playerLevel >= 3 && Math.random() < 0.3 && scaledEnemy.hp < 50; // Only group weaker enemies
        if (isGroup) {
            const count = Math.floor(Math.random() * 2) + 2; // 2-3 enemies
            const enemies = [];
            for (let i = 0; i < count; i++) {
                enemies.push({
                    ...scaledEnemy,
                    xpReward: (combatEncounter as any).xp || 50,
                    attackBonus: Math.max(2, Math.floor(scaledEnemy.hp / 8)),
                    damageDice: '1d6'
                });
            }
            description = `You arrive at ${location}. A group of ${count} ${enemyName}s attacks!`;
            return {
                id,
                title: location,
                description,
                type: 'combat',
                choices,
                enemies
            };
        }

        return {
            id,
            title: location,
            description,
            type: 'combat',
            choices,
            enemy: { ...scaledEnemy, xpReward: (encounter as any).xp || 50 }
        };
    } else {
        // Non-Combat / Exploration Logic
        // Type narrowing via 'id' or description
        const nonCombatEncounter = encounter as any; // Quick cast for flexible access

        if (nonCombatEncounter.id === 'shrine') {
            choices.push({
                id: 'pray',
                text: 'Offer a prayer to the ancient gods.',
                requiredCheck: { skill: 'Religion', dc: 12 },
                consequence: { success: `The shrine glows brightly. You feel blessed!`, failure: `The shrine remains silent.`, reward: '10gp' } // Flavor reward
            });
            choices.push({
                id: 'arcana',
                text: 'Study the magical runes.',
                requiredCheck: { skill: 'Arcana', dc: 14 },
                consequence: { success: `You decipher a secret of power!`, failure: `The runes are too complex.`, reward: '20gp' } // XP reward abstractly represented as GP for now or just flavor
            });
        } else if (nonCombatEncounter.id === 'bard') {
            choices.push({
                id: 'listen',
                text: 'Listen to their tale.',
                consequence: { success: `The tale inspires you! You feel refreshed.`, failure: '' }
            });
            choices.push({
                id: 'perform',
                text: 'Join in with a song!',
                requiredCheck: { skill: 'Performance', dc: 12 },
                consequence: { success: `The bard is impressed and shares a share of their tips!`, failure: `You play out of tune, embarrassing yourself.`, reward: '10gp' }
            });
        } else if (nonCombatEncounter.id === 'riddle') {
            choices.push({
                id: 'solve',
                text: 'solve the sphinx\'s riddle.',
                requiredCheck: { skill: 'Intelligence', dc: 15 },
                consequence: { success: `The statue grants you passage and a treasure revealed!`, failure: `The statue's eyes flare red. You take psychic damage!`, damage: rollDie(4), reward: '50gp' }
            });
            choices.push({
                id: 'leave',
                text: 'Walk away slowly.',
                consequence: { success: `You back away safely.`, failure: '' }
            });
        } else if (nonCombatEncounter.id === 'wild_magic') {
            choices.push({
                id: 'control',
                text: 'Attempt to stabilize the magic.',
                requiredCheck: { skill: 'Arcana', dc: 16 },
                consequence: { success: `You condense the magic into a gemstone!`, failure: `The magic explodes in your face!`, damage: rollDie(6), reward: '100gp' }
            });
            choices.push({
                id: 'absorb',
                text: 'Try to absorb the energy.',
                requiredCheck: { skill: 'Constitution', dc: 14 },
                consequence: { success: `You feel invigorated by the raw power!`, failure: `It's too much! Your body is racked with pain.`, damage: rollDie(4) }
            });
        } else if (nonCombatEncounter.id === 'bandit_toll') {
            choices.push({
                id: 'pay',
                text: 'Pay the toll (10gp).',
                consequence: { success: `You pay them and pass peacefully.`, failure: `They demand more!`, reward: '-10gp' }
            });
            choices.push({
                id: 'intimidate',
                text: 'Threaten them to step aside.',
                requiredCheck: { skill: 'Intimidation', dc: 13 },
                consequence: { success: `They back down, intimidated by your presence.`, failure: `They laugh and draw their weapons!`, damage: 0 } // Damage 0 because combat starts
            });
        } else if (nonCombatEncounter.id === 'lost_pet') {
            choices.push({
                id: 'track',
                text: 'Track the missing animal.',
                requiredCheck: { skill: 'Survival', dc: 11 },
                consequence: { success: `You find the scared creature and return it. The child gives you a shiny rock.`, failure: `The tracks are lost in the mud.`, reward: '5gp' }
            });
            choices.push({
                id: 'comfort',
                text: 'Comfort the child.',
                requiredCheck: { skill: 'Persuasion', dc: 10 },
                consequence: { success: `You calm the child down.`, failure: `The child keeps crying.` }
            });
        } else if (nonCombatEncounter.id === 'cursed_fountain') {
            choices.push({
                id: 'drink',
                text: 'Drink from the fountain.',
                requiredCheck: { skill: 'Constitution', dc: 12 },
                consequence: { success: `The water heals your wounds!`, failure: `The water tastes vile. You feel sick.`, damage: rollDie(4), reward: 'potion_healing' } // Reward logic handles items? Need to check.
            });
            choices.push({
                id: 'purify',
                text: 'Purify the water (Religion).',
                requiredCheck: { skill: 'Religion', dc: 14 },
                consequence: { success: `The water clears. You find coins at the bottom.`, failure: `The corruption is too strong.`, reward: '25gp' }
            });
        } else if (nonCombatEncounter.id === 'rival_adventurer') {
            choices.push({
                id: 'talk',
                text: 'Swap stories and news.',
                consequence: { success: `They share a useful tip about the local area.`, failure: '' }
            });
            choices.push({
                id: 'duel',
                text: 'Challenge them to a friendly duel.',
                requiredCheck: { skill: 'Athletics', dc: 15 },
                consequence: { success: `You win! They respect your skill and give you a prize.`, failure: `They disarm you easily. "Nice try, rookie."`, reward: 'dagger_plus1' }
            });
        } else if (nonCombatEncounter.id === 'collapsed_bridge') {
            choices.push({
                id: 'climb',
                text: 'Climb down and up the other side.',
                requiredCheck: { skill: 'Athletics', dc: 13 },
                consequence: { success: `You make the climb safely.`, failure: `You slip and fall!`, damage: rollDie(6) }
            });
            choices.push({
                id: 'acrobatics',
                text: 'Leap across the gap!',
                requiredCheck: { skill: 'Acrobatics', dc: 15 },
                consequence: { success: `A perfect jump!`, failure: `You barely catch the edge and bruise your ribs.`, damage: rollDie(4) }
            });
        } else if (nonCombatEncounter.id === 'mysterious_obelisk') {
            choices.push({
                id: 'arcana',
                text: 'Study the runes.',
                requiredCheck: { skill: 'Arcana', dc: 15 },
                consequence: { success: `You feel a surge of magical knowledge.`, failure: `The runes give you a headache.`, reward: '50xp' } // XP reward needs handling?
                // Currently consequences reward is string '10gp' or Item ID. XP not handled in AdventureView for choice?
                // AdventureView choice handling: if reward starts with number -> gp. If matches item -> item.
                // It does NOT handle XP.
                // I'll stick to GP or Item for now, or flavor.
            });
            choices.push({
                id: 'touch',
                text: 'Touch the obelisk.',
                consequence: { success: `Energy pulses through you. You feel stronger.`, failure: `Cold necrosis rots your hand!`, damage: rollDie(8) }
            });
        } else if (nonCombatEncounter.id === 'fairy_circle') {
            choices.push({
                id: 'step',
                text: 'Step inside.',
                requiredCheck: { skill: 'Charisma', dc: 14 },
                consequence: { success: `The fey creatures dance with you and gift you a trinket.`, failure: `You dance until you pass out from exhaustion.`, damage: rollDie(4), reward: '20gp' }
            });
            choices.push({
                id: 'nature',
                text: 'Leave an offering.',
                requiredCheck: { skill: 'Nature', dc: 12 },
                consequence: { success: `The flowers bloom instantly. You find a rare herb.`, failure: `The offering rots instantly.`, reward: 'potion_healing' }
            });
        } else if (nonCombatEncounter.id === 'merchant_caravan') {
            choices.push({
                id: 'trade',
                text: 'Trade with the merchants.',
                consequence: { success: `You buy some supplies.`, failure: ``, reward: 'potion_healing', cost: 5000 } // Buy potion
            });
            choices.push({
                id: 'guard',
                text: 'Offer to stand guard for the night.',
                requiredCheck: { skill: 'Perception', dc: 12 },
                consequence: { success: `The night is quiet. They pay you for your service.`, failure: `You fall asleep! They are not impressed.`, reward: '15gp' }
            });
        } else {
            // Default Fallbacks
            const isTrader = encounter.description?.includes('merchant');
            const isNPC = encounter.description?.includes('soldier') || encounter.description?.includes('wounded');
            const isTrap = encounter.description?.includes('trap');

            if (isTrap) {
                choices.push({
                    id: 'investigate',
                    text: 'Search for a way to disarm the trap.',
                    requiredCheck: { skill: 'Investigation', dc: 12 },
                    consequence: { success: `You carefully disarm the trap and find some coins hidden inside.`, failure: `You trigger the trap!`, damage: rollDie(4), reward: '5gp' }
                });
                choices.push({
                    id: 'athletics',
                    text: 'Force your way through!',
                    requiredCheck: { skill: 'Athletics', dc: 14 },
                    consequence: { success: `You smash through the obstacle.`, failure: `The door holds firm and you hurt your shoulder.`, damage: rollDie(4) }
                });
            } else if (isTrader) {
                choices.push({
                    id: 'diplomacy',
                    text: 'Haggle for a better deal.',
                    requiredCheck: { skill: 'Persuasion', dc: 12 },
                    consequence: { success: `The merchant gives you a discount - you gain 15gp worth of goods!`, failure: `The merchant scoffs at your offer. "Come back when you have real coin."`, reward: '15gp' }
                });
                choices.push({
                    id: 'investigate',
                    text: 'Examine the merchant\'s wares closely.',
                    requiredCheck: { skill: 'Investigation', dc: 10 },
                    consequence: { success: `You spot a valuable item hidden among the junk!`, failure: `Nothing catches your eye.`, reward: '10gp' }
                });
            } else if (isNPC) {
                choices.push({
                    id: 'diplomacy',
                    text: 'Offer to help them.',
                    requiredCheck: { skill: 'Persuasion', dc: 8 },
                    consequence: { success: `They gratefully reward you with some coins.`, failure: `They eye you suspiciously and move away.`, reward: '10gp' }
                });
                choices.push({
                    id: 'medicine',
                    text: 'Tend to their wounds.',
                    requiredCheck: { skill: 'Medicine', dc: 10 },
                    consequence: { success: `You bandage their wounds. They thank you with a small gift.`, failure: `Your efforts don't help much, but they appreciate the attempt.`, reward: '5gp' }
                });
            } else {
                choices.push({
                    id: 'investigate',
                    text: 'Look around carefully.',
                    requiredCheck: { skill: 'Investigation', dc: 12 },
                    consequence: { success: `You find a hidden stash of gold!`, failure: `You find nothing of interest.`, reward: '10gp' }
                });
                choices.push({
                    id: 'diplomacy',
                    text: 'Interact with your surroundings.',
                    requiredCheck: { skill: 'Persuasion', dc: 10 },
                    consequence: { success: `Your charisma earns you a small reward.`, failure: `Your efforts go unnoticed.`, reward: '5gp' }
                });
            }


        }

        // Ensure there's always a 'leave' option if not added above


        return {
            id,
            title: location,
            description,
            type: encounter.type as any,
            choices
        };
    }
}

export function generateShopScene(inventory: Item[] = [], playerLevel: number = 1): Scene {
    // Generate Random Shop Inventory
    const choices: Choice[] = [];

    // Always stock Healing Potions
    choices.push({
        id: 'buy_potion_healing',
        text: 'Buy Potion of Healing (50gp)',
        consequence: { success: 'You bought a potion.', failure: 'Not enough gold!', reward: 'potion_healing', cost: 5000 }
    });

    // Randomize other items based on level
    const allItems = Object.values(ITEMS).filter(i => i.type !== 'potion' || i.id !== 'potion_healing'); // Exclude common potion to avoid dupe
    const numItems = 3 + Math.floor(Math.random() * 3); // 3 to 5 items

    // Weighted Rarity Check
    // Low Level (1-3): Mostly Common, rare chance of Uncommon
    // Mid Level (4-7): Common mixed with Uncommon
    // High Level (8+): Uncommon, Rare

    const shopInventory: Item[] = [];

    for (let i = 0; i < numItems; i++) {
        const roll = Math.random();
        let targetRarity: 'common' | 'uncommon' | 'rare' = 'common';

        if (playerLevel >= 5) {
            if (roll > 0.7) targetRarity = 'uncommon';
            if (roll > 0.95) targetRarity = 'rare'; // Very rare shop find
        } else {
            if (roll > 0.95) targetRarity = 'uncommon';
        }

        const pool = allItems.filter(item => item.rarity === targetRarity);
        if (pool.length > 0) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            // Avoid duplicates
            if (!shopInventory.find(inv => inv.id === pick.id)) {
                shopInventory.push(pick);
            }
        }
    }

    // Convert to Choices
    shopInventory.forEach(item => {
        const costGp = Math.ceil(item.value / 100);
        choices.push({
            id: `buy_${item.id}`,
            text: `Buy ${item.name} (${costGp}gp)`,
            consequence: {
                success: `You bought ${item.name}.`,
                failure: 'Not enough gold!',
                reward: item.id,
                cost: item.value
            }
        });
    });

    // Add sell choices for inventory items
    if (inventory.length > 0) {
        inventory.forEach((item, index) => {
            const sellPriceGp = Math.floor((item.value || 0) / 200);

            if (sellPriceGp > 0) {
                choices.push({
                    id: `sell_item_${index}`,
                    text: `Sell ${item.name} (${sellPriceGp}gp)`,
                    consequence: { success: `Sold ${item.name} for ${sellPriceGp}gp.`, failure: '' }
                });
            }
        });
    }

    choices.push({
        id: 'leave_shop',
        text: 'Leave Shop',
        consequence: { success: 'You step back outside.', failure: '' }
    });

    return {
        id: 'shop_interior',
        title: 'General Store',
        description: 'Shelves are lined with basic supplies and weapons. The shopkeeper watches you expectantly.',
        type: 'roleplay',
        choices
    };
}
