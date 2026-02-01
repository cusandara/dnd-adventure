'use client';

import { useState } from 'react';
import { CharacterWizard } from "@/components/character/CharacterWizard";

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans selection:bg-amber-500/30">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center border-b border-slate-800 pb-8">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4">
            D&D 5e <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Adventure Sim</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Forge your hero through choices, not spreadsheets. Answer the call to adventure and see where fate takes you.
          </p>
        </header>

        {!gameStarted ? (
          <div className="flex flex-col items-center justify-center mt-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-200 mb-4">Welcome, Adventurer!</h2>
              <p className="text-slate-400 max-w-lg mx-auto">
                Embark on an epic journey through dungeons, forests, and ancient ruins.
                Create your character and let the dice decide your fate.
              </p>
            </div>
            <button
              onClick={() => setGameStarted(true)}
              className="px-12 py-5 text-2xl font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 hover:from-amber-400 hover:to-orange-500 transition-all transform hover:scale-105 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
            >
              Begin Adventure
            </button>
          </div>
        ) : (
          <CharacterWizard onReset={() => setGameStarted(false)} />
        )}
      </div>
    </main>
  );
}
