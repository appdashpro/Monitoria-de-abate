import { useEffect, useState } from 'react';
import { db } from '../db';
import { calculateAnimalStats, getEPIndexClassification, getClassificationColor, getIPCategory } from '../utils';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import { Activity, ClipboardList, LayoutDashboard } from 'lucide-react';

interface BatchSummary {
  id: string;
  name: string; // FARM-BATCH
  date: number;
  avgScore: number;
  prevPneumonia: number;
  prevScar: number;
  prevPleurisy: number;
  
}

export function DashboardTab() {
  const [historyData, setHistoryData] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    setLoading(true);
    const batches = await db.batches.orderBy('date').toArray();

    const summaries: BatchSummary[] = [];

    for (const batch of batches) {
      const evaluations = await db.evaluations.where('batchId').equals(batch.id).toArray();
      
      let sumScore = 0;
      let pneumoniaCount = 0;
      let scarCount = 0;
      let pleurisyCount = 0;
      
      
      evaluations.forEach(ev => {
        const stats = calculateAnimalStats(ev);
        sumScore += stats.totalScore;
        
        const category = getIPCategory(stats.areaAffectedPiffer);
        if (category > 0) pneumoniaCount++;
        if (ev.scarring) scarCount++;
        if (ev.pleurisy) pleurisyCount++;
      });

      const totalEvaluated = evaluations.length;
      const avgScore = totalEvaluated ? sumScore / totalEvaluated : 0;
      
      const prevPneumonia = totalEvaluated ? (pneumoniaCount / totalEvaluated) * 100 : 0;
      const prevScar = totalEvaluated ? (scarCount / totalEvaluated) * 100 : 0;
      const prevPleurisy = totalEvaluated ? (pleurisyCount / totalEvaluated) * 100 : 0;

      summaries.push({
        id: batch.id,
        name: `${(batch.farm || 'GRN').substring(0, 3).toUpperCase()}-${batch.batchId || '000'}`,
        date: batch.date,
        avgScore: Number(avgScore.toFixed(2)),
        prevPneumonia: Number(prevPneumonia.toFixed(1)),
        prevScar: Number(prevScar.toFixed(1)),
        prevPleurisy: Number(prevPleurisy.toFixed(1)),
        
      });
    }

    const chartData = [...summaries];

    setHistoryData(chartData);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return <div className="p-6 text-slate-400">Carregando painel...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center">
      <div className="w-full max-w-5xl space-y-8 pb-12">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase text-white flex items-center gap-3">
              <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
              Painel de Indicadores
            </h1>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-2 sm:ml-4">
              Visualização de Desempenho
            </p>
          </div>
        </div>

        {/* Charts Section */}
        {historyData.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl shadow-lg text-center flex flex-col items-center justify-center">
            <LayoutDashboard className="w-12 h-12 text-slate-700 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Painel Vazio</h3>
            <p className="text-slate-400 text-sm max-w-sm">Nenhum lote avaliado encontrado. Conclua avaliações na aba de Coleta para gerar indicadores.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg lg:col-span-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-500" />
              Evolução de Prevalências (%)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="prevPneumonia" name="Pneumonia" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3, fill: '#0ea5e9', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 5, fill: '#0ea5e9', stroke: '#fff' }} />
                  <Line type="monotone" dataKey="prevPleurisy" name="Pleurisia" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff' }} />
                  <Line type="monotone" dataKey="prevScar" name="Cicatriz" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-500" />
              Índice de Consolidação (MADEC Média)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                    cursor={{ fill: '#1e293b', opacity: 0.8 }}
                  />
                  <Bar dataKey="avgScore" name="Pontuação Média" radius={[4, 4, 0, 0]}>
                    {historyData.map((entry, index) => {
                      const classif = getEPIndexClassification(entry.avgScore);
                      const color = classif === 'Leve' ? '#34d399' : classif === 'Intermediário' ? '#fbbf24' : '#f87171';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" />
              Prevalência de Pleurisia (%)
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                    cursor={{ fill: '#1e293b', opacity: 0.8 }}
                  />
                  <Bar dataKey="prevPleurisy" name="Pleurisia (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          </div>
        )}

      </div>
    </div>
  );
}
