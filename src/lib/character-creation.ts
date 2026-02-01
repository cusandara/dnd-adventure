import { Question } from "@/types/dnd";

export const QUESTIONNAIRE: Question[] = [
    {
        id: "combat_style",
        text: "When enemies approach, how do you react?",
        options: [
            { label: "Charge them head-on with a roar!", value: "melee", scores: { Barbarian: 3, Fighter: 2, Paladin: 1 } },
            { label: "Keep your distance and shoot arrows or spells.", value: "ranged", scores: { Ranger: 3, Wizard: 2, Sorcerer: 2 } },
            { label: "Hide in the shadows and strike when they aren't looking.", value: "stealth", scores: { Rogue: 3, Ranger: 1 } },
            { label: "Stand your ground and protect your allies.", value: "support", scores: { Cleric: 3, Paladin: 2 } },
        ]
    },
    {
        id: "social_style",
        text: "You need to get past a guard. What do you do?",
        options: [
            { label: "Intimidate him with a menacing glare.", value: "intimidate", scores: { Barbarian: 2, Fighter: 1 } },
            { label: "Persuade him with a silver tongue.", value: "persuade", scores: { Bard: 3, Sorcerer: 2, Paladin: 1 } },
            { label: "Distract him with a magic trick.", value: "magic", scores: { Wizard: 1, Bard: 1 } },
            { label: "Sneak past him while he's distracted.", value: "stealth", scores: { Rogue: 2 } },
        ]
    },
    {
        id: "magic_preference",
        text: "How do you feel about magic?",
        options: [
            { label: "It's a powerful tool to master.", value: "pro_magic", scores: { Wizard: 3, Sorcerer: 3, Warlock: 3 } },
            { label: "It's useful for healing and nature.", value: "nature_magic", scores: { Druid: 3, Cleric: 2, Ranger: 1 } },
            { label: "I prefer cold steel.", value: "no_magic", scores: { Fighter: 2, Barbarian: 2, Rogue: 1 } },
        ]
    }
];

export function recommendClass(answers: Record<string, string>): string {
    const scores: Record<string, number> = {};

    QUESTIONNAIRE.forEach((q) => {
        const answerValue = answers[q.id];
        const selectedOption = q.options.find(opt => opt.value === answerValue);

        if (selectedOption && selectedOption.scores) {
            Object.entries(selectedOption.scores).forEach(([className, score]) => {
                if (score !== undefined) {
                    scores[className] = (scores[className] || 0) + score;
                }
            });
        }
    });

    // Find class with highest score
    let bestClass = "Fighter"; // Default
    let maxScore = -Infinity;

    Object.entries(scores).forEach(([className, score]) => {
        if (score > maxScore) {
            maxScore = score;
            bestClass = className;
        }
    });

    return bestClass;
}
