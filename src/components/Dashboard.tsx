import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { ScheduleGrid, ScheduleRow } from './ScheduleGrid';
import { Notes } from './Notes';
import { CalendarEvents } from './CalendarEvents';
import { WeatherWidget } from './WeatherWidget';
import { LogOut, User, CalendarDays, School } from 'lucide-react';

interface DashboardProps {
  accessToken: string | null;
}

const manuelScheduleData: Omit<ScheduleRow, 'id' | 'userId' | 'order'>[] = [
  { type: 'header', time: 'Mañana' },
  { type: 'row', time: '09:50-10:30', monday: '3°BTP (Javier)', tuesday: '', wednesday: '4°BHC (Reinaldo)', thursday: '', friday: '' },
  { type: 'row', time: '10:30-11:20', monday: '', tuesday: '', wednesday: '4°BHC (Reinaldo)', thursday: '3° HC (Reinaldo)', friday: '' },
  { type: 'row', time: '11:30-12:15', monday: '', tuesday: '3°C TP (Javier)', wednesday: '4B TP (ANDRÉS)', thursday: '', friday: '' },
  { type: 'row', time: '12:15-13:00', monday: '3A TP (Javier)', tuesday: '', wednesday: '4B TP (ANDRÉS)', thursday: '4°A TP (Javier)', friday: '' },
  { type: 'header', time: 'Tarde' },
  { type: 'row', time: '14:40-15:15', monday: '4°AHC (Reinaldo)', tuesday: '4C TP (Andrés)', wednesday: '', thursday: '', friday: '' },
  { type: 'row', time: '15:15-16:00', monday: '4°AHC (Reinaldo)', tuesday: '', wednesday: '', thursday: '', friday: '' },
  { type: 'row', time: '15:15-17:00', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '' },
  { type: 'row', time: '17:00-17:45', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '' },
  { type: 'row', time: '15:30+', monday: 'Libre', tuesday: 'Libre', wednesday: 'Libre', thursday: 'Libre', friday: 'Libre' },
];

const palomarScheduleData: Omit<ScheduleRow, 'id' | 'userId' | 'order'>[] = [
  { type: 'header', time: 'Mañana' },
  { type: 'row', time: '8:00-8:45', monday: '', tuesday: '', wednesday: 'CUARTO B (E. Huerta)', thursday: '', friday: '' },
  { type: 'row', time: '8:45-9:30', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '' },
  { type: 'row', time: '9:50-10:30', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '' },
  { type: 'row', time: '10:30-11:20', monday: '', tuesday: 'TERCERO C (J. Alquinta)', wednesday: '', thursday: 'CUARTO D (F. Romo)', friday: '' },
  { type: 'row', time: '11:30-12:15', monday: 'TERCERO B (E. Huerta)', tuesday: '', wednesday: '', thursday: '', friday: '' },
  { type: 'row', time: '12:15-13:00', monday: 'TERCERO A (J. Alquinta)', tuesday: '', wednesday: '', thursday: 'CUARTO C (E. Huerta)', friday: '' },
  { type: 'header', time: 'LUNCH' },
  { type: 'row', time: '13:45-14:30', monday: '', tuesday: '', wednesday: 'TERCERO E (E. Huerta)', thursday: 'CUARTO A (J. Alquinta)', friday: '' },
  { type: 'row', time: '14:30-15:15', monday: 'CUARTO F (F. Romo)', tuesday: '', wednesday: 'CUARTO E (J. Alquinta)', thursday: '', friday: '' },
  { type: 'row', time: '15:30-16:15', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '' },
  { type: 'row', time: '16:15-17:00', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '' },
];

export function Dashboard({ accessToken }: DashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeSchool, setActiveSchool] = useState<'manuel' | 'palomar'>('manuel');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const user = auth.currentUser;

  return (
    <div className="min-h-screen bg-[#F8F9FE] flex flex-col">
      {/* Header */}
      <header className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <CalendarDays size={26} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bitácora del Asesor PACE-UDA</h1>
                <p className="text-sm font-medium text-slate-500 capitalize">
                  {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 text-sm font-medium text-slate-700 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <User size={20} />
                )}
                <span>{user?.displayName || user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={22} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
          
          {/* Left Column: Schedule (Takes up 2 columns on large screens) */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center gap-2 mb-6 p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100 inline-flex">
                <button 
                  onClick={() => setActiveSchool('manuel')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                    activeSchool === 'manuel' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                      : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <School size={16} />
                  Liceo Manuel Magalhaes
                </button>
                <button 
                  onClick={() => setActiveSchool('palomar')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                    activeSchool === 'palomar' 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                      : 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <School size={16} />
                  Liceo El Palomar
                </button>
              </div>

              {activeSchool === 'manuel' ? (
                <ScheduleGrid 
                  key="manuel"
                  title="Horario - Manuel Magalhaes" 
                  collectionName="schedule" 
                  defaultData={manuelScheduleData} 
                />
              ) : (
                <ScheduleGrid 
                  key="palomar"
                  title="Horario - El Palomar" 
                  collectionName="schedule_palomar" 
                  defaultData={palomarScheduleData} 
                />
              )}
            </section>
            
            <section className="h-[400px]">
              <Notes />
            </section>
          </div>

          {/* Right Column: Weather & Calendar Events */}
          <div className="lg:col-span-1 flex flex-col gap-8 h-[832px]">
            <WeatherWidget />
            <div className="flex-1 min-h-0">
              <CalendarEvents accessToken={accessToken} />
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
