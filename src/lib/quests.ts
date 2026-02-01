import { Character, Quest, QuestObjective } from '@/types/dnd';
import { rollDie } from './adventure-logic';

export const QUEST_TEMPLATES = [
    {
        title: "Cleanse the Cave",
        description: "A local cave has been overrun by monsters. Clear them out.",
        objectiveBase: { type: 'kill', target: 'Goblin', count: 3 },
        rewardBase: { xp: 100, gp: 25 }
    },
    {
        title: "Rat Catcher",
        description: "The tavern basement is infested. Help the owner.",
        objectiveBase: { type: 'kill', target: 'Giant Rat', count: 5 },
        rewardBase: { xp: 50, gp: 10 }
    },
    {
        title: "Lost shipment",
        description: "Bandits stole a shipment of supplies. Recover it.",
        objectiveBase: { type: 'kill', target: 'Bandit', count: 2 },
        rewardBase: { xp: 150, gp: 50 }
    }
] as const;

export function generateQuest(level: number): Quest {
    // Pick a random template
    const template = QUEST_TEMPLATES[Math.floor(Math.random() * QUEST_TEMPLATES.length)];

    // Scale count slightly by level
    const count = Math.ceil(template.objectiveBase.count * (1 + (level * 0.1)));

    return {
        id: `quest_${Math.random().toString(36).substring(7)}`,
        title: template.title,
        description: template.description,
        objectives: [
            {
                ...template.objectiveBase,
                type: template.objectiveBase.type as any,
                count: count,
                current: 0
            }
        ],
        reward: {
            xp: template.rewardBase.xp * level,
            gp: template.rewardBase.gp * level
        },
        status: 'active'
    };
}

export function checkQuestProgress(character: Character, eventIn: { type: 'kill' | 'collect', target: string }): { character: Character, messages: string[] } {
    const messages: string[] = [];
    const updatedQuests = character.quests.map(quest => {
        if (quest.status !== 'active') return quest;

        let questUpdated = false;
        const newObjectives = quest.objectives.map(obj => {
            if (obj.type === eventIn.type && eventIn.target.includes(obj.target)) { // Simple string match
                if (obj.current < obj.count) {
                    questUpdated = true;
                    return { ...obj, current: obj.current + 1 };
                }
            }
            return obj;
        });

        if (questUpdated) {
            const isComplete = newObjectives.every(o => o.current >= o.count);
            if (isComplete) {
                messages.push(`Quest Completed: ${quest.title}!`);
                return { ...quest, objectives: newObjectives, status: 'completed' as const };
            }
            messages.push(`Quest Update: ${quest.title} (${newObjectives[0].current}/${newObjectives[0].count} ${newObjectives[0].target})`);
            return { ...quest, objectives: newObjectives };
        }

        return quest;
    });

    const newCharacter = { ...character, quests: updatedQuests };

    // Apply rewards for newly completed quests
    // Note: In a real app we might want to defer this to a "Turn In" action, but auto-complete is fine for now.
    updatedQuests.forEach((q, i) => {
        const oldQ = character.quests[i];
        if (q.status === 'completed' && oldQ.status === 'active') {
            newCharacter.xp += q.reward.xp;
            newCharacter.wallet.gp += q.reward.gp;
            messages.push(`Reward: ${q.reward.xp} XP, ${q.reward.gp} gp`);
        }
    });

    return { character: newCharacter, messages };
}
