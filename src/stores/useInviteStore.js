import { create } from 'zustand';
import { invitationsApi } from '../services/api.js';

let ultimaCarga = 0;

const useInviteStore = create((set) => ({
  invitaciones: [],
  enviadas: [],
  aceptadas: 0,
  puntosTotales: 0,
  loading: false,
  error: '',

  reset: () => {
    ultimaCarga++;
    set({ enviadas: [], invitaciones: [], aceptadas: 0, puntosTotales: 0, loading: false, error: '' });
  },

  fetchMyInvites: async () => {
    const carga = ++ultimaCarga;
    set({ loading: true, error: '', enviadas: [], invitaciones: [], aceptadas: 0, puntosTotales: 0 });
    try {
      const data = await invitationsApi.getMy();
      if (carga !== ultimaCarga) return;
      set((state) => {
        const ids = new Set(data.enviadas.map((inv) => inv.id));
        const enviadas = [...state.enviadas.filter((inv) => !ids.has(inv.id)), ...data.enviadas];
        return { ...data, enviadas, invitaciones: enviadas, loading: false };
      });
    } catch (err) {
      if (carga !== ultimaCarga) return;
      console.error('Failed to fetch invites:', err);
      set({ loading: false, error: err.message });
    }
  },

  createInvite: async (email) => {
    try {
      const result = await invitationsApi.create(email);
      set((state) => ({
        enviadas: [result, ...state.enviadas],
      }));
      return result;
    } catch (err) {
      console.error('Failed to create invite:', err);
      throw err;
    }
  },

  acceptInvite: async (codigo) => {
    try {
      const result = await invitationsApi.accept(codigo);
      return result;
    } catch (err) {
      console.error('Failed to accept invite:', err);
      throw err;
    }
  },
}));

export default useInviteStore;
