import { useEffect, useState } from 'react';
import { db } from '../db';
import { Batch } from '../types';
import { calculateAnimalStats, getIPCategory } from '../utils';
import { useAppStore } from '../store';
import { 
  Trash2, Edit2, Play, ClipboardList, Calendar, Building2, Users, X, Eye, Info, AlertTriangle
} from 'lucide-react';

interface FullBatchRecord {
  batch: Batch;
  totalEvaluated: number;
  avgScore: number;
  
  prevPneumonia: number;
  prevScar: number;
  prevPleurisy: number;
  avgAreaAffected: number;
}

export function HistoryTab() {
  const { currentBatch, setCurrentBatch, setActiveTab, setCurrentAnimalIndex } = useAppStore();
  const [actualBatches, setActualBatches] = useState<FullBatchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit batch state
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [editFarm, setEditFarm] = useState('');
  const [editAbattoir, setEditAbattoir] = useState('');
  const [editTotal, setEditTotal] = useState('');

  // Delete batch state
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    const batches = await db.batches.orderBy('date').toArray();
    const fullRecords: FullBatchRecord[] = [];

    for (const batch of batches) {
      const evaluations = await db.evaluations.where('batchId').equals(batch.id).toArray();
      
      let sumScore = 0;
      let pneumoniaCount = 0;
      let scarCount = 0;
      let pleurisyCount = 0;
      
      let sumAreaAffected = 0;
      
      evaluations.forEach(ev => {
        const stats = calculateAnimalStats(ev);
        sumScore += stats.totalScore;
        const category = getIPCategory(stats.areaAffectedPiffer);
        if (category > 0) pneumoniaCount++;
        if (ev.scarring) scarCount++;
        if (ev.pleurisy) pleurisyCount++;
        
        sumAreaAffected += stats.areaAffectedPiffer;
      });

      const totalEvaluated = evaluations.length;
      const avgScore = totalEvaluated ? sumScore / totalEvaluated : 0;
      const prevPneumonia = totalEvaluated ? (pneumoniaCount / totalEvaluated) * 100 : 0;
      const prevScar = totalEvaluated ? (scarCount / totalEvaluated) * 100 : 0;
      const prevPleurisy = totalEvaluated ? (pleurisyCount / totalEvaluated) * 100 : 0;
      
      const avgAreaAffected = totalEvaluated ? sumAreaAffected / totalEvaluated : 0;

      fullRecords.push({
        batch,
        totalEvaluated,
        avgScore,
        
        prevPneumonia,
        prevScar,
        prevPleurisy,
        avgAreaAffected
      });
    }

    setActualBatches(fullRecords.reverse());
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const confirmDeleteBatch = async () => {
    if (!deletingBatchId) return;
    await db.batches.delete(deletingBatchId);
    await db.evaluations.where('batchId').equals(deletingBatchId).delete();
    
    if (currentBatch && currentBatch.id === deletingBatchId) {
      setCurrentBatch(null);
    }
    
    setDeletingBatchId(null);
    loadHistory();
  };

  const confirmClearAll = async () => {
    await db.batches.clear();
    await db.evaluations.clear();
    setCurrentBatch(null);
    setClearingAll(false);
    loadHistory();
  };

  const handleStartEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setEditFarm(batch.farm);
    setEditAbattoir(batch.abattoir);
    setEditTotal(batch.totalAnimals.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingBatch) return;
    const totalNum = parseInt(editTotal, 10) || editingBatch.totalAnimals;

    await db.batches.update(editingBatch.id, {
      farm: editFarm,
      abattoir: editAbattoir,
      totalAnimals: totalNum
    });

    if (currentBatch && currentBatch.id === editingBatch.id) {
      setCurrentBatch({
        ...currentBatch,
        farm: editFarm,
        abattoir: editAbattoir,
        totalAnimals: totalNum
      });
    }

    setEditingBatch(null);
    loadHistory();
  };

  const handleLoadBatch = async (batch: Batch) => {
    const evals = await db.evaluations.where('batchId').equals(batch.id).toArray();
    setCurrentBatch(batch);
    setCurrentAnimalIndex(evals.length > 0 ? Math.min(evals.length + 1, batch.totalAnimals) : 1);
    setActiveTab('collection');
  };

  const handleViewSummary = (batch: Batch) => {
    setCurrentBatch(batch);
    setActiveTab('summary');
  };

  if (loading) {
    return <div className="p-6 text-slate-400">Carregando histórico...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center">
      <div className="w-full max-w-5xl space-y-8 pb-12">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase text-white flex items-center gap-3">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
              Histórico de Lotes
            </h1>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-2 sm:ml-4">
              Gerenciamento de Coletas Salvas
            </p>
          </div>
          {actualBatches.length > 0 && (
            <button
              onClick={() => setClearingAll(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 rounded-xl font-bold uppercase tracking-wider text-xs border border-red-900/50 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Tudo
            </button>
          )}
        </div>

        {/* Saved Batches Management List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lotes Registrados no Banco</h2>
            <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-800/50 border border-slate-700/50 px-2 py-1 rounded-md">{actualBatches.length} LOTE(S)</span>
          </div>

          {actualBatches.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl space-y-3">
              <ClipboardList className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">Nenhum lote salvo encontrado no banco local.</p>
              <button 
                onClick={() => setActiveTab('setup')}
                className="text-xs text-sky-400 font-bold hover:underline"
              >
                Criar Nova Coleta
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {actualBatches.map((record) => (
                <div 
                  key={record.batch.id} 
                  className={`p-4 sm:p-5 rounded-xl border transition-all ${currentBatch?.id === record.batch.id ? 'bg-sky-950/20 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.05)]' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'}`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {/* Batch Info */}
                    <div className="space-y-2 w-full md:w-auto">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white uppercase break-words">{record.batch.farm || 'Sem nome'}</span>
                        <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-mono font-bold">Lote: {record.batch.batchId || 'N/A'}</span>
                        {currentBatch?.id === record.batch.id && (
                          <span className="text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">ATIVO</span>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-slate-500" /><strong className="text-slate-500 font-medium">Frig:</strong> {record.batch.abattoir}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-500" /> {new Date(record.batch.date).toLocaleDateString('pt-BR')}</span>
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-slate-500" /><strong className="text-slate-500 font-medium">Avaliados:</strong> {record.totalEvaluated} / {record.batch.totalAnimals}</span>
                      </div>
                    </div>

                    {/* Stats & Economic Impact */}
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-slate-900/40 p-2 rounded-lg border border-slate-800/50 text-center">
                        <div>
                          <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">MADEC</div>
                          <div className="text-sm font-black text-white mt-0.5">{record.avgScore.toFixed(2)}</div>
                        </div>
                        <div>
                          
                        </div>
                        <div>
                          <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">PNEUMONIA</div>
                          <div className="text-sm font-black text-sky-400 mt-0.5">{record.prevPneumonia.toFixed(0)}%</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-4 bg-slate-900/40 p-2 rounded-lg border border-slate-800/50 text-center">
                        <div>
                          <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Perda GPD (g/dia)</div>
                          <div className="text-xs font-black text-red-400 mt-0.5">-{(record.avgAreaAffected * 3.74).toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">Piora CA (%)</div>
                          <div className="text-xs font-black text-amber-400 mt-0.5">+{(record.avgAreaAffected * 0.45).toFixed(2)}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleViewSummary(record.batch)}
                        className="flex-1 sm:flex-none p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700/40 hover:border-slate-600/60 flex items-center justify-center gap-1.5 text-xs font-semibold"
                        title="Ver Resumo"
                      >
                        <Eye className="w-4 h-4 text-emerald-400" />
                        <span>Resumo</span>
                      </button>
                      <button
                        onClick={() => handleLoadBatch(record.batch)}
                        className="flex-1 sm:flex-none p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700/40 hover:border-slate-600/60 flex items-center justify-center gap-1.5 text-xs font-semibold"
                        title="Editar Coleta"
                      >
                        <Play className="w-4 h-4 text-sky-400" />
                        <span>Coletar</span>
                      </button>
                      <button
                        onClick={() => handleStartEdit(record.batch)}
                        className="flex-1 sm:flex-none p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700/40 hover:border-slate-600/60 flex items-center justify-center gap-1.5 text-xs font-semibold"
                        title="Editar Dados"
                      >
                        <Edit2 className="w-4 h-4 text-yellow-400" />
                        <span className="sm:hidden">Dados</span>
                      </button>
                      <button
                        onClick={() => setDeletingBatchId(record.batch.id)}
                        className="flex-1 sm:flex-none p-2.5 bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-slate-800 hover:border-red-900/50 flex items-center justify-center"
                        title="Excluir Lote"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sm:hidden">Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* EDIT BATCH DETAILS MODAL */}
      {editingBatch && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-6 shadow-2xl animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-yellow-400" />
                Editar Lote
              </h3>
              <button 
                onClick={() => setEditingBatch(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Granja</label>
                <input
                  type="text"
                  value={editFarm}
                  onChange={(e) => setEditFarm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Frigorífico</label>
                <input
                  type="text"
                  value={editAbattoir}
                  onChange={(e) => setEditAbattoir(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Total de Animais</label>
                <input
                  type="number"
                  value={editTotal}
                  onChange={(e) => setEditTotal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-colors"
                />
                <p className="text-[10px] text-slate-500 mt-1.5 flex items-start gap-1">
                  <Info className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                  <span>Atenção: alterar o total de animais afeta apenas o limite de coleta. Nenhuma avaliação existente será removida.</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingBatch(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-colors order-1 sm:order-2"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingBatchId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-900/30 p-6 rounded-2xl w-full max-w-sm space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-black uppercase text-white tracking-tight">Excluir Lote?</h3>
              <p className="text-sm text-slate-400">
                Esta ação apagará permanentemente todos os dados e avaliações deste lote. Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setDeletingBatchId(null)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteBatch}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-colors"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR ALL CONFIRMATION MODAL */}
      {clearingAll && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-900/50 p-6 rounded-2xl w-full max-w-sm space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-black uppercase text-white tracking-tight">Limpar Todo Histórico?</h3>
              <p className="text-sm text-slate-400">
                Você está prestes a apagar <strong>TODOS</strong> os lotes e avaliações salvos no aparelho. Esta ação não tem volta.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setClearingAll(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-colors"
              >
                Limpar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
