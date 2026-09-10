import { BookOpen, ExternalLink, Activity, Info } from 'lucide-react';

export function ScienceTab() {
  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden md:p-6 p-4">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full bg-slate-900 md:rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Metodologia Científica</h2>
          </div>
          <p className="text-slate-400 text-sm">
            Fundamentação teórica, cálculos e referências bibliográficas utilizadas pelos índices do aplicativo.
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          
          {/* Índice MADEC */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Activity className="w-5 h-5 text-sky-400" />
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Índice MADEC (Pneumonia Enzoótica)</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              O sistema de escore de <strong>Madec & Kobisch (1982)</strong> é amplamente adotado para avaliar lesões macroscópicas de consolidação crânio-ventral associadas à <em>Mycoplasma hyopneumoniae</em>. O pulmão é dividido em 7 lobos (Cranial Direito, Médio Direito, Caudal Direito, Acessório, Cranial Esquerdo, Médio Esquerdo e Caudal Esquerdo).
            </p>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Como é calculado no App:</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                <li>Cada lobo recebe uma nota de <strong>0 a 4</strong> (sendo 0 sem lesão e 4 mais de 75% ou 100% de lesão no lobo).</li>
                <li><strong>Soma de Pontos (0 a 28):</strong> Apenas a soma aritmética de todos os lobos do animal.</li>
                <li><strong>Índice Médio (EP Index):</strong> Somatória de todos os pontos do lote dividida pelo número total de pulmões avaliados.</li>
              </ul>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 mt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Classificação do Lote (EP Index):</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                <li><strong className="text-emerald-400">Leve:</strong> &le; 1,49</li>
                <li><strong className="text-amber-400">Intermediário:</strong> 1,50 a 2,40</li>
                <li><strong className="text-red-400">Grave:</strong> &gt; 2,40</li>
              </ul>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Referência Atualizada (2023):</h4>
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                A avaliação no abatedouro é uma ferramenta valiosa para monitorar a saúde respiratória do rebanho, permitindo não só confirmar e quantificar os problemas respiratórios, mas também avaliar o resultado das estratégias de intervenção aplicadas a campo (Sibila et al., 2023).
              </p>
              <a href="https://www.pig333.com/articles/evaluation-of-pneumonia-lesions-at-abattoir-with-lung-score-assessment_11438/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Sibila M, et al. Pulmonary lesions at the slaughterhouse: how to evaluate them (Pig333, 2023)
              </a>
              <br/>
              <a href="https://pubmed.ncbi.nlm.nih.gov/36726112/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors mt-2">
                <ExternalLink className="w-3.5 h-3.5" /> Maes D, Sibila M, et al. Review on the methodology to assess respiratory tract lesions... (Vet Res, 2023)
              </a>
            </div>
            
            <a href="https://pubmed.ncbi.nlm.nih.gov/26774274/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors mt-4">
              <ExternalLink className="w-3.5 h-3.5" /> Garcia-Morante B, et al. Assessment of Mycoplasma hyopneumoniae-induced Pneumonia... (2016)
            </a>
          </section>

          {/* IP Index */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Activity className="w-5 h-5 text-sky-400" />
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Metodologia Piffer & Brito (Índice de Pneumonia e Área Afetada)</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              O modelo estabelecido por <strong>Piffer e Brito (1981)</strong> calcula a área pulmonar afetada introduzindo pesos anatômicos para cada lobo pulmonar, estimando quanto do volume total está consolidado. A partir dessa porcentagem, estabelece-se o estado sanitário da população através do Índice de Pneumonia (IP).
            </p>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pesos Volumétricos (%):</h4>
              <ul className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                <li>Apical Direito (AD): 11%</li>
                <li>Cardíaco Direito (CD): 11%</li>
                <li>Diafragmático Direito (DD): 34%</li>
                <li>Intermediário (Acessório): 5%</li>
                <li>Apical Esquerdo (AE): 6%</li>
                <li>Cardíaco Esquerdo (CE): 6%</li>
                <li>Diafragmático Esquerdo (DE): 27%</li>
              </ul>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Classificação do Lote (IP):</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                <li><strong className="text-emerald-400">0 a 0,55:</strong> Aceitável (Ideal) - População com pneumonia controlada.</li>
                <li><strong className="text-amber-400">0,56 a 0,65:</strong> Aceitável (Margem de segurança) - O índice deveria ser no máximo 0,55, podendo chegar até 0,65 devido à margem de segurança.</li>
                <li><strong className="text-orange-500">0,66 a 0,89:</strong> Atenção - Próximo ao limite da situação grave, devendo ser dada atenção à granja.</li>
                <li><strong className="text-red-400">&gt; 0,89:</strong> Grave - Situação complicada de saúde e incidência.</li>
              </ul>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 mt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Impacto Econômico (Straw et al., 1989):</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                Estima-se que para cada <strong>10% de pulmão afetado</strong>, o animal sofre uma perda no ganho de peso diário de <strong>37,4 g/dia</strong> e piora a conversão alimentar em <strong>4,5%</strong>.
              </p>
            </div>
          </section>

          {/* SPES */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Activity className="w-5 h-5 text-sky-400" />
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Índice SPES (Pleurisia)</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              O <strong>Slaughterhouse Pleurisy Evaluation System (SPES)</strong> foi descrito por <em>Dottori et al. (2007)</em> para mensurar pleurisia de abate, correlacionada a desafios respiratórios como <em>Actinobacillus pleuropneumoniae (APP)</em>.
            </p>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Escala e Cálculo:</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                <li><strong>0:</strong> Ausência de lesões pleurais.</li>
                <li><strong>1:</strong> Aderências pleurais restritas aos lobos crânio-ventrais (frequentemente associadas com lesões resolvidas de Mycoplasma).</li>
                <li><strong>2:</strong> Aderências focais localizadas nos lobos diafragmáticos/caudais (APP).</li>
                <li><strong>3:</strong> Aderências bilaterais extensas (ou pleurisia lobar unilateral).</li>
                <li><strong>4:</strong> Aderências severas bilaterais limitando severamente a carcaça.</li>
                <li><strong>SPES Médio:</strong> Média aritmética das notas SPES (0 a 4) de todos os animais avaliados.</li>
                <li><strong>APP Index (APPI):</strong> Média aritmética considerando apenas as notas 2, 3 e 4, associadas ao <em>Actinobacillus pleuropneumoniae</em>.</li>
              </ul>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 mt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Classificação do Lote (APP Index):</h4>
              <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                <li><strong className="text-emerald-400">Leve:</strong> &lt; 0,30</li>
                <li><strong className="text-amber-400">Intermediário:</strong> 0,30 a 0,60</li>
                <li><strong className="text-red-400">Grave:</strong> &gt; 0,60</li>
              </ul>
            </div>
            <a href="https://pubmed.ncbi.nlm.nih.gov/22182431/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors mt-4">
              <ExternalLink className="w-3.5 h-3.5" /> Merialdi G, Dottori M, et al. Survey of pleuritis and pulmonary lesions in pigs at abattoir... (2012)
            </a>
          </section>

          {/* Área Afetada MADEC/Halbur */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <Activity className="w-5 h-5 text-sky-400" />
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Metodologia Secundária (Área Pulmonar Halbur)</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              O modelo estabelecido por <strong>Halbur et al. (1995)</strong> e adotado em avaliações de carcaça (Christensen et al., 1999) é utilizado neste app como um cálculo secundário de área pulmonar afetada.
            </p>
            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Pesos Volumétricos (Secundário):</h4>
              <ul className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                <li>Cranial Dir.: 10%</li>
                <li>Médio Dir.: 10%</li>
                <li>Caudal Dir.: 25%</li>
                <li>Acessório: 10%</li>
                <li>Cranial Esq.: 10%</li>
                <li>Médio Esq.: 10%</li>
                <li>Caudal Esq.: 25%</li>
              </ul>
              <p className="mt-3 text-xs text-slate-400">
                Cálculo: A nota 4 representa 100% de acometimento daquele lobo. Multiplica-se a porcentagem da nota pelo peso do lobo.
              </p>
            </div>
            <a href="https://pubmed.ncbi.nlm.nih.gov/8592800/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Halbur PG, et al. Comparison of the pathogenicity of two US PRRSV isolates... (1995)
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
