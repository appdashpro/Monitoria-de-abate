import { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { db } from '../db';
import { AnimalEvaluation } from '../types';
import { calculateAnimalStats, LOBE_WEIGHTS, getEPIndexClassification, getAPIndexClassification, getIPCategory, getIPInterpretation, getClassificationColor, cn } from '../utils';
import { Download, RotateCcw, ClipboardList, Printer, Share2, Check, Info, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function SummaryTab() {
  const { currentBatch, setCurrentBatch, setActiveTab } = useAppStore();
  const [evaluations, setEvaluations] = useState<AnimalEvaluation[]>([]);
  const [copied, setCopied] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState<string | null>(null);

  const METRICS_INFO = {
    ip: {
      title: 'Index of Pneumonia (IP)',
      range: '0 a 6',
      description: 'Índice de pneumonia (IP) estabelece o estado de pneumonia da população, avaliando a frequência de animais por porcentagem de lesão pulmonar.',
      clinical: 'Classifica o rebanho com base no valor médio: 0 a 0,55 (Imperceptível); 0,56 a 0,89 (Presente, sem ameaça); > 0,89 (Grave - Situação complicada).'
    },
    madec: {
      title: 'Índice Médio (MADEC)',
      range: '0 a 28 pontos',
      description: 'Reflete a soma da gravidade das lesões de pneumonia micoplásmica. Cada um dos 7 lobos pulmonares recebe uma nota de 0 a 4. O índice médio do lote indica a severidade geral do desafio respiratório na granja.',
      clinical: 'Classificação média do lote: ≤ 1,49 (Leve); 1,50 a 2,40 (Intermediário); > 2,40 (Grave). Valores mais altos indicam quadros mais severos de infecção por Mycoplasma hyopneumoniae.'
    },
    spes: {
      title: 'Índice SPES Médio',
      range: '0 a 4 pontos',
      description: 'O Slaughterhouse Pleurisy Evaluation System (SPES) avalia a presença e extensão de aderências pleurais. Varia de 0 (ausência) a 4 (aderências pleurais bilaterais extensas).',
      clinical: 'Avalia o histórico de pleurisia no rebanho, permitindo entender o grau crônico de problemas respiratórios.'
    },
    appi: {
      title: 'APP Index (APPI)',
      range: '0 a 4 pontos',
      description: 'O índice APPI considera apenas as lesões SPES de notas 2, 3 e 4, que são tipicamente associadas ao Actinobacillus pleuropneumoniae (APP).',
      clinical: 'Classificação do lote: < 0,30 (Leve); 0,30 a 0,60 (Intermediário); > 0,60 (Grave). Impacta severamente na conversão alimentar e ganho de peso do lote.'
    },
    pneumonia: {
      title: 'Prevalência de Pneumonia',
      range: '0 a 100%',
      description: 'Porcentagem de pulmões que se enquadram nas categorias de 1 a 6 do Índice de Pneumonia (IPP - Piffer & Brito).',
      clinical: 'Mede a dispersão ou incidência da doença respiratória no rebanho. Uma prevalência alta indica que o agente circulou amplamente.'
    },
    scar: {
      title: 'Prevalência de Cicatrizes',
      range: '0 a 100%',
      description: 'Porcentagem de pulmões que apresentam retrações e áreas de tecido cicatricial (fibrose), indicativas de lesões pulmonares curadas.',
      clinical: 'Demonstra a capacidade de recuperação dos animais ou a ocorrência de infecções em estágios mais iniciais da recria, que tiveram tempo para cicatrizar antes do abate.'
    },
    pleurisy: {
      title: 'Prevalência de Pleurisia',
      range: '0 a 100%',
      description: 'Porcentagem de pulmões com alguma ocorrência de aderência de pleura, não importando a gravidade (SPES ≥ 1 ou lesão de pleurisia crânio-ventral).',
      clinical: 'Indica a proporção de animais afetados por processos inflamatórios da pleura, resultando em aderências. Tais aderências são frequentemente causas de condenações parciais de carcaça e atrasos no ganho de peso.'
    }
  };

  useEffect(() => {
    if (!currentBatch) return;
    
    db.evaluations
      .where('batchId')
      .equals(currentBatch.id)
      .toArray()
      .then(setEvaluations);
  }, [currentBatch]);

  if (!currentBatch) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center mb-4 shadow-lg">
          <ClipboardList className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Nenhum Lote Ativo</h2>
        <p className="text-sm text-slate-400 mb-6 max-w-sm">Inicie um novo lote na aba Setup e realize as avaliações para ver o resumo.</p>
        <button 
          onClick={() => setActiveTab('setup')}
          className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(2,132,199,0.3)]"
        >
          Ir para Setup
        </button>
      </div>
    );
  }

  const totalEvaluated = evaluations.length;
  
  let sumScore = 0;
  let pneumoniaCount = 0;
  let scarCount = 0;
  let pleurisyCount = 0;
  let sumSpes = 0;
  let sumAppi = 0;
  let sumIpCategory = 0;
  let sumAreaAffectedMadec = 0;
  let sumAreaAffectedPiffer = 0;
  const ipCategoryCounts = [0, 0, 0, 0, 0, 0, 0];
  
  const lobeSums = {
    rightCranial: 0, rightMiddle: 0, rightCaudal: 0, accessory: 0,
    leftCranial: 0, leftMiddle: 0, leftCaudal: 0,
  };

  evaluations.forEach(ev => {
    const stats = calculateAnimalStats(ev);
    sumScore += stats.totalScore;
    const category = getIPCategory(stats.areaAffectedPiffer);
    if (category > 0) pneumoniaCount++;
    if (ev.scarring) scarCount++;
    if (ev.pleurisy) pleurisyCount++;
    sumSpes += stats.spes;
    sumAppi += stats.appi;
    sumIpCategory += category;
    ipCategoryCounts[category]++;
    sumAreaAffectedMadec += stats.areaAffected;
    sumAreaAffectedPiffer += stats.areaAffectedPiffer;

    lobeSums.rightCranial += ev.rightCranial || 0;
    lobeSums.rightMiddle += ev.rightMiddle || 0;
    lobeSums.rightCaudal += ev.rightCaudal || 0;
    lobeSums.accessory += ev.accessory || 0;
    lobeSums.leftCranial += ev.leftCranial || 0;
    lobeSums.leftMiddle += ev.leftMiddle || 0;
    lobeSums.leftCaudal += ev.leftCaudal || 0;
  });

  const avgScore = totalEvaluated ? (sumScore / totalEvaluated).toFixed(2) : '0';
  const prevPneumonia = totalEvaluated ? ((pneumoniaCount / totalEvaluated) * 100).toFixed(1) : '0';
  const prevScar = totalEvaluated ? ((scarCount / totalEvaluated) * 100).toFixed(1) : '0';
  const prevPleurisy = totalEvaluated ? ((pleurisyCount / totalEvaluated) * 100).toFixed(1) : '0';
  const avgSpes = totalEvaluated ? (sumSpes / totalEvaluated).toFixed(2) : '0';
  const avgAppi = totalEvaluated ? (sumAppi / totalEvaluated).toFixed(2) : '0';
  const avgIp = totalEvaluated ? (sumIpCategory / totalEvaluated).toFixed(2) : '0';
  const avgAreaAffectedMadec = totalEvaluated ? (sumAreaAffectedMadec / totalEvaluated).toFixed(2) : '0';
  const avgAreaAffectedPiffer = totalEvaluated ? (sumAreaAffectedPiffer / totalEvaluated).toFixed(2) : '0';
  
  const lossGramsPerDay = (Number(avgAreaAffectedPiffer) * 3.74).toFixed(1);
  const lossFcrPercent = (Number(avgAreaAffectedPiffer) * 0.45).toFixed(2);

  const handlePrintPDF = () => {
    if (evaluations.length === 0) return;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Inspeção de Abate (Pneumonia)', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Granja: ${currentBatch.farm}`, 14, 32);
    doc.text(`Lote: ${currentBatch.batchId}`, 14, 38);
    doc.text(`Frigorífico: ${currentBatch.abattoir}`, 100, 32);
    doc.text(`Data: ${new Date(currentBatch.date).toLocaleDateString('pt-BR')}`, 100, 38);
    
    autoTable(doc, {
      startY: 45,
      head: [['Métricas Principais', 'Valor']],
      body: [
        ['Pulmões Avaliados', `${totalEvaluated} / ${currentBatch.totalAnimals}`],
        ['Índice de Pneumonia (IP) - Piffer & Brito', avgIp],
        ['Área Afetada Média (Piffer & Brito)', `${avgAreaAffectedPiffer}%`],
        ['Índice Médio (MADEC)', avgScore],
        ['Área Afetada Média (MADEC)', `${avgAreaAffectedMadec}%`],
        ['SPES Médio', avgSpes],
        ['APP Index (APPI)', avgAppi],
        ['Prevalência Pneumonia', `${prevPneumonia}%`],
        ['Prevalência Cicatrizes', `${prevScar}%`],
        ['Prevalência Pleurisia', `${prevPleurisy}%`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [14, 165, 233] }
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Impacto Econômico Estimado', 'Valor']],
      body: [
        ['Perda de Ganho de Peso Diário (GPD)', `-${lossGramsPerDay} g/dia`],
        ['Piora na Conversão Alimentar (CA)', `+${lossFcrPercent}%`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105] }
    });
    
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Lobo Pulmonar', 'Peso Operacional (MADEC)', 'Média (0-4)']],
      body: [
        ['Cranial Direito', '10%', (totalEvaluated ? (lobeSums.rightCranial / totalEvaluated) : 0).toFixed(2)],
        ['Médio Direito', '10%', (totalEvaluated ? (lobeSums.rightMiddle / totalEvaluated) : 0).toFixed(2)],
        ['Caudal Direito', '25%', (totalEvaluated ? (lobeSums.rightCaudal / totalEvaluated) : 0).toFixed(2)],
        ['Acessório', '10%', (totalEvaluated ? (lobeSums.accessory / totalEvaluated) : 0).toFixed(2)],
        ['Cranial Esquerdo', '10%', (totalEvaluated ? (lobeSums.leftCranial / totalEvaluated) : 0).toFixed(2)],
        ['Médio Esquerdo', '10%', (totalEvaluated ? (lobeSums.leftMiddle / totalEvaluated) : 0).toFixed(2)],
        ['Caudal Esquerdo', '25%', (totalEvaluated ? (lobeSums.leftCaudal / totalEvaluated) : 0).toFixed(2)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105] }
    });

    doc.setFontSize(9);
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} via Monitoria de Abate PWA`, 14, doc.internal.pageSize.getHeight() - 10);
    
    doc.save(`Relatorio_${currentBatch.batchId}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleShareText = () => {
    const text = `📊 *MONITORIA DE ABATE - RESUMO DO LOTE* 📊
------------------------------------------
🏡 *Granja:* ${currentBatch.farm}
🔢 *Lote:* ${currentBatch.batchId}
🏭 *Frigorífico:* ${currentBatch.abattoir}
📅 *Data:* ${new Date(currentBatch.date).toLocaleDateString('pt-BR')}

📈 *Métricas Principais:*
• Pulmões Avaliados: ${totalEvaluated} / ${currentBatch.totalAnimals}
• Índice de Pneumonia (IP) Piffer: ${avgIp}
• Área Afetada Média (Piffer): ${avgAreaAffectedPiffer}%
• Índice Médio (MADEC): ${avgScore}
• Área Afetada Média (MADEC): ${avgAreaAffectedMadec}%
• SPES Médio: ${avgSpes}
• APP Index (APPI): ${avgAppi}
• Prev. Pneumonia: ${prevPneumonia}%
• Prev. Cicatrizes: ${prevScar}%
• Prev. Pleurisia: ${prevPleurisy}%

💰 *Impacto Econômico Estimado (Straw et al., 1989):*
• Perda de GPD: -${lossGramsPerDay} g/dia
• Piora na CA: +${lossFcrPercent}%

🔬 *Médias por Lobo:*
• Cranial Dir.: ${(totalEvaluated ? (lobeSums.rightCranial / totalEvaluated) : 0).toFixed(2)}
• Médio Dir.: ${(totalEvaluated ? (lobeSums.rightMiddle / totalEvaluated) : 0).toFixed(2)}
• Caudal Dir.: ${(totalEvaluated ? (lobeSums.rightCaudal / totalEvaluated) : 0).toFixed(2)}
• Acessório: ${(totalEvaluated ? (lobeSums.accessory / totalEvaluated) : 0).toFixed(2)}
• Cranial Esq.: ${(totalEvaluated ? (lobeSums.leftCranial / totalEvaluated) : 0).toFixed(2)}
• Médio Esq.: ${(totalEvaluated ? (lobeSums.leftMiddle / totalEvaluated) : 0).toFixed(2)}
• Caudal Esq.: ${(totalEvaluated ? (lobeSums.leftCaudal / totalEvaluated) : 0).toFixed(2)}
------------------------------------------
Gerado via *Monitoria de Abate PWA*`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNewBatch = () => {
    setCurrentBatch(null);
    setActiveTab('setup');
  };

  const StatCard = ({ label, value, unit = '', infoKey, subText, subTextColor }: { label: string, value: string | number, unit?: string, infoKey?: keyof typeof METRICS_INFO, subText?: string, subTextColor?: string }) => (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-center items-center shadow-lg relative group">
      {infoKey && (
        <button 
          onClick={() => setInfoModalOpen(infoKey)}
          className="absolute top-2 right-2 text-slate-500 hover:text-sky-400 transition-colors p-2"
          aria-label={`Informações sobre ${label}`}
        >
          <Info className="w-4 h-4" />
        </button>
      )}
      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center h-8 flex items-center justify-center mb-1 max-w-[80%]">{label}</div>
      <div className="text-2xl font-black text-white italic">{value}<span className="text-sm font-normal text-slate-500 ml-1 not-italic">{unit}</span></div>
      {subText && (
        <div className={cn("text-xs font-bold uppercase tracking-widest mt-1", subTextColor || "text-slate-400")}>
          {subText}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center">
      {/* Print Specific CSS Override */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body, html {
            background: white !important;
            color: #0f172a !important;
          }
          #root > div {
            display: none !important;
          }
          #print-section {
            display: block !important;
            background: white !important;
            color: #0f172a !important;
            padding: 40px !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
          }
        }
      `}} />

      <div className="w-full max-w-4xl space-y-8 print:hidden">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase text-white flex items-center gap-3">
              <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
              Resumo do Lote
            </h1>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-widest mt-2 sm:ml-4">Lote: {currentBatch.batchId} • Granja: {currentBatch.farm}</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrintPDF}
              className="flex-1 sm:flex-none bg-sky-600 hover:bg-sky-500 text-white rounded-xl px-4 py-2.5 font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(14,165,233,0.3)]"
            >
              <Printer className="w-4 h-4" />
              GERAR PDF
            </button>
            <button
              onClick={handleShareText}
              className={`flex-1 sm:flex-none rounded-xl px-4 py-2.5 font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-colors ${copied ? 'bg-sky-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700'}`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  COPIADO!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  COMPARTILHAR
                </>
              )}
            </button>
            <button
              onClick={handlePrintPDF}
              className="flex-1 sm:flex-none bg-sky-600 hover:bg-sky-500 text-white rounded-xl px-4 py-2.5 font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(2,132,199,0.3)]"
            >
              <Printer className="w-4 h-4" />
              GERAR PDF
            </button>
            <button
              onClick={handleNewBatch}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-bold flex items-center justify-center transition-colors shrink-0"
              aria-label="Novo Lote"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mb-4 mt-8">
          <h2 className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-4 border-b border-slate-800 pb-2">Metodologia Principal (Piffer & Brito)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Pulmões Avaliados" value={`${totalEvaluated} / ${currentBatch.totalAnimals}`} />
            <StatCard 
              label="Index of Pneumonia (IP)" 
              value={avgIp} 
              infoKey="ip" 
              subText={getIPInterpretation(Number(avgIp))}
              subTextColor={getClassificationColor(getIPInterpretation(Number(avgIp)))}
            />
            <StatCard 
              label="Área Afetada Média" 
              value={avgAreaAffectedPiffer} 
              unit="%"
              subText="Baseado nos pesos Piffer & Brito"
            />
          </div>
        </div>

        <div className="mb-4 mt-8">
          <h2 className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-4 border-b border-slate-800 pb-2">Distribuição de Categorias IPP</h2>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            {[0, 1, 2, 3, 4, 5, 6].map(cat => (
              <div key={cat} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-500 font-bold tracking-widest mb-1">CAT {cat}</span>
                <span className="text-xl font-black text-sky-400">{ipCategoryCounts[cat]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4 mt-8">
          <h2 className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-4 border-b border-slate-800 pb-2">Outras Metodologias (Secundário)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard 
              label="Índice Médio (MADEC)" 
              value={avgScore} 
              infoKey="madec" 
              subText={getEPIndexClassification(Number(avgScore))}
              subTextColor={getClassificationColor(getEPIndexClassification(Number(avgScore)))}
            />
            <StatCard 
              label="Área Afetada (MADEC)" 
              value={avgAreaAffectedMadec} 
              unit="%"
              subText="Baseado nos pesos Madec"
            />
            <StatCard 
              label="SPES Médio" 
              value={avgSpes} 
              infoKey="spes" 
            />
            <StatCard 
              label="APP Index (APPI)" 
              value={avgAppi} 
              infoKey="appi" 
              subText={getAPIndexClassification(Number(avgAppi))}
              subTextColor={getClassificationColor(getAPIndexClassification(Number(avgAppi)))}
            />
          </div>
        </div>

        <div className="mb-4 mt-8">
          <h2 className="text-sm font-bold tracking-widest uppercase text-slate-400 mb-4 border-b border-slate-800 pb-2">Prevalência</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Prev. Pneumonia" value={prevPneumonia} unit="%" infoKey="pneumonia" />
            <StatCard label="Prev. Cicatrizes" value={prevScar} unit="%" infoKey="scar" />
            <StatCard label="Prev. Pleurisia" value={prevPleurisy} unit="%" infoKey="pleurisy" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Printer className="w-48 h-48 text-white" />
          </div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Impacto Econômico Estimado (Straw et al., 1989)</h3>
          <p className="text-sm text-slate-400 mb-6 max-w-2xl">
            Projeção baseada na correlação onde 10% de pulmão afetado reduz 37,4 g/dia no ganho de peso e piora a conversão alimentar em 4,5%.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Perda de GPD (g/dia)</span>
              <span className="text-3xl font-black text-red-400">-{lossGramsPerDay}</span>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Piora na CA (%)</span>
              <span className="text-3xl font-black text-amber-400">+{lossFcrPercent}%</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Média por Lobo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 md:gap-y-0">
            {Object.entries(lobeSums).map(([key, sum]) => {
              const label = Object.keys(LOBE_WEIGHTS).find(k => k === key); // mapping is direct
              const avg = totalEvaluated ? (sum / totalEvaluated).toFixed(2) : '0';
              return (
                <div key={key} className="flex justify-between items-center text-sm py-3 border-b border-slate-800 last:border-0 md:[&:nth-last-child(2)]:border-0 md:[&:nth-last-child(1)]:border-0">
                  <span className="text-slate-400 capitalize font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="font-mono text-sky-400 font-bold">{avg}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* PRINT LAYOUT SECTION (Hidden normally, visible in @media print) */}
      <div id="print-section" className="hidden">
        <div className="border-b-4 border-slate-900 pb-4 mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Relatório de Monitoria de Abate</h1>
          <p className="text-xs font-mono uppercase tracking-widest text-slate-500">Madec Adaptado & SPES (Pleurisia) • Pulmão de Suínos</p>
        </div>
        
        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm mb-8 border border-slate-300 p-5 rounded-2xl bg-slate-50">
          <div>
            <span className="text-slate-500 font-bold block uppercase text-[10px] tracking-wider">Granja</span>
            <span className="font-black text-slate-900 text-lg">{currentBatch.farm}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block uppercase text-[10px] tracking-wider">Identificação do Lote</span>
            <span className="font-black text-slate-900 text-lg">{currentBatch.batchId}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block uppercase text-[10px] tracking-wider">Frigorífico</span>
            <span className="font-black text-slate-900 text-lg">{currentBatch.abattoir}</span>
          </div>
          <div>
            <span className="text-slate-500 font-bold block uppercase text-[10px] tracking-wider">Data de Coleta</span>
            <span className="font-black text-slate-900 text-lg">{new Date(currentBatch.date).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4 border-b-2 border-slate-200 pb-2">Métricas Consolidadas</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="border border-slate-300 p-4 rounded-xl bg-slate-50">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Pulmões Avaliados</span>
              <span className="text-xl font-black text-slate-950 mt-1 block">{totalEvaluated} / {currentBatch.totalAnimals}</span>
            </div>
            <div className="border border-slate-300 p-4 rounded-xl bg-slate-50">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Index of Pneumonia (IP)</span>
              <span className="text-xl font-black text-slate-950 mt-1 block">{avgIp}</span>
            </div>
            <div className="border border-slate-300 p-4 rounded-xl bg-slate-50">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Índice Médio (MADEC)</span>
              <span className="text-xl font-black text-slate-950 mt-1 block">{avgScore}</span>
            </div>
            <div className="border border-slate-300 p-4 rounded-xl bg-slate-50">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Índice SPES Médio</span>
              <span className="text-xl font-black text-slate-950 mt-1 block">{avgSpes}</span>
            </div>
            <div className="border border-slate-300 p-4 rounded-xl bg-slate-50">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">APP Index (APPI)</span>
              <span className="text-xl font-black text-slate-950 mt-1 block">{avgAppi}</span>
            </div>
            <div className="border border-slate-300 p-4 rounded-xl bg-slate-50">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Prevalência Pneumonia</span>
              <span className="text-xl font-black text-slate-950 mt-1 block">{prevPneumonia}%</span>
            </div>
            <div className="border border-slate-300 p-4 rounded-xl bg-slate-50">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Prevalência Cicatriz</span>
              <span className="text-xl font-black text-slate-950 mt-1 block">{prevScar}%</span>
            </div>
            <div className="border border-slate-300 p-4 rounded-xl bg-slate-50">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Prevalência Pleurisia</span>
              <span className="text-xl font-black text-slate-950 mt-1 block">{prevPleurisy}%</span>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4 border-b-2 border-slate-200 pb-2">Impacto Econômico (Straw et al., 1989)</h2>
          <div className="flex gap-8 mb-8">
            <div className="flex-1 border border-slate-300 p-4 rounded-xl bg-slate-50">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Perda de GPD (g/dia)</span>
              <span className="text-xl font-black text-slate-950 mt-1 block">-{lossGramsPerDay}</span>
            </div>
            <div className="flex-1 border border-slate-300 p-4 rounded-xl bg-slate-50">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Piora na CA (%)</span>
              <span className="text-xl font-black text-slate-950 mt-1 block">+{lossFcrPercent}%</span>
            </div>
          </div>

          <h2 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4 border-b-2 border-slate-200 pb-2">Média Detalhada por Lobo Pulmonar</h2>
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 uppercase tracking-wider font-black">
                  <th className="p-3">Lobo Pulmonar</th>
                  <th className="p-3 text-right">Peso Operacional (MADEC)</th>
                  <th className="p-3 text-right">Média de Lesões Observadas (0-4)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                <tr>
                  <td className="p-3 font-semibold">Cranial Direito</td>
                  <td className="p-3 text-right font-mono text-slate-500">10%</td>
                  <td className="p-3 text-right font-mono font-black text-slate-950">{(totalEvaluated ? (lobeSums.rightCranial / totalEvaluated) : 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Médio Direito</td>
                  <td className="p-3 text-right font-mono text-slate-500">10%</td>
                  <td className="p-3 text-right font-mono font-black text-slate-950">{(totalEvaluated ? (lobeSums.rightMiddle / totalEvaluated) : 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Caudal Direito</td>
                  <td className="p-3 text-right font-mono text-slate-500">25%</td>
                  <td className="p-3 text-right font-mono font-black text-slate-950">{(totalEvaluated ? (lobeSums.rightCaudal / totalEvaluated) : 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Acessório</td>
                  <td className="p-3 text-right font-mono text-slate-500">10%</td>
                  <td className="p-3 text-right font-mono font-black text-slate-950">{(totalEvaluated ? (lobeSums.accessory / totalEvaluated) : 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Cranial Esquerdo</td>
                  <td className="p-3 text-right font-mono text-slate-500">10%</td>
                  <td className="p-3 text-right font-mono font-black text-slate-950">{(totalEvaluated ? (lobeSums.leftCranial / totalEvaluated) : 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Médio Esquerdo</td>
                  <td className="p-3 text-right font-mono text-slate-500">10%</td>
                  <td className="p-3 text-right font-mono font-black text-slate-950">{(totalEvaluated ? (lobeSums.leftMiddle / totalEvaluated) : 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">Caudal Esquerdo</td>
                  <td className="p-3 text-right font-mono text-slate-500">25%</td>
                  <td className="p-3 text-right font-mono font-black text-slate-950">{(totalEvaluated ? (lobeSums.leftCaudal / totalEvaluated) : 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>



        <div className="mt-20 flex justify-between text-[10px] text-slate-500 uppercase font-mono border-t border-slate-300 pt-8">
          <div>Relatório Oficial • Gerado em {new Date().toLocaleString('pt-BR')}</div>
          <div>Assinatura do Técnico Responsável: ___________________________</div>
        </div>
      </div>

      {/* Info Modal */}
      {infoModalOpen && METRICS_INFO[infoModalOpen as keyof typeof METRICS_INFO] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-800">
              <h3 className="font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-400" />
                {METRICS_INFO[infoModalOpen as keyof typeof METRICS_INFO].title}
              </h3>
              <button 
                onClick={() => setInfoModalOpen(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Intervalo</h4>
                <div className="text-sky-400 font-mono font-bold bg-sky-950/30 inline-block px-3 py-1 rounded-lg border border-sky-900/50">
                  {METRICS_INFO[infoModalOpen as keyof typeof METRICS_INFO].range}
                </div>
              </div>
              
              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1.5">O que é</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {METRICS_INFO[infoModalOpen as keyof typeof METRICS_INFO].description}
                </p>
              </div>

              <div>
                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1.5">Significado Clínico</h4>
                <p className="text-sm text-slate-400 leading-relaxed border-l-2 border-slate-800 pl-3">
                  {METRICS_INFO[infoModalOpen as keyof typeof METRICS_INFO].clinical}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
