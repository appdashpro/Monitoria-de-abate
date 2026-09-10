import { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useAppStore } from '../store';
import { db } from '../db';
import { AnimalEvaluation } from '../types';
import { calculateAnimalStats, cn, generateId } from '../utils';
import { ChevronLeft, ChevronRight, RotateCcw, Check, Activity } from 'lucide-react';

const LOBES = [
  { id: 'leftCranial', label: 'Cranial Esq.', weight: 10 },
  { id: 'leftMiddle', label: 'Médio Esq.', weight: 10 },
  { id: 'leftCaudal', label: 'Caudal Esq.', weight: 25 },
  { id: 'rightCranial', label: 'Cranial Dir.', weight: 10 },
  { id: 'rightMiddle', label: 'Médio Dir.', weight: 10 },
  { id: 'rightCaudal', label: 'Caudal Dir.', weight: 25 },
  { id: 'accessory', label: 'Acessório', weight: 10 },
] as const;

const FIELD_KEYS: (keyof AnimalEvaluation)[] = [
  'leftCranial',
  'leftMiddle',
  'leftCaudal',
  'rightCranial',
  'rightMiddle',
  'rightCaudal',
  'accessory',
  'spes'
];

export function CollectionTab() {
  const { currentBatch, currentAnimalIndex, setCurrentAnimalIndex, setActiveTab } = useAppStore();
  const [evaluation, setEvaluation] = useState<Partial<AnimalEvaluation>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeFieldIndex, setActiveFieldIndex] = useState(0);

  // Load existing evaluation if moving back
  useEffect(() => {
    setActiveFieldIndex(0);
    if (!currentBatch) return;
    
    const loadEvaluation = async () => {
      const existing = await db.evaluations.get({
        batchId: currentBatch.id,
        animalIndex: currentAnimalIndex
      });
      
      if (existing) {
        setEvaluation(existing);
      } else {
        setEvaluation({
          rightCranial: 0,
          rightMiddle: 0,
          rightCaudal: 0,
          accessory: 0,
          leftCranial: 0,
          leftMiddle: 0,
          leftCaudal: 0,
          spes: 0,
          scarring: false,
          pleurisy: false,
        });
      }
    };
    
    loadEvaluation();
  }, [currentBatch, currentAnimalIndex]);

  const saveCurrent = async () => {
    if (!currentBatch) return;
    setIsSaving(true);
    
    const toSave: AnimalEvaluation = {
      id: evaluation.id || generateId(),
      batchId: currentBatch.id,
      animalIndex: currentAnimalIndex,
      rightCranial: evaluation.rightCranial || 0,
      rightMiddle: evaluation.rightMiddle || 0,
      rightCaudal: evaluation.rightCaudal || 0,
      accessory: evaluation.accessory || 0,
      leftCranial: evaluation.leftCranial || 0,
      leftMiddle: evaluation.leftMiddle || 0,
      leftCaudal: evaluation.leftCaudal || 0,
      spes: evaluation.spes || 0,
      scarring: evaluation.scarring || false,
      pleurisy: evaluation.pleurisy || false,
    };
    
    await db.evaluations.put(toSave);
    setIsSaving(false);
  };

  const handleNext = async () => {
    if (!currentBatch) return;
    await saveCurrent();
    
    if (currentAnimalIndex < currentBatch.totalAnimals) {
      setCurrentAnimalIndex(currentAnimalIndex + 1);
    } else {
      setActiveTab('summary');
    }
  };

  const handlePrev = async () => {
    if (currentAnimalIndex > 1) {
      await saveCurrent();
      setCurrentAnimalIndex(currentAnimalIndex - 1);
    }
  };

  const handleClear = () => {
    setEvaluation({
      id: evaluation.id, // keep the ID if it exists
      rightCranial: 0,
      rightMiddle: 0,
      rightCaudal: 0,
      accessory: 0,
      leftCranial: 0,
      leftMiddle: 0,
      leftCaudal: 0,
      spes: 0,
      scarring: false,
      pleurisy: false,
    });
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handlePrev(),
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  const updateValue = (key: keyof AnimalEvaluation, value: string | number | boolean) => {
    const updatedEval = { ...evaluation, [key]: value };
    if (currentBatch) {
      const toSave: AnimalEvaluation = {
        id: updatedEval.id || generateId(),
        batchId: currentBatch.id,
        animalIndex: currentAnimalIndex,
        rightCranial: updatedEval.rightCranial || 0,
        rightMiddle: updatedEval.rightMiddle || 0,
        rightCaudal: updatedEval.rightCaudal || 0,
        accessory: updatedEval.accessory || 0,
        leftCranial: updatedEval.leftCranial || 0,
        leftMiddle: updatedEval.leftMiddle || 0,
        leftCaudal: updatedEval.leftCaudal || 0,
        spes: updatedEval.spes || 0,
        scarring: updatedEval.scarring || false,
        pleurisy: updatedEval.pleurisy || false,
      };
      setEvaluation(toSave);
      db.evaluations.put(toSave).catch(console.error);
    } else {
      setEvaluation(updatedEval);
    }
    const index = FIELD_KEYS.indexOf(key);
    if (index !== -1 && index < FIELD_KEYS.length - 1) {
      setActiveFieldIndex(index + 1);
    }
  };

  const isLast = currentAnimalIndex === currentBatch?.totalAnimals;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em um input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key >= '0' && e.key <= '4') {
        const val = parseInt(e.key, 10);
        const currentField = FIELD_KEYS[activeFieldIndex];
        if (currentField) {
          updateValue(currentField, val);
        }
      } else if (e.key.toLowerCase() === 'c') {
        updateValue('scarring', !evaluation.scarring);
      } else if (e.key.toLowerCase() === 'p') {
        updateValue('pleurisy', !evaluation.pleurisy);
      } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
        if (!isSaving && (!isLast || !isSaving)) {
           handleNext();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentAnimalIndex > 1) {
           handlePrev();
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFieldIndex, evaluation, currentAnimalIndex, isSaving, isLast]);

  if (!currentBatch) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center mb-4 shadow-lg">
          <Activity className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Nenhum Lote Ativo</h2>
        <p className="text-sm text-slate-400 mb-6 max-w-sm">Inicie um novo lote na aba Setup para começar a coleta de dados.</p>
        <button 
          onClick={() => setActiveTab('setup')}
          className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(2,132,199,0.3)]"
        >
          Ir para Setup
        </button>
      </div>
    );
  }

  const stats = calculateAnimalStats(evaluation);

  const ScoreButtonGroup = ({ label, valueKey, max = 4 }: { label: string, valueKey: keyof AnimalEvaluation, max?: number }) => {
    const isActive = FIELD_KEYS[activeFieldIndex] === valueKey;
    return (
      <div className={cn("group mb-1.5 md:mb-6 flex md:block items-center justify-between gap-4 md:gap-0 p-1 md:p-0 rounded-lg md:rounded-none transition-colors", isActive ? "bg-slate-800/50 md:bg-transparent ring-1 ring-sky-500/50 md:ring-0" : "")}>
        <label className={cn("text-[10px] md:text-xs uppercase block md:mb-2 font-bold w-1/3 md:w-auto text-left leading-tight transition-colors", isActive ? "text-sky-400" : "text-slate-500")}>
          {label}
        </label>
        <div className="flex gap-1 md:gap-2 flex-1 justify-end">
          {Array.from({ length: max + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => updateValue(valueKey, i)}
              className={cn(
                "flex-1 max-w-10 h-8 md:max-w-none md:h-auto md:aspect-square rounded-md md:rounded-lg font-bold text-sm md:text-lg transition-colors border",
                evaluation[valueKey] === i
                  ? "bg-sky-500 border-sky-400 text-white shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
              )}
            >
              {i}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div {...handlers} className="flex-1 flex flex-col md:flex-row h-full bg-slate-950 overflow-hidden md:p-6 gap-0 md:gap-6">
      
      {/* Left Panel: Navigation & Stats */}
      <aside className="w-full md:w-80 flex flex-col gap-0 md:gap-4 shrink-0">
        
        {/* Top Header / Progress */}
        <div className="bg-slate-900 md:rounded-2xl border-b md:border border-slate-800 p-2 md:p-6 flex items-center justify-between md:flex-col md:items-center shadow-lg shrink-0">
          <button 
            onClick={handlePrev} 
            disabled={currentAnimalIndex === 1}
            className="md:hidden p-2 text-slate-400 disabled:opacity-20 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center w-full flex items-center justify-center gap-2 md:block">
            <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest mb-0 md:mb-1">Progresso</div>
            <div className="text-lg md:text-5xl font-black text-white italic leading-none">
              {currentAnimalIndex} <span className="text-slate-600 text-sm md:text-2xl not-italic ml-0.5 md:ml-2 italic">/ {currentBatch.totalAnimals}</span>
            </div>
            <div className="hidden md:block w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
              <div 
                className="bg-sky-500 h-full transition-all duration-300 shadow-[0_0_10px_rgba(56,189,248,0.5)]" 
                style={{width: `${(currentAnimalIndex / currentBatch.totalAnimals)*100}%`}}
              ></div>
            </div>
          </div>

          <button 
            onClick={handleNext} 
            disabled={isLast && isSaving}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Panel */}
        <div className="hidden md:flex flex-col bg-slate-900 border md:rounded-2xl border-slate-800 shrink-0 md:flex-1 md:p-6 gap-6 shadow-lg">
          
          {/* Desktop Real-time stats */}
          <div className="hidden md:block">
            <div className="text-xs text-slate-500 uppercase mb-4 tracking-widest">Métricas em Tempo Real</div>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400 text-sm">Área Afetada (%)</span>
                <span className="font-mono text-emerald-400 text-lg font-bold">{stats.areaAffected.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400 text-sm">Índice SPES</span>
                <span className="font-mono text-sky-400 text-lg font-bold">{stats.spes}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400 text-sm">Soma Pontos</span>
                <span className="font-mono text-white text-lg font-bold">{stats.totalScore}</span>
              </div>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex mt-auto flex-col gap-3">
            <button
              onClick={handleClear}
              className="w-full py-4 bg-slate-800 text-slate-300 rounded-xl font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors"
            >
              Desfazer
            </button>
            <button
              onClick={handleNext}
              className={cn(
                "w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-colors shadow-lg",
                isLast 
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20" 
                  : "bg-sky-600 hover:bg-sky-500 text-white shadow-sky-900/20"
              )}
            >
              {isLast ? "Finalizar Coleta" : "Próximo Animal"}
            </button>
          </div>
        </div>
      </aside>

      {/* Center Panel: Lobos Evaluation */}
      <section className="flex-1 bg-slate-950 md:bg-slate-900 md:rounded-2xl md:border border-slate-800 flex flex-col relative overflow-hidden md:shadow-lg">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-2 md:p-8 pb-20 md:pb-8">
          <div className="md:grid md:grid-cols-2 gap-x-12">
            <div className="space-y-0 md:space-y-2">
              {LOBES.slice(0, 3).map((lobe) => (
                <div key={lobe.id}>
                  <ScoreButtonGroup label={lobe.label} valueKey={lobe.id as keyof AnimalEvaluation} />
                </div>
              ))}
            </div>
            <div className="space-y-0 md:space-y-2">
              {LOBES.slice(3, 7).map((lobe) => (
                <div key={lobe.id}>
                  <ScoreButtonGroup label={lobe.label} valueKey={lobe.id as keyof AnimalEvaluation} />
                </div>
              ))}
              
              <ScoreButtonGroup label="SPES (Pleurisia)" valueKey="spes" />

              <div className="grid grid-cols-2 gap-2 md:gap-4 mt-1 md:mt-2">
                <button
                  onClick={() => updateValue('scarring', !evaluation.scarring)}
                  className={cn(
                    "p-2 md:p-4 rounded-lg md:rounded-xl font-bold flex flex-row md:flex-col items-center justify-center gap-1 md:gap-2 border transition-colors text-[10px] md:text-base",
                    evaluation.scarring 
                      ? "bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
                      : "bg-slate-950 md:bg-slate-800 text-slate-500 border-slate-800 md:border-slate-700"
                  )}
                >
                  <Check className={cn("w-3 h-3 md:w-6 md:h-6 shrink-0", evaluation.scarring ? "opacity-100" : "opacity-20")} />
                  Cicatriz
                </button>
                <button
                  onClick={() => updateValue('pleurisy', !evaluation.pleurisy)}
                  className={cn(
                    "p-2 md:p-4 rounded-lg md:rounded-xl font-bold flex flex-row md:flex-col items-center justify-center gap-1 md:gap-2 border transition-colors text-[10px] md:text-base leading-tight",
                    evaluation.pleurisy 
                      ? "bg-red-500 text-white border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]" 
                      : "bg-slate-950 md:bg-slate-800 text-slate-500 border-slate-800 md:border-slate-700"
                  )}
                >
                  <Check className={cn("w-3 h-3 md:w-6 md:h-6 shrink-0", evaluation.pleurisy ? "opacity-100" : "opacity-20")} />
                  Pleurisia CV
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Footer Actions */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 p-3 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 flex gap-2">
        <button
          onClick={handleClear}
          className="p-3 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          className={cn(
            "flex-1 p-3 rounded-lg font-bold uppercase tracking-wider flex items-center justify-center transition-colors shadow-lg text-sm",
            isLast 
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(5,150,105,0.3)]" 
              : "bg-sky-600 hover:bg-sky-500 text-white shadow-[0_0_15px_rgba(2,132,199,0.3)]"
          )}
        >
          {isLast ? "FINALIZAR COLETA" : "PRÓXIMO ANIMAL"}
        </button>
      </div>
    </div>
  );
}
