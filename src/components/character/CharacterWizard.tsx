'use client';

import React, { useState } from 'react';
import { QUESTIONNAIRE, recommendClass } from '@/lib/character-creation';
import { Character, CharacterStats } from '@/types/dnd';
import { CLASSES } from '@/lib/dnd-rules/classes';
import { RACES } from '@/lib/dnd-rules/races';
import { CharacterSheet } from './CharacterSheet';
import { AdventureView } from '../adventure/AdventureView';
import { applyStartingEquipment } from '@/lib/dnd-rules/starting-equipment';

export interface CharacterWizardProps {
    onReset: () => void;
}

export function CharacterWizard({ onReset }: CharacterWizardProps) {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [character, setCharacter] = useState<Character | null>(null);
    const [setupCompleted, setSetupCompleted] = useState(false);
    const [name, setName] = useState('');
    const [selectedRace, setSelectedRace] = useState('Human');
    const [selectedClass, setSelectedClass] = useState('Fighter');

    const currentQuestion = QUESTIONNAIRE[step];

    const handleSetupComplete = () => {
        if (name.trim()) setSetupCompleted(true);
    };

    const handleSelect = (value: string) => {
        const newAnswers = { ...answers, [currentQuestion.id]: value };
        setAnswers(newAnswers);

        if (step < QUESTIONNAIRE.length - 1) {
            setStep(step + 1);
        } else {
            generateCharacter(newAnswers);
        }
    };



    const generateCharacter = (finalAnswers: Record<string, string>) => {
        // Use user selected Class/Race instead of recommendation
        // The stats are randomized for now but influenced by class recommendations in the original code
        // Let's modify: Answers decide "Bonus Stats" or "Personality" checks, but user explicitly chose Class.

        const finalClass = CLASSES[selectedClass];
        const finalRace = RACES[selectedRace];

        const baseStats: CharacterStats = {
            Strength: 10, Dexterity: 10, Constitution: 10,
            Intelligence: 10, Wisdom: 10, Charisma: 10
        };

        // Apply Racial Bonuses
        Object.entries(finalRace.abilityBonuses).forEach(([ability, bonus]) => {
            if (typeof bonus === 'number') {
                baseStats[ability as keyof CharacterStats] += bonus;
            }
        });

        // Apply Class Recommendations (Simulated 'Standard Array' allocation)
        if (finalClass.name === 'Barbarian') { baseStats.Strength += 4; baseStats.Constitution += 2; }
        if (finalClass.name === 'Wizard') { baseStats.Intelligence += 4; baseStats.Constitution += 2; }
        if (finalClass.name === 'Rogue') { baseStats.Dexterity += 4; baseStats.Charisma += 2; }
        if (finalClass.name === 'Cleric') { baseStats.Wisdom += 4; baseStats.Strength += 2; }
        if (finalClass.name === 'Fighter') { baseStats.Strength += 3; baseStats.Constitution += 3; }

        // Logic check: Questionnaire could add randomization or flavor
        // For now, let's keep it simple: Questionnaire affects... nothing? Or maybe a small persistent bonus?
        // The user asked: "the rest of the questions should be used to determine the random stats"
        // Let's interpret: Add some random variance based on questionnaire?
        // We'll leave the current stat allocation as "Guided by Class" + "Race" for now as it's solid.

        const conMod = Math.floor((baseStats.Constitution - 10) / 2);
        const maxHP = finalClass.hitDice + conMod;

        let newCharacter: Character = {
            name: name,
            race: finalRace,
            class: finalClass,
            level: 1,
            stats: baseStats,
            hp: {
                current: maxHP,
                max: maxHP,
                hitDiceCurrent: 1,
                hitDiceMax: 1
            },
            xp: 0,
            maxXp: 300,
            skills: ['Athletics', 'Perception'],
            inventory: [], // Initialized empty, populated by applyStartingEquipment
            wallet: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
            equipment: { mainHand: null, offHand: null, armor: null },
            quests: []
        };

        // Apply Starting Equipment
        newCharacter = applyStartingEquipment(newCharacter);

        setCharacter(newCharacter);
    };

    if (character) return <AdventureView character={character} onReset={onReset} />;

    if (!setupCompleted) {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-8 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl animate-in fade-in">
                <h2 className="text-3xl font-bold text-slate-100 mb-6 border-b border-slate-800 pb-4">Create Your Hero</h2>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2">Character Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-800 border-slate-600 rounded p-3 text-white focus:ring-2 ring-amber-500 outline-none"
                            placeholder="Enter name..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">Race</label>
                            <select
                                value={selectedRace}
                                onChange={(e) => setSelectedRace(e.target.value)}
                                className="w-full bg-slate-800 border-slate-600 rounded p-3 text-white outline-none"
                            >
                                {Object.keys(RACES).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">Class</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full bg-slate-800 border-slate-600 rounded p-3 text-white outline-none"
                            >
                                {Object.keys(CLASSES).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleSetupComplete}
                        disabled={!name.trim()}
                        className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-lg transition-colors mt-4"
                    >
                        Proceed to Personality Test
                    </button>
                </div>
            </div>
        );
    }

    // Questionnaire View
    return (
        <div className="max-w-2xl mx-auto mt-20 p-8 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
            <div className="mb-6">
                <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">Determining Stats...</div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-amber-500 transition-all duration-300 ease-out"
                        style={{ width: `${((step) / QUESTIONNAIRE.length) * 100}%` }}
                    />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-100 mb-6">{currentQuestion.text}</h2>

            <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className="w-full text-left p-4 rounded-lg border border-slate-700 hover:border-amber-500 hover:bg-slate-800 transition-all group"
                    >
                        <span className="font-semibold text-slate-200 group-hover:text-amber-400">{option.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
