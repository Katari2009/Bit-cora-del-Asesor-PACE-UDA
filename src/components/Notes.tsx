import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { StickyNote, Plus, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: any;
}

export function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, `users/${auth.currentUser.uid}/notes`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData: Note[] = [];
      snapshot.forEach((doc) => {
        notesData.push({ id: doc.id, ...doc.data() } as Note);
      });
      setNotes(notesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching notes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !auth.currentUser) return;

    try {
      await addDoc(collection(db, `users/${auth.currentUser.uid}/notes`), {
        userId: auth.currentUser.uid,
        title: newTitle.trim(),
        content: newContent.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNewTitle('');
      setNewContent('');
      setIsAdding(false);
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Error al guardar la nota.");
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/notes`, id));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const gradients = [
    'bg-gradient-to-br from-pink-400 to-rose-500',
    'bg-gradient-to-br from-indigo-400 to-purple-500',
    'bg-gradient-to-br from-teal-400 to-emerald-500',
    'bg-gradient-to-br from-orange-400 to-amber-500',
  ];

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border-0 overflow-hidden flex flex-col h-full">
      <div className="p-6 md:p-8 pb-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900">Mis Notas</h2>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-all shadow-md shadow-indigo-200"
        >
          <Plus size={20} className={isAdding ? "rotate-45" : ""} />
        </button>
      </div>

      <div className="p-6 md:p-8 pt-0 flex-1 overflow-y-auto">
        {isAdding && (
          <form onSubmit={handleAddNote} className="mb-6 bg-white p-5 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50">
            <input
              type="text"
              placeholder="Título de la nota"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full mb-4 px-4 py-3 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-semibold text-slate-800 placeholder:text-slate-400"
              required
            />
            <textarea
              placeholder="Escribe tu nota aquí..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full mb-4 px-4 py-3 bg-slate-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm min-h-[120px] resize-y text-slate-700 placeholder:text-slate-400"
              required
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-200 hover:shadow-lg"
              >
                Guardar Nota
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12 text-indigo-400">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : notes.length === 0 && !isAdding ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <StickyNote size={40} />
            </div>
            <p className="text-slate-500 font-medium">No tienes notas aún.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            {notes.map((note, index) => {
              const gradient = gradients[index % gradients.length];
              return (
                <div key={note.id} className={`${gradient} p-6 rounded-3xl shadow-lg text-white relative overflow-hidden group transition-transform hover:-translate-y-1`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-xl leading-tight">{note.title}</h3>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-white/50 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                        title="Eliminar nota"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-white/90 text-sm whitespace-pre-wrap mb-5 line-clamp-4">{note.content}</p>
                    <div className="text-xs text-white/70 font-medium">
                      {note.createdAt?.toDate ? format(note.createdAt.toDate(), "d MMM, yyyy", { locale: es }) : 'Guardando...'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
