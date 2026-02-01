import React from 'react';
import { Character } from '@/types/dnd';
import { Shield, Heart, Zap, Backpack } from 'lucide-react';

interface CharacterSheetProps {
    character: Character;
}

export function CharacterSheet({ character }: CharacterSheetProps) {
    return (
        <div className="bg-slate-900 border-2 border-slate-700 rounded-xl p-6 text-slate-100 shadow-2xl max-w-4xl mx-auto font-serif">
            {/* Header */}
            <div className="flex justify-between items-end border-b border-slate-700 pb-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-amber-500">{character.name}</h1>
                    <p className="text-slate-400 text-lg">{character.race.name} {character.class.name} (Level {character.level})</p>
                </div>
                <div className="flex gap-4">
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-red-900/50 rounded-full border border-red-500 mb-1">
                            <Heart className="w-6 h-6 text-red-500" />
                        </div>
                        <span className="text-sm font-bold">{character.hp.current} / {character.hp.max}</span>
                        <div className="text-xs text-slate-500 uppercase">HP</div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-slate-800/50 rounded-full border border-slate-500 mb-1">
                            <Shield className="w-6 h-6 text-slate-400" />
                        </div>
                        <span className="text-sm font-bold">14</span> {/* Base AC placeholder */}
                        <div className="text-xs text-slate-500 uppercase">AC</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Attributes */}
                <div className="space-y-4">
                    <h3 className="text-amber-500 font-bold uppercase tracking-wider border-b border-amber-900/30 pb-1">Attributes</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(character.stats).map(([stat, value]) => {
                            const mod = Math.floor((value - 10) / 2);
                            const sign = mod >= 0 ? '+' : '';
                            return (
                                <div key={stat} className="bg-slate-800 p-2 rounded flex flex-col items-center">
                                    <span className="text-xs text-slate-400 uppercase">{stat.slice(0, 3)}</span>
                                    <span className="text-xl font-bold">{value}</span>
                                    <span className="text-xs text-amber-500 font-mono">{sign}{mod}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Skills */}
                <div className="md:col-span-1">
                    <h3 className="text-amber-500 font-bold uppercase tracking-wider border-b border-amber-900/30 pb-1 mb-3">Skills</h3>
                    <ul className="space-y-1 text-sm">
                        {character.skills.map(skill => (
                            <li key={skill} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                {skill}
                            </li>
                        ))}
                        {character.skills.length === 0 && <li className="text-slate-600 italic">No proficient skills</li>}
                    </ul>
                </div>

                {/* Inventory & Features */}
                <div className="space-y-6">
                    {/* Equipment Slots */}
                    <div>
                        <h3 className="text-amber-500 font-bold uppercase tracking-wider border-b border-amber-900/30 pb-1 mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Equipped
                        </h3>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                            <div className="flex justify-between bg-slate-800 p-2 rounded">
                                <span className="text-slate-400">Main Hand</span>
                                <span className="text-slate-200 font-bold">{character.equipment?.mainHand?.name || "Empty"}</span>
                            </div>
                            <div className="flex justify-between bg-slate-800 p-2 rounded">
                                <span className="text-slate-400">Off Hand</span>
                                <span className="text-slate-200 font-bold">{character.equipment?.offHand?.name || "Empty"}</span>
                            </div>
                            <div className="flex justify-between bg-slate-800 p-2 rounded">
                                <span className="text-slate-400">Armor</span>
                                <span className="text-slate-200 font-bold">{character.equipment?.armor?.name || "None"}</span>
                            </div>
                        </div>
                    </div>

                    {/* Wallet */}
                    <div className="bg-slate-950 p-3 rounded border border-amber-900/40">
                        <div className="text-xs text-amber-500 uppercase tracking-widest mb-1">Currency</div>
                        <div className="flex gap-4 text-sm font-mono text-slate-300">
                            <span>{character.wallet.gp} <span className="text-yellow-500">GP</span></span>
                            <span>{character.wallet.sp} <span className="text-slate-400">SP</span></span>
                            <span>{character.wallet.cp} <span className="text-orange-700">CP</span></span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-amber-500 font-bold uppercase tracking-wider border-b border-amber-900/30 pb-1 mb-3 flex items-center gap-2">
                            <Backpack className="w-4 h-4" /> Inventory
                        </h3>
                        <div className="max-h-40 overflow-y-auto pr-2 space-y-1">
                            {character.inventory.map((item, i) => (
                                <div key={i} className="text-sm flex justify-between group">
                                    <span className="text-slate-300 group-hover:text-amber-400 transition-colors">{item.name}</span>
                                    {item.type === 'weapon' && item.weaponStats && <span className="text-xs text-slate-500">{item.weaponStats.damage}</span>}
                                    {item.type === 'armor' && item.armorStats && <span className="text-xs text-slate-500">AC {item.armorStats.baseAC}</span>}
                                </div>
                            ))}
                            {character.inventory.length === 0 && <div className="text-slate-500 italic text-sm">Empty backpack</div>}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-amber-500 font-bold uppercase tracking-wider border-b border-amber-900/30 pb-1 mb-3 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Class Features
                        </h3>
                        <div className="space-y-2">
                            {character.class.features.map((feature, i) => (
                                <div key={i} className="text-sm">
                                    <span className="font-bold text-slate-200">{feature.name}:</span> <span className="text-slate-400">{feature.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-amber-500 font-bold uppercase tracking-wider border-b border-amber-900/30 pb-1 mb-3 flex items-center gap-2">
                            <Heart className="w-4 h-4" /> Racial Traits
                        </h3>
                        <div className="space-y-2">
                            {character.race.traits.map((trait, i) => (
                                <div key={i} className="text-sm">
                                    <span className="font-bold text-slate-200">{trait.name}:</span> <span className="text-slate-400">{trait.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
