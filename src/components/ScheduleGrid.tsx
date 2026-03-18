import { useState, useEffect } from 'react';
import { Calendar, Edit2, Save, X, Plus, Trash2, Loader2 } from 'lucide-react';
import { collection, query, onSnapshot, doc, writeBatch, getDocs, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export interface ScheduleRow {
  id?: string;
  type: 'header' | 'row';
  time: string;
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  order: number;
  userId?: string;
}

interface ScheduleGridProps {
  title: string;
  collectionName: string;
  defaultData: Omit<ScheduleRow, 'id' | 'userId' | 'order'>[];
}

export function ScheduleGrid({ title, collectionName, defaultData }: ScheduleGridProps) {
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ScheduleRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/${collectionName}`),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty && !isEditing) {
        // Initialize with default data if empty
        try {
          const batch = writeBatch(db);
          defaultData.forEach((item, index) => {
            const newDocRef = doc(collection(db, `users/${auth.currentUser!.uid}/${collectionName}`));
            batch.set(newDocRef, {
              ...item,
              userId: auth.currentUser!.uid,
              order: index
            });
          });
          await batch.commit();
        } catch (error) {
          console.error(`Error initializing schedule for ${collectionName}:`, error);
        }
      } else {
        const scheduleData: ScheduleRow[] = [];
        snapshot.forEach((doc) => {
          scheduleData.push({ id: doc.id, ...doc.data() } as ScheduleRow);
        });
        setSchedule(scheduleData);
        if (!isEditing) {
          setEditData(scheduleData);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching schedule for ${collectionName}:`, error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isEditing, collectionName, defaultData]);

  const handleEditClick = () => {
    setEditData([...schedule]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditData([...schedule]);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      const scheduleRef = collection(db, `users/${auth.currentUser.uid}/${collectionName}`);
      
      // Get current docs to find deletions
      const currentDocs = await getDocs(scheduleRef);
      const currentIds = currentDocs.docs.map(d => d.id);
      const newIds = editData.map(d => d.id).filter(Boolean) as string[];
      
      // Delete removed rows
      currentIds.forEach(id => {
        if (!newIds.includes(id)) {
          batch.delete(doc(scheduleRef, id));
        }
      });

      // Add or update rows
      editData.forEach((item, index) => {
        const rowData = {
          userId: auth.currentUser!.uid,
          type: item.type,
          time: item.time || '',
          monday: item.monday || '',
          tuesday: item.tuesday || '',
          wednesday: item.wednesday || '',
          thursday: item.thursday || '',
          friday: item.friday || '',
          order: index
        };

        if (item.id) {
          batch.update(doc(scheduleRef, item.id), rowData);
        } else {
          batch.set(doc(scheduleRef), rowData);
        }
      });

      await batch.commit();
      setIsEditing(false);
    } catch (error) {
      console.error(`Error saving schedule for ${collectionName}:`, error);
      alert("Error al guardar el horario.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddRow = (type: 'header' | 'row') => {
    setEditData([
      ...editData,
      { type, time: '', monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', order: editData.length }
    ]);
  };

  const handleDeleteRow = (index: number) => {
    const newData = [...editData];
    newData.splice(index, 1);
    setEditData(newData);
  };

  const handleCellChange = (index: number, field: keyof ScheduleRow, value: string) => {
    const newData = [...editData];
    newData[index] = { ...newData[index], [field]: value };
    setEditData(newData);
  };

  const renderCell = (content: string | undefined) => {
    if (!content) return <span className="text-slate-300">-</span>;
    if (content.toLowerCase() === 'libre') {
      return (
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
          {content}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 text-center">
        {content}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border-0 overflow-hidden">
      <div className="p-6 md:p-8 pb-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        </div>
        <div>
          {!isEditing ? (
            <button
              onClick={handleEditClick}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl font-semibold transition-colors text-sm"
            >
              <Edit2 size={16} />
              Editar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-semibold transition-colors text-sm disabled:opacity-50"
              >
                <X size={16} />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-semibold transition-colors text-sm shadow-md shadow-indigo-200 disabled:opacity-50"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Guardar
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto px-6 md:px-8 pb-8">
        {loading ? (
          <div className="flex justify-center items-center py-12 text-indigo-400">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="text-xs text-slate-400 uppercase bg-slate-50/50 rounded-xl">
              <tr>
                <th scope="col" className="px-4 py-4 font-bold w-[12%] rounded-l-xl">Hora</th>
                <th scope="col" className="px-4 py-4 font-bold w-[17.6%]">Lunes</th>
                <th scope="col" className="px-4 py-4 font-bold w-[17.6%]">Martes</th>
                <th scope="col" className="px-4 py-4 font-bold w-[17.6%]">Miércoles</th>
                <th scope="col" className="px-4 py-4 font-bold w-[17.6%]">Jueves</th>
                <th scope="col" className={`px-4 py-4 font-bold w-[17.6%] ${!isEditing ? 'rounded-r-xl' : ''}`}>Viernes</th>
                {isEditing && <th scope="col" className="px-4 py-4 font-bold w-[5%] rounded-r-xl text-center">Acción</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(isEditing ? editData : schedule).map((row, idx) => {
                if (row.type === 'header') {
                  return (
                    <tr key={idx}>
                      <td colSpan={isEditing ? 6 : 6} className="px-4 py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={row.time}
                            onChange={(e) => handleCellChange(idx, 'time', e.target.value)}
                            placeholder="Título de sección (ej. Mañana)"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          />
                        ) : (
                          <span className="font-bold text-slate-800 text-base">{row.time}</span>
                        )}
                      </td>
                      {isEditing && (
                        <td className="px-4 py-4 text-center">
                          <button onClick={() => handleDeleteRow(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                }

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-3 font-semibold text-slate-500 whitespace-nowrap group-hover:text-indigo-600 transition-colors">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.time}
                          onChange={(e) => handleCellChange(idx, 'time', e.target.value)}
                          placeholder="00:00-00:00"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                      ) : (
                        row.time
                      )}
                    </td>
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => (
                      <td key={day} className="px-4 py-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={row[day as keyof ScheduleRow] as string || ''}
                            onChange={(e) => handleCellChange(idx, day as keyof ScheduleRow, e.target.value)}
                            placeholder="-"
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                          />
                        ) : (
                          renderCell(row[day as keyof ScheduleRow] as string)
                        )}
                      </td>
                    ))}
                    {isEditing && (
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleDeleteRow(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        
        {isEditing && (
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => handleAddRow('row')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium transition-colors text-sm"
            >
              <Plus size={16} />
              Agregar Fila
            </button>
            <button
              onClick={() => handleAddRow('header')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl font-medium transition-colors text-sm"
            >
              <Plus size={16} />
              Agregar Encabezado
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
