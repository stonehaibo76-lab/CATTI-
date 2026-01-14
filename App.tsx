
import React, { useState } from 'react';
import { AppView } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PlanView from './components/PlanView';
import TranslationLab from './components/TranslationLab';
import VocabularyVault from './components/VocabularyVault';
import AITutor from './components/AITutor';
import WeeklyTest from './components/WeeklyTest';
import TranslationLibrary from './components/TranslationLibrary';
import AttendanceCalendar from './components/AttendanceCalendar';
import MistakeNotebook from './components/MistakeNotebook';
import CollocationTrainer from './components/CollocationTrainer';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onViewChange={setCurrentView} />;
      case AppView.STUDY_PLAN:
        return <PlanView />;
      case AppView.TRANSLATION_LAB:
        return <TranslationLab />;
      case AppView.VOCABULARY:
        return <VocabularyVault />;
      case AppView.AI_TUTOR:
        return <AITutor />;
      case AppView.WEEKLY_TEST:
        return <WeeklyTest />;
      case AppView.SENTENCE_LIBRARY:
        return <TranslationLibrary />;
      case AppView.ATTENDANCE:
        return <AttendanceCalendar />;
      case AppView.MISTAKE_NOTEBOOK:
        return <MistakeNotebook />;
      case AppView.COLLOCATIONS:
        return <CollocationTrainer />;
      default:
        return <Dashboard onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;
