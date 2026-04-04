import { create } from 'zustand';
import api from '@/lib/axios';

export const useLeadStore = create((set) => ({
  leads: [],
  loading: false,
  error: null,

  fetchLeads: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.leadType) params.append('leadType', filters.leadType);
      if (filters.searchOverdue) params.append('searchOverdue', filters.searchOverdue);

      const response = await api.get(`/leads?${params.toString()}`);
      set({ leads: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addLead: async (leadData) => {
    try {
      const response = await api.post('/leads', leadData);
      set((state) => ({ leads: [...state.leads, response.data.data] }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updateLead: async (id, updateData) => {
    try {
      const response = await api.put(`/leads/${id}`, updateData);
      set((state) => ({
        leads: state.leads.map((lead) => (lead._id === id ? response.data.data : lead))
      }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteLead: async (id) => {
    try {
      await api.delete(`/leads/${id}`);
      set((state) => ({ leads: state.leads.filter((lead) => lead._id !== id) }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  }
}));

export const usePropertyStore = create((set) => ({
  properties: [],
  loading: false,
  error: null,

  fetchProperties: async (filters = {}) => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.block) params.append('block', filters.block);
      if (filters.propertyType) params.append('propertyType', filters.propertyType);
      if (filters.dealType) params.append('dealType', filters.dealType);

      const response = await api.get(`/properties?${params.toString()}`);
      set({ properties: response.data.data, loading: false });
      return response.data.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addProperty: async (propertyData) => {
    try {
      const response = await api.post('/properties', propertyData);
      set((state) => ({ properties: [...state.properties, response.data.data] }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updateProperty: async (id, updateData) => {
    try {
      const response = await api.put(`/properties/${id}`, updateData);
      set((state) => ({
        properties: state.properties.map((prop) => (prop._id === id ? response.data.data : prop))
      }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteProperty: async (id) => {
    try {
      await api.delete(`/properties/${id}`);
      set((state) => ({ properties: state.properties.filter((prop) => prop._id !== id) }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  }
}));
