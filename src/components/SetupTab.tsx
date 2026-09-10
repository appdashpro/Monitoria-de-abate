import { useState, FormEvent } from 'react';
import { useAppStore } from '../store';
import { generateId } from '../utils';
import { db } from '../db';
import { Play, Sparkles } from 'lucide-react';

export function SetupTab() {
  const { setCurrentBatch, setActiveTab } = useAppStore();
  const [abattoir, setAbattoir] = useState('');
  const [farm, setFarm] = useState('');
  const [batchId, setBatchId] = useState('');
  const [totalAnimals, setTotalAnimals] = useState('');

  const handleStart = async (e: FormEvent) => {
    e.preventDefault();
    if (!abattoir || !farm || !batchId || !totalAnimals) return;

    const newBatch = {
      id: generateId(),
      abattoir,
      farm,
      batchId,
      totalAnimals: parseInt(totalAnimals, 10),
      date: Date.now(),
    };

    await db.batches.add(newBatch);
    setCurrentBatch(newBatch);
    setActiveTab('collection');
  };

  const handleSimulate = async () => {
    const simAbattoir = abattoir || 'Frigorífico Central';
    const simFarm = farm || 'Granja São José';
    const simBatchId = batchId || `LOTE-${Math.floor(100 + Math.random() * 900)}`;
    const simTotal = parseInt(totalAnimals, 10) || 25;

    const newBatch = {
      id: generateId(),
      abattoir: simAbattoir,
      farm: simFarm,
      batchId: simBatchId,
      totalAnimals: simTotal,
      date: Date.now(),
    };

    await db.batches.add(newBatch);

    // Generate simulated evaluations
    const evaluationsToSave = [];
    for (let i = 1; i <= simTotal; i++) {
      // Madec scores: mostly 0s, with some lesions (1, 2, 3, 4)
      const getRandomScore = () => {
        const r = Math.random();
        if (r < 0.65) return 0; // 65% healthy
        if (r < 0.82) return 1; // 17% score 1
        if (r < 0.92) return 2; // 10% score 2
        if (r < 0.97) return 3; // 5% score 3
        return 4; // 3% score 4
      };

      const rightCranial = getRandomScore();
      const rightMiddle = getRandomScore();
      const rightCaudal = getRandomScore();
      const accessory = getRandomScore();
      const leftCranial = getRandomScore();
      const leftMiddle = getRandomScore();
      const leftCaudal = getRandomScore();
      
      // Pleurisy score SPES: 0 to 4
      const spes = Math.random() < 0.35 ? Math.floor(Math.random() * 5) : 0;
      
      // Scarring (cicatriz): true or false
      const scarring = Math.random() < 0.12;
      
      // Pleurisy CV: true or false (more frequent if SPES is high)
      const pleurisy = spes >= 2 || Math.random() < 0.08;

      evaluationsToSave.push({
        id: `${generateId()}-${i}`,
        batchId: newBatch.id,
        animalIndex: i,
        rightCranial,
        rightMiddle,
        rightCaudal,
        accessory,
        leftCranial,
        leftMiddle,
        leftCaudal,
        spes,
        scarring,
        pleurisy,
      });
    }

    // Add all to db
    for (const evalObj of evaluationsToSave) {
      await db.evaluations.add(evalObj);
    }

    setCurrentBatch(newBatch);
    setActiveTab('summary');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start gap-6">
      {/* Workflow Process Guide */}
      <div className="w-full max-w-2xl bg-slate-900/30 border border-slate-800/60 p-4 rounded-2xl flex justify-between items-center text-xs text-slate-400 font-mono tracking-wider">
        <div className="flex items-center gap-2 text-sky-400 font-bold">
          <span className="w-5 h-5 rounded-full bg-sky-500/10 border border-sky-500 flex items-center justify-center text-[10px]">1</span>
          <span>SETUP</span>
        </div>
        <div className="h-px bg-slate-800 flex-1 mx-4"></div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px]">2</span>
          <span>COLETA</span>
        </div>
        <div className="h-px bg-slate-800 flex-1 mx-4"></div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px]">3</span>
          <span>RESUMO</span>
        </div>
      </div>

      <div className="space-y-6 w-full max-w-2xl bg-slate-900/50 sm:border sm:border-slate-800 sm:p-8 rounded-3xl">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-white">Novo Lote</h1>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-1">
            Preencha os dados para iniciar a monitoria
          </p>
        </div>

        <form onSubmit={handleStart} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase block font-bold">Frigorífico</label>
            <input
              type="text"
              required
              value={abattoir}
              onChange={(e) => setAbattoir(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors shadow-inner"
              placeholder="Nome ou Código"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase block font-bold">Granja</label>
            <input
              type="text"
              required
              value={farm}
              onChange={(e) => setFarm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors shadow-inner"
              placeholder="Nome ou Código da Granja"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase block font-bold">Lote</label>
            <input
              type="text"
              required
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors shadow-inner"
              placeholder="Identificação do Lote"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase block font-bold">Total de Animais</label>
            <input
              type="number"
              required
              min="1"
              value={totalAnimals}
              onChange={(e) => setTotalAnimals(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors shadow-inner"
              placeholder="Quantidade prevista"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              type="submit"
              className="flex-1 bg-sky-600 hover:bg-sky-500 text-white rounded-xl px-4 py-4 font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(2,132,199,0.3)]"
            >
              <Play className="w-5 h-5" />
              INICIAR COLETA
            </button>
            <button
              type="button"
              onClick={handleSimulate}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl px-4 py-4 font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors border border-slate-700/50 hover:border-sky-500/30"
            >
              <Sparkles className="w-5 h-5 text-sky-400 animate-pulse" />
              SIMULAR LOTE COMPLETO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
