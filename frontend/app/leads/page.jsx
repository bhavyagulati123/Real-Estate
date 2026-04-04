'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useLeadStore } from '@/stores/useStore';
import { format } from 'date-fns';

export default function LeadsPage() {
  const { leads, fetchLeads, deleteLead, loading } = useLeadStore();
  const [filters, setFilters] = useState({
    status: '',
    leadType: ''
  });

  useEffect(() => {
    loadLeads();
  }, [filters]);

  const loadLeads = async () => {
    try {
      await fetchLeads(filters);
    } catch (error) {
      toast.error('Failed to load leads');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await deleteLead(id);
      toast.success('Lead deleted successfully');
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (status) => {
    const colors = {
      'new': 'badge-info',
      'contacted': 'badge-info',
      'interested': 'badge-warning',
      'visit': 'badge-warning',
      'negotiation': 'badge-warning',
      'bayana': 'badge-success',
      'papers': 'badge-success',
      'closed': 'badge-success',
      'lost': 'badge-danger'
    };
    return colors[status] || 'badge-info';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">Manage all buyer and seller leads</p>
        </div>
        <Link href="/leads/new" className="btn-primary">
          + New Lead
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="visit">Visit</option>
              <option value="negotiation">Negotiation</option>
              <option value="bayana">Bayana</option>
              <option value="papers">Papers</option>
              <option value="closed">Closed</option>
              <option value="lost">Lost</option>
            </select>
          </div>

          <div>
            <label className="form-label">Lead Type</label>
            <select
              name="leadType"
              value={filters.leadType}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">All Types</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', leadType: '' })}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">Loading leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 text-lg mb-4">No leads found</p>
          <Link href="/leads/new" className="btn-primary">
            Create First Lead
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {leads.map((lead) => (
            <Link key={lead._id} href={`/leads/${lead._id}`}>
              <div className="card hover:shadow-lg cursor-pointer transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{lead.name}</h3>
                    <p className="text-gray-600">📱 {lead.phone}</p>
                    {lead.alternatePhone && (
                      <p className="text-gray-600">📱 {lead.alternatePhone}</p>
                    )}
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <span className={`badge ${lead.leadType === 'buyer' ? 'badge-info' : 'badge-success'}`}>
                        {lead.leadType}
                      </span>
                      <span className={`badge ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                      {lead.credibilityScore && (
                        <span className="badge">⭐ {lead.credibilityScore}/5</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {lead.budget && (
                      <p className="font-semibold text-gray-900">
                        ₹ {(lead.budget / 100000).toFixed(1)}L
                      </p>
                    )}
                    {lead.followUpDate && (
                      <p className="text-sm text-gray-600">
                        FU: {format(new Date(lead.followUpDate), 'dd MMM')}
                      </p>
                    )}
                    {lead.propertyType && (
                      <p className="text-sm text-gray-600">{lead.propertyType}</p>
                    )}
                  </div>
                </div>
                {lead.notes && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">{lead.notes}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
