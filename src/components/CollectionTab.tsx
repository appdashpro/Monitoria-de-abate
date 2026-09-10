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
];

export function CollectionTab() {
  const { currentBatch, currentAnimalIndex, setCurrentAnimalIndex, setActiveTab } = useAppStore();
  const [evaluation, setEvaluation] = useState<Partial<AnimalEvaluation>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [activeFieldIndex, setActiveFieldIndex] = useState(0);

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
      id: evaluation.id,
      rightCranial: 0,
      rightMiddle: 0,
      rightCaudal: 0,
      accessory: 0,
      leftCranial: 0,
      leftMiddle: 0,
      leftCaudal: 0,
      scarring: false,
      pleurisy: false,
    });
    setActiveFieldIndex(0);
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
        scarring: updatedEval.scarring || false,
        pleurisy: updatedEval.pleurisy || false,
      };
      setEvaluation(toSave);
      db.evaluations.put(toSave).catch(console.error);
    } else {
      setEvaluation(updatedEval);
    }
    
    const index = FIELD_KEYS.indexOf(key);
    if (index !== -1 && index < FIELD_KEYS.length - 1 && typeof value === 'number') {
      setActiveFieldIndex(index + 1);
    }
  };

  const isLast = currentAnimalIndex === currentBatch?.totalAnimals;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const handleLobeClick = (id: string) => {
    setActiveFieldIndex(FIELD_KEYS.indexOf(id as keyof AnimalEvaluation));
  };

  const LungLobe = ({ id, label, value, isActive, onClick, className }: any) => (
    <button
      onClick={() => onClick(id)}
      className={cn(
        "relative flex flex-col items-center justify-center border-2 transition-all overflow-hidden cursor-pointer",
        isActive ? "border-sky-500 bg-sky-900/40 shadow-[0_0_20px_rgba(14,165,233,0.4)] z-10 scale-[1.03]" : "border-slate-800 bg-slate-900 hover:border-slate-700",
        className
      )}
    >
      <span className={cn(
        "text-[9px] md:text-xs font-bold uppercase tracking-tighter absolute top-2 text-center w-full px-1 leading-tight",
        isActive ? "text-sky-300" : "text-slate-500"
      )}>{label}</span>
      <span className={cn(
        "text-2xl md:text-4xl font-black mt-4",
        value !== undefined && value !== null ? "text-white" : "text-slate-800"
      )}>{value !== undefined && value !== null ? value : '-'}</span>
    </button>
  );

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

      {/* Center Panel: Lobes Evaluation */}
      <section className="flex-1 bg-slate-950 md:bg-slate-900 md:rounded-2xl md:border border-slate-800 flex flex-col relative overflow-hidden md:shadow-lg">
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-72 md:pb-8 flex flex-col items-center">

          {/* Lungs Diagram */}
          <div className="max-w-sm mx-auto w-full relative mb-4">
            {/* Trachea */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-10 bg-slate-800 rounded-full z-0 opacity-40 border border-slate-700"></div>

            <div className="flex gap-2 md:gap-4 h-[35vh] min-h-[260px] max-h-[380px] relative z-10 pt-2">
              {/* Left Lung */}
              <div className="flex-1 flex flex-col gap-2 md:gap-3">
                <LungLobe id="leftCranial" label="Cran. Esq" value={evaluation.leftCranial} isActive={FIELD_KEYS[activeFieldIndex] === 'leftCranial'} onClick={handleLobeClick} className="flex-[0.3] rounded-t-full rounded-bl-3xl rounded-br-md" />
                <LungLobe id="leftMiddle" label="Méd. Esq" value={evaluation.leftMiddle} isActive={FIELD_KEYS[activeFieldIndex] === 'leftMiddle'} onClick={handleLobeClick} className="flex-[0.25] rounded-l-2xl rounded-r-md" />
                <LungLobe id="leftCaudal" label="Caudal Esq" value={evaluation.leftCaudal} isActive={FIELD_KEYS[activeFieldIndex] === 'leftCaudal'} onClick={handleLobeClick} className="flex-[0.45] rounded-b-full rounded-tl-md rounded-tr-md" />
              </div>

              {/* Right Lung */}
              <div className="flex-1 flex flex-col gap-2 md:gap-3">
                <LungLobe id="rightCranial" label="Cran. Dir" value={evaluation.rightCranial} isActive={FIELD_KEYS[activeFieldIndex] === 'rightCranial'} onClick={handleLobeClick} className="flex-[0.3] rounded-t-full rounded-br-3xl rounded-bl-md" />
                <LungLobe id="rightMiddle" label="Méd. Dir" value={evaluation.rightMiddle} isActive={FIELD_KEYS[activeFieldIndex] === 'rightMiddle'} onClick={handleLobeClick} className="flex-[0.25] rounded-r-2xl rounded-l-md" />
                <div className="flex-[0.45] flex gap-2 md:gap-3">
                  <LungLobe id="accessory" label="Acessório" value={evaluation.accessory} isActive={FIELD_KEYS[activeFieldIndex] === 'accessory'} onClick={handleLobeClick} className="flex-[0.4] rounded-b-3xl rounded-t-md" />
                  <LungLobe id="rightCaudal" label="Caud. Dir" value={evaluation.rightCaudal} isActive={FIELD_KEYS[activeFieldIndex] === 'rightCaudal'} onClick={handleLobeClick} className="flex-[0.6] rounded-b-full rounded-tl-md rounded-tr-md" />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Only Keypad & Flags */}
          <div className="hidden md:flex w-full max-w-sm flex-col gap-4 mt-6">
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map(val => (
                <button
                  key={val}
                  onClick={() => {
                    const currentField = FIELD_KEYS[activeFieldIndex];
                    if (currentField) updateValue(currentField, val);
                  }}
                  className="flex-1 h-14 bg-slate-800 text-white rounded-xl text-xl font-black border border-slate-700 hover:bg-slate-700 active:bg-sky-600 transition-colors shadow-lg"
                >
                  {val}
                </button>
              ))}
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => updateValue('scarring', !evaluation.scarring)}
                className={cn(
                  "flex-1 h-14 rounded-lg font-bold flex items-center justify-center gap-2 border transition-colors text-sm",
                  evaluation.scarring 
                    ? "bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
                    : "bg-slate-950 text-slate-500 border-slate-800 hover:bg-slate-900"
                )}
              >
                <Check className={cn("w-5 h-5", evaluation.scarring ? "opacity-100" : "opacity-20")} />
                Cicatriz
              </button>
              <button
                onClick={() => updateValue('pleurisy', !evaluation.pleurisy)}
                className={cn(
                  "flex-1 h-14 rounded-lg font-bold flex items-center justify-center gap-2 border transition-colors text-sm",
                  evaluation.pleurisy 
                    ? "bg-red-500 text-white border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]" 
                    : "bg-slate-950 text-slate-500 border-slate-800 hover:bg-slate-900"
                )}
              >
                <Check className={cn("w-5 h-5", evaluation.pleurisy ? "opacity-100" : "opacity-20")} />
                Pleurisia CV
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Mobile One-Handed Keypad (Hidden on Desktop) */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 p-3 bg-slate-900 border-t border-slate-800 flex flex-col gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
        
        {/* Active Field Indicator */}
        <div className="flex justify-between items-center px-1">
          <span className="text-sky-400 font-bold text-sm uppercase tracking-wider">
            Avaliando: {LOBES.find(l => l.id === FIELD_KEYS[activeFieldIndex])?.label || ''}
          </span>
          <span className="text-slate-500 text-xs font-mono">
            {activeFieldIndex + 1} / {FIELD_KEYS.length}
          </span>
        </div>

        {/* Score Keypad */}
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map(val => (
            <button
              key={val}
              onClick={() => {
                const currentField = FIELD_KEYS[activeFieldIndex];
                if (currentField) updateValue(currentField, val);
              }}
              className="flex-1 h-14 bg-slate-800 text-white rounded-xl text-2xl font-black border border-slate-700 active:bg-sky-600 transition-colors shadow-lg"
            >
              {val}
            </button>
          ))}
        </div>
        
        {/* Boolean Flags & Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => updateValue('scarring', !evaluation.scarring)}
            className={cn(
              "flex-1 h-12 rounded-lg font-bold flex items-center justify-center gap-2 border transition-colors text-sm",
              evaluation.scarring 
                ? "bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]" 
                : "bg-slate-950 text-slate-500 border-slate-800"
            )}
          >
            <Check className={cn("w-4 h-4", evaluation.scarring ? "opacity-100" : "opacity-20")} />
            Cicatriz
          </button>
          <button
            onClick={() => updateValue('pleurisy', !evaluation.pleurisy)}
            className={cn(
              "flex-1 h-12 rounded-lg font-bold flex items-center justify-center gap-2 border transition-colors text-sm",
              evaluation.pleurisy 
                ? "bg-red-500 text-white border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]" 
                : "bg-slate-950 text-slate-500 border-slate-800"
            )}
          >
            <Check className={cn("w-4 h-4", evaluation.pleurisy ? "opacity-100" : "opacity-20")} />
            Pleurisia CV
          </button>
        </div>

        {/* Next/Clear */}
        <div className="flex gap-2 mt-1">
          <button
            onClick={handleClear}
            className="w-14 h-12 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 border border-slate-700"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className={cn(
              "flex-1 h-12 rounded-lg font-bold uppercase tracking-wider flex items-center justify-center transition-colors shadow-lg text-sm",
              isLast 
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(5,150,105,0.3)]" 
                : "bg-sky-600 hover:bg-sky-500 text-white shadow-[0_0_15px_rgba(2,132,199,0.3)]"
            )}
          >
            {isLast ? "FINALIZAR COLETA" : "PRÓXIMO ANIMAL"}
          </button>
        </div>
      </div>
    </div>
  );
}
