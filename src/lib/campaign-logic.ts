import { Scene, CampaignState, Quest } from '@/types/dnd';
import { getChapter, CAMPAIGN_CHAPTERS, StorySceneTemplate, BossTemplate } from './campaign-data';
import { rollDie } from './adventure-logic';
import { scaleEnemy } from './dnd-rules/leveling';

// ============================================================
// CAMPAIGN LOGIC ENGINE
// Drives pacing: story scene → 1-2 fillers → next story scene → ... → boss
// ============================================================

/**
 * Get the next campaign scene based on current campaign state.
 * Alternates between story scenes and chapter-themed filler encounters.
 */
export function getNextCampaignScene(
    campaignState: CampaignState,
    playerLevel: number
): { scene: Scene; updatedState: CampaignState } {
    const chapter = getChapter(campaignState.chapter);
    if (!chapter) {
        // Campaign complete — return a victory scene
        return {
            scene: createVictoryScene(),
            updatedState: campaignState
        };
    }

    const { storyScenes, fillerPool, boss } = chapter;
    const { sceneIndex, fillersSinceLastStory } = campaignState;

    // All story scenes done → boss fight
    if (sceneIndex >= storyScenes.length) {
        return {
            scene: createBossScene(boss, playerLevel),
            updatedState: { ...campaignState, fillersSinceLastStory: 0 }
        };
    }

    // Show the next story scene directly (user requested no filler in campaign mode)
    const storyTemplate = storyScenes[sceneIndex];
    const storyScene = createStoryScene(storyTemplate, chapter.id, playerLevel);

    return {
        scene: storyScene,
        updatedState: {
            ...campaignState,
            sceneIndex: sceneIndex + 1,
            fillersSinceLastStory: 0
        }
    };
}

/**
 * Advance to the next chapter after defeating the boss.
 */
export function advanceChapter(campaignState: CampaignState): CampaignState {
    const nextChapter = campaignState.chapter + 1;

    if (nextChapter > CAMPAIGN_CHAPTERS.length) {
        // Campaign complete!
        return {
            ...campaignState,
            flags: { ...campaignState.flags, campaign_complete: true }
        };
    }

    return {
        ...campaignState,
        chapter: nextChapter,
        sceneIndex: 0,
        fillersSinceLastStory: 0
    };
}

/**
 * Get the chapter title card data for transition scenes.
 */
export function getChapterIntroScene(campaignState: CampaignState): Scene | null {
    const chapter = getChapter(campaignState.chapter);
    if (!chapter) return null;

    return {
        id: `chapter_${chapter.id}_intro`,
        title: `Chapter ${chapter.id}: ${chapter.title}`,
        description: chapter.description,
        type: 'roleplay',
        choices: [
            { id: 'continue', text: 'Continue your adventure...', consequence: { success: '', failure: '' } }
        ],
        isStoryScene: true,
        chapterTitle: `Chapter ${chapter.id}: ${chapter.title}`
    };
}

/**
 * Check if campaign is at boss fight stage.
 */
export function isAtBossFight(campaignState: CampaignState): boolean {
    const chapter = getChapter(campaignState.chapter);
    if (!chapter) return false;
    return campaignState.sceneIndex >= chapter.storyScenes.length;
}

/**
 * Check if campaign is complete.
 */
export function isCampaignComplete(campaignState: CampaignState): boolean {
    return campaignState.flags.campaign_complete === true;
}

/**
 * Get chapter-specific side quests.
 */
export function getCampaignSideQuests(chapter: number, playerLevel: number): Quest[] {
    const chapterData = getChapter(chapter);
    if (!chapterData) return [];

    return chapterData.sideQuests.map((template, index) => ({
        id: `campaign_quest_ch${chapter}_${index}`,
        title: template.title,
        description: template.description,
        objectives: [{
            type: template.objectiveBase.type as 'kill' | 'collect' | 'visit',
            target: template.objectiveBase.target,
            count: Math.ceil(template.objectiveBase.count * (1 + (playerLevel * 0.1))),
            current: 0
        }],
        reward: {
            xp: template.rewardBase.xp * Math.max(1, Math.floor(playerLevel / 2)),
            gp: template.rewardBase.gp * Math.max(1, Math.floor(playerLevel / 2))
        },
        status: 'active' as const,
        chapterId: chapter
    }));
}

// ============================================================
// SCENE FACTORY FUNCTIONS
// ============================================================

function createStoryScene(template: StorySceneTemplate, chapterId: number, playerLevel: number): Scene {
    const scene: Scene = {
        id: template.id,
        title: template.title,
        description: template.description,
        type: template.type,
        choices: template.choices,
        isStoryScene: true,
        campaignSceneId: template.id,
        npcDialogue: template.npcDialogue,
        setFlags: template.setFlags
    };

    // Campaign Mode: Make enemies slightly easier by scaling them as 1 level lower (min 1)
    const campaignScaledLevel = Math.max(1, playerLevel - 1);

    // If it's a combat story scene, scale the enemies
    if (template.enemy) {
        const scaled = scaleEnemy(template.enemy, campaignScaledLevel);
        scene.enemy = {
            ...template.enemy,
            hp: scaled.hp,
            ac: scaled.ac
        };
    }

    if (template.enemies && template.enemies.length > 0) {
        scene.enemies = template.enemies.map(e => {
            const scaled = scaleEnemy(e, campaignScaledLevel);
            return { ...e, hp: scaled.hp, ac: scaled.ac };
        });
    }

    return scene;
}

function createBossScene(boss: BossTemplate, playerLevel: number): Scene {
    // Campaign Mode: Reduce boss difficulty slightly
    const campaignScaledLevel = Math.max(1, playerLevel - 1);
    const scaled = scaleEnemy({ name: boss.name, hp: boss.hp, ac: boss.ac }, campaignScaledLevel);

    return {
        id: `boss_${boss.id}`,
        title: boss.title,
        description: boss.description,
        type: 'combat',
        choices: [
            { id: 'melee', text: 'Draw your weapon and fight!', consequence: { success: '', failure: '' } },
            { id: 'magic', text: 'Cast a spell!', consequence: { success: '', failure: '' } },
            { id: 'run', text: 'Try to flee!', consequence: { success: '', failure: '' } }
        ],
        enemy: {
            name: boss.name,
            hp: scaled.hp,
            ac: scaled.ac,
            xpReward: boss.xpReward,
            attackBonus: boss.attackBonus,
            damageDice: boss.damageDice
        },
        isStoryScene: true,
        isBoss: true,
        campaignSceneId: `boss_${boss.id}`,
        npcDialogue: boss.npcDialogue,
        setFlags: { [boss.victoryFlag]: true }
    };
}

function createFillerScene(
    filler: { type: string; description: string; enemy?: string; hp?: number; ac?: number; xp?: number; id?: string },
    playerLevel: number,
    chapterId: number
): Scene {
    if (filler.type === 'combat' && filler.enemy) {
        const baseEnemy = { name: filler.enemy, hp: filler.hp || 10, ac: filler.ac || 12 };
        const scaled = scaleEnemy(baseEnemy, playerLevel);

        return {
            id: `filler_combat_${Date.now()}`,
            title: `Encounter`,
            description: filler.description,
            type: 'combat',
            choices: [
                { id: 'melee', text: 'Attack with your weapon!', requiredCheck: { skill: 'Athletics', dc: 12 + Math.floor((playerLevel - 1) / 2) }, consequence: { success: `You strike the ${filler.enemy} down!`, failure: `The ${filler.enemy} counters!`, damage: Math.max(1, rollDie(4) + Math.floor(playerLevel / 2)) } },
                { id: 'magic', text: 'Cast a spell!', requiredCheck: { skill: 'Arcana', dc: 13 + Math.floor((playerLevel - 1) / 2) }, consequence: { success: `Your magic blasts the ${filler.enemy}!`, failure: `The spell fizzles!`, damage: Math.max(1, rollDie(4) + Math.floor(playerLevel / 2)) } },
                { id: 'run', text: 'Try to flee!', requiredCheck: { skill: 'Acrobatics', dc: 15 }, consequence: { success: `You escape!`, failure: `You are cornered!`, damage: Math.max(1, rollDie(4)) } }
            ],
            enemy: {
                name: filler.enemy,
                hp: scaled.hp,
                ac: scaled.ac,
                xpReward: filler.xp || 50,
                attackBonus: Math.max(2, Math.floor(scaled.hp / 10)),
                damageDice: '1d6'
            }
        };
    }

    // Non-combat filler — use filler.id to map to existing non-combat encounter types
    return {
        id: `filler_explore_${Date.now()}`,
        title: 'A Moment\'s Respite',
        description: filler.description,
        type: 'exploration',
        choices: [
            { id: 'investigate', text: 'Investigate further.', requiredCheck: { skill: 'Investigation', dc: 12 }, consequence: { success: 'You find something interesting!', failure: 'Nothing of note.', reward: `${rollDie(6) * 5}gp` } },
            { id: 'move_on', text: 'Continue on your way.', consequence: { success: 'You press onward.', failure: '' } }
        ]
    };
}

function createVictoryScene(): Scene {
    return {
        id: 'campaign_victory',
        title: '🏆 Victory! 🏆',
        description: 'You have completed The Lost Forge of the Starfall Dwarves! The ancient forge burns bright once more, and the legacy of the Starfall Dwarves will endure for generations to come. Your name will be remembered among the greatest heroes of the realm.',
        type: 'roleplay',
        choices: [
            { id: 'continue_sandbox', text: 'Continue adventuring in Sandbox Mode.', consequence: { success: 'With the Forge secured, you set out on new adventures...', failure: '' } }
        ],
        isStoryScene: true,
        npcDialogue: [
            { name: 'Gundrik Ironvein', text: '"Thank you, my friend. What you\'ve done today will echo through the ages. The Forge will serve the forces of good, as my ancestors intended. And you — you will always have a home among the dwarves."' },
            { name: 'Spectral Guardian Bruni', text: '"Go forth, champion. The world has need of heroes like you. And should you ever need the Forge\'s power again... you know where to find us."' }
        ]
    };
}
