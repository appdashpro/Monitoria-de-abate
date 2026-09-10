/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAppStore } from './store';
import { SetupTab } from './components/SetupTab';
import { CollectionTab } from './components/CollectionTab';
import { SummaryTab } from './components/SummaryTab';
import { HistoryTab } from './components/HistoryTab';
import { DashboardTab } from './components/DashboardTab';
import { ScienceTab } from './components/ScienceTab';
import { Activity, ClipboardList, Settings, List, LayoutDashboard, BookOpen, LogOut } from 'lucide-react';
import { cn } from './utils';
import { useAuth } from './components/AuthContext';

export default function App() {
  const { activeTab, setActiveTab, currentBatch } = useAppStore();
  const { user, loading, signIn, logout } = useAuth();

  const tabs = [
    { id: 'setup', label: 'Setup', icon: Settings, disabled: false },
    { id: 'collection', label: 'Coleta', icon: Activity, disabled: false },
    { id: 'summary', label: 'Resumo', icon: ClipboardList, disabled: false },
    { id: 'history', label: 'Histórico', icon: List, disabled: false },
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard, disabled: false },
    { id: 'science', label: 'Ciência', icon: BookOpen, disabled: false },
  ] as const;

  if (loading) {
     return <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-400">Carregando...</div>;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-slate-50 font-sans">
        <div className="flex flex-col items-center bg-slate-900 p-8 rounded-2xl shadow-2xl border border-slate-800 max-w-sm w-full">
           <div className="w-16 h-16 bg-sky-500 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(14,165,233,0.4)] mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight uppercase text-white leading-tight mb-2">Monitoria de Abate</h1>
            <p className="text-sm text-slate-400 text-center mb-8">Faça login para gerenciar e persistir seus dados de abate.</p>
            
            <button 
              onClick={signIn}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              Entrar com o Google
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 text-slate-50 font-sans">
      {/* Top Header */}
      {activeTab !== 'collection' && (
        <header className="bg-slate-900 border-b border-slate-800 shadow-xl shrink-0 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(14,165,233,0.3)]">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight uppercase text-white leading-tight">Monitoria de Abate</h1>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-0.5">V.3.1.2 • Online</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {currentBatch && (
                <div className="hidden sm:block text-right border-r border-slate-800 pr-4">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Lote Atual</div>
                  <div className="text-sm font-mono text-sky-400 font-bold">{(currentBatch.farm || 'GRN').substring(0,3).toUpperCase()}-{currentBatch.batchId || '000'}</div>
                </div>
              )}
              <button onClick={logout} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors" title="Sair">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Navigation Bar */}
      <nav className="bg-slate-900 border-b border-slate-800 shrink-0 p-2 sm:px-4 z-10">
        <div className="max-w-7xl mx-auto flex">
          <div className="flex w-full sm:w-auto gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                disabled={tab.disabled}
                onClick={() => setActiveTab(tab.id as 'setup' | 'collection' | 'summary' | 'history' | 'dashboard' | 'science')}
                className={cn(
                  'flex items-center justify-center min-w-max flex-1 sm:flex-none py-2 px-4 gap-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap uppercase tracking-wider',
                  activeTab === tab.id
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/20'
                    : 'text-slate-400 hover:bg-slate-900',
                  tab.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                )}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 max-w-7xl w-full mx-auto bg-slate-950 flex flex-col">
          {activeTab === 'setup' && <SetupTab />}
          {activeTab === 'collection' && <CollectionTab />}
          {activeTab === 'summary' && <SummaryTab />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'science' && <ScienceTab />}
        </div>
      </main>
    </div>
  );
}

