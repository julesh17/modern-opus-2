import React, { useState, useMemo } from 'react';
import { parseExcelEngine, generateICS } from './utils/parser'; // Assure-toi de créer le dossier utils
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import frLocale from '@fullcalendar/core/locales/fr';
import { Upload, Calendar, Mail, Download, PieChart, GraduationCap, ChevronRight } from 'lucide-react';
import { saveAs } from 'file-saver';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedPromo, setSelectedPromo] = useState('all');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const parsedEvents = await parseExcelEngine(file);
      setEvents(parsedEvents);
    } catch (err) {
      alert("Erreur lecture fichier: " + err.message);
    }
    setLoading(false);
  };

  const filteredEvents = useMemo(() => {
    if (selectedPromo === 'all') return events;
    return events.filter(e => e.promo === selectedPromo);
  }, [events, selectedPromo]);

  const promos = [...new Set(events.map(e => e.promo))];

  // --- Composants UI ---
  
  const StatCard = ({ label, value }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:scale-105 transition-transform duration-200">
      <div className="text-3xl font-extrabold text-cesi-black mb-1">{value}</div>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-apple-gray text-cesi-black font-sans pb-20">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-3 h-8 bg-cesi-yellow rounded-sm"></div>
             <h1 className="text-2xl font-bold tracking-tight">Modern Opus</h1>
          </div>
          {events.length > 0 && (
            <div className="flex gap-2">
               <select 
                 className="bg-gray-100 border-none rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-cesi-yellow outline-none"
                 value={selectedPromo}
                 onChange={(e) => setSelectedPromo(e.target.value)}
               >
                 <option value="all">Toutes Promos</option>
                 {promos.map(p => <option key={p} value={p}>{p}</option>)}
               </select>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Upload State */}
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
            <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100 text-center max-w-lg w-full">
              <div className="w-16 h-16 bg-cesi-yellow/20 text-cesi-black rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload size={32} />
              </div>
              <h2 className="text-3xl font-bold mb-3">Déposez votre planning</h2>
              <p className="text-gray-500 mb-8">Format Excel (.xlsx). Traitement local et sécurisé.</p>
              
              <label className="cursor-pointer group relative overflow-hidden bg-cesi-black text-white px-8 py-4 rounded-xl font-semibold transition-all hover:bg-cesi-yellow hover:text-black hover:scale-105 inline-block">
                <span>{loading ? "Analyse en cours..." : "Choisir un fichier"}</span>
                <input type="file" accept=".xlsx" className="hidden" onChange={handleFileUpload} disabled={loading} />
              </label>
            </div>
          </div>
        ) : (
          /* Dashboard State */
          <div className="space-y-8 animate-fade-in-up">
            
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Cours Planifiés" value={events.length} />
              <StatCard label="Promos" value={promos.length} />
              <StatCard label="Enseignants" value={[...new Set(events.flatMap(e => e.teachers))].length} />
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-fit mx-auto">
              {[
                { id: 'calendar', label: 'Calendrier', icon: Calendar },
                { id: 'mail', label: 'Générateur Mails', icon: Mail },
                { id: 'export', label: 'Exports', icon: Download },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab.id 
                    ? 'bg-cesi-black text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 min-h-[500px]">
              
              {/* TAB: CALENDRIER */}
              {activeTab === 'calendar' && (
                <div className="h-[700px]">
                   <FullCalendar
                     plugins={[dayGridPlugin, timeGridPlugin]}
                     initialView="timeGridWeek"
                     locale={frLocale}
                     headerToolbar={{
                       left: 'prev,next today',
                       center: 'title',
                       right: 'dayGridMonth,timeGridWeek'
                     }}
                     events={filteredEvents.map(e => ({
                       title: `${e.title} (${e.teachers[0] || '?'})`,
                       start: e.start,
                       end: e.end,
                       backgroundColor: '#f7e34f',
                       borderColor: '#f7e34f',
                       textColor: '#000000'
                     }))}
                     slotMinTime="07:30:00"
                     slotMaxTime="19:30:00"
                     allDaySlot={false}
                     height="100%"
                   />
                </div>
              )}

              {/* TAB: MAILS (Simplified Logic for Demo) */}
              {activeTab === 'mail' && (
                <div className="max-w-2xl mx-auto">
                   <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Mail className="text-cesi-yellow" /> Générateur de mail</h3>
                   <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
                     <p className="text-sm text-gray-500 mb-2">Sélectionner un enseignant pour générer le récapitulatif.</p>
                     <select className="w-full p-2 border rounded-md" id="teacher-select">
                        <option>Choisir un enseignant...</option>
                        {[...new Set(events.flatMap(e => e.teachers))].sort().map(t => (
                          <option key={t}>{t}</option>
                        ))}
                     </select>
                   </div>
                   <textarea className="w-full h-64 p-4 border rounded-xl font-mono text-sm bg-gray-50" placeholder="Le texte du mail apparaîtra ici..." readOnly></textarea>
                </div>
              )}

              {/* TAB: EXPORTS */}
              {activeTab === 'export' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 border rounded-2xl bg-gray-50 hover:bg-white transition-colors border-dashed border-gray-300">
                    <h4 className="font-bold text-lg mb-2">Export Global (.ics)</h4>
                    <p className="text-sm text-gray-500 mb-4">Télécharger tout le calendrier pour l'importer dans Outlook/Apple Calendar.</p>
                    <button 
                      onClick={() => {
                        const blob = new Blob([generateICS(filteredEvents)], {type: "text/calendar;charset=utf-8"});
                        saveAs(blob, "planning_cesi.ics");
                      }}
                      className="bg-cesi-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cesi-yellow hover:text-black transition"
                    >
                      Télécharger ICS
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;