'use client';

import { useState, useEffect } from 'react';
import { CharacterWizard } from "@/components/character/CharacterWizard";
import { AdventureView } from "@/components/adventure/AdventureView";
import { Character, Scene } from "@/types/dnd";
import { loadGame, getSaveSlotInfo, SaveSlotInfo, loadAutoSave } from '@/lib/save-system';
import { createInitialCampaignState } from '@/lib/campaign-data';

type GameState = 'landing' | 'wizard' | 'adventure';
type GameMode = 'campaign' | 'sandbox' | null;

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('landing');
  const [gameMode, setGameMode] = useState<GameMode>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [initialScene, setInitialScene] = useState<Scene | null>(null);
  const [initialLog, setInitialLog] = useState<{ text: string; type: 'narrative' | 'success' | 'failure' | 'info' }[]>([]);
  const [saveSlots, setSaveSlots] = useState<(SaveSlotInfo | null)[]>([]);
  const [hasAutoSave, setHasAutoSave] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);

  useEffect(() => {
    setSaveSlots(getSaveSlotInfo());
    setHasAutoSave(loadAutoSave() !== null);
  }, [gameState]);

  const handleStartCampaign = () => {
    setGameMode('campaign');
    setGameState('wizard');
  };

  const handleStartSandbox = () => {
    setGameMode('sandbox');
    setGameState('wizard');
  };

  const handleCharacterComplete = (newCharacter: Character) => {
    const charWithMode = gameMode === 'campaign'
      ? { ...newCharacter, campaignState: createInitialCampaignState() }
      : newCharacter;
    setCharacter(charWithMode);
    setInitialScene(null);
    setInitialLog([]);
    setGameState('adventure');
  };

  const handleLoadGame = (slot: number) => {
    const data = loadGame(slot);
    if (data) {
      setCharacter(data.character);
      setInitialScene(data.scene);
      setInitialLog(data.log);
      setGameState('adventure');
    }
  };

  const handleContinueAutoSave = () => {
    const data = loadAutoSave();
    if (data) {
      setCharacter(data.character);
      setInitialScene(data.scene);
      setInitialLog(data.log);
      setGameState('adventure');
    }
  };

  const handleReset = () => {
    setGameState('landing');
    setGameMode(null);
    setCharacter(null);
    setInitialScene(null);
    setInitialLog([]);
    setShowLoadMenu(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans selection:bg-amber-500/30">
      <div className="max-w-6xl mx-auto">
        {gameState === 'landing' && (
          <>
            <header className="mb-12 text-center border-b border-slate-800 pb-8">
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4">
                D&D 5e <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Adventure Sim</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Forge your hero through choices, not spreadsheets. Answer the call to adventure and see where fate takes you.
              </p>
            </header>

            <div className="flex flex-col items-center justify-center mt-10 space-y-4">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-200 mb-4">Welcome, Adventurer!</h2>
                <p className="text-slate-400 max-w-lg mx-auto">
                  Choose your path: play through a hand-crafted campaign story, or explore a procedurally generated sandbox world.
                </p>
              </div>

              {!showLoadMenu ? (
                <div className="flex flex-col gap-4 w-full max-w-md">
                  {/* Continue Auto-Save */}
                  {hasAutoSave && (
                    <button
                      onClick={handleContinueAutoSave}
                      className="w-full px-8 py-5 text-xl font-bold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:from-emerald-400 hover:to-teal-500 transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/20 mb-4"
                    >
                      <div className="text-xl">▶️ Continue Adventure</div>
                      <div className="text-sm font-normal opacity-80 mt-1">Load recent auto-save</div>
                    </button>
                  )}

                  {/* Campaign Mode */}
                  <button
                    onClick={handleStartCampaign}
                    className="w-full px-8 py-5 text-xl font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 transition-all transform hover:scale-105 shadow-lg shadow-amber-500/20"
                  >
                    <div className="text-xl">⚔️ Start Campaign</div>
                    <div className="text-sm font-normal opacity-80 mt-1">The Lost Forge of the Starfall Dwarves</div>
                  </button>

                  {/* Sandbox Mode */}
                  <button
                    onClick={handleStartSandbox}
                    className="w-full px-8 py-4 text-lg font-bold rounded-xl bg-slate-800 border border-slate-600 text-slate-200 hover:bg-slate-700 hover:border-amber-500/50 transition-all transform hover:scale-105"
                  >
                    <div>🎲 Sandbox Mode</div>
                    <div className="text-sm font-normal text-slate-400 mt-1">Random encounters & endless adventure</div>
                  </button>

                  {saveSlots.some(s => s !== null) && (
                    <button
                      onClick={() => setShowLoadMenu(true)}
                      className="w-full px-8 py-4 text-lg font-bold rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all hover:border-amber-500/50"
                    >
                      Load Game
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl p-6 animate-in fade-in zoom-in-95">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-200">Select a Save Slot</h3>
                    <button onClick={() => setShowLoadMenu(false)} className="text-slate-400 hover:text-white">Cancel</button>
                  </div>
                  <div className="grid gap-3">
                    {saveSlots.map((slot, index) => (
                      <button
                        key={index}
                        disabled={!slot}
                        onClick={() => slot && handleLoadGame(index)}
                        className={`p-4 rounded-lg border text-left transition-all ${slot
                          ? 'bg-slate-800 border-slate-600 hover:border-amber-500 hover:bg-slate-750 group'
                          : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed'
                          }`}
                      >
                        <div className="text-xs text-slate-500 mb-1">Slot {index + 1}</div>
                        {slot ? (
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-bold text-slate-200 group-hover:text-amber-400">{slot.characterName}</div>
                              <div className="text-sm text-slate-400">Lv {slot.level} {slot.raceName} {slot.className}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-slate-500">{new Date(slot.timestamp).toLocaleString()}</div>
                              <div className="text-xs text-amber-500">{slot.hp.current} HP • {slot.gp} GP</div>
                            </div>
                          </div>
                        ) : (
                          <div className="italic">Empty Slot</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {gameState === 'wizard' && (
          <CharacterWizard
            onReset={handleReset}
            onComplete={handleCharacterComplete}
          />
        )}

        {gameState === 'adventure' && character && (
          <AdventureView
            character={character}
            onReset={handleReset}
            initialScene={initialScene}
            initialLog={initialLog}
          />
        )}
      </div>
    </main>
  );
}

