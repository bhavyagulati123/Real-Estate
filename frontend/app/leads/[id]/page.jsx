'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { useLeadStore } from '@/stores/useStore';
import { format } from 'date-fns';

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { deleteLead } = useLeadStore();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLead();
  }, [params.id]);

  const loadLead = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/leads/${params.id}`);
      setLead(response.data.data);
    } catch (error) {
      toast.error('Failed to load lead');
      router.push('/leads');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await deleteLead(params.id);
      toast.success('Lead deleted successfully');
      router.push('/leads');
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center py-12">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center py-12">
          <p className="text-gray-600">Lead not found</p>
          <Link href="/leads" className="text-blue-600 hover:text-blue-800 mt-4 block">
            Back to Leads
          </Link>
        </div>
      </div>
    );
  }

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <Link href="/leads" className="text-blue-600 hover:text-blue-800">← Back to Leads</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{lead.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/leads/${params.id}/edit`} className="btn-primary">
            Edit
          </Link>
          <button onClick={handleDelete} className="btn-secondary">
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{lead.phone}</p>
            </div>
            {lead.alternatePhone && (
              <div>
                <p className="text-sm text-gray-600">Alternate Phone</p>
                <p className="font-medium">{lead.alternatePhone}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Source</p>
              <p className="font-medium capitalize">{lead.source}</p>
            </div>
          </div>
        </div>

        {/* Lead Status */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Status & Qualification</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Lead Type</p>
              <span className={`badge ${lead.leadType === 'buyer' ? 'badge-info' : 'badge-success'} font-medium`}>
                {lead.leadType.charAt(0).toUpperCase() + lead.leadType.slice(1)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`badge ${getStatusColor(lead.status)} font-medium`}>
                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Credibility Score</p>
              <p className="text-lg font-bold">⭐ {lead.credibilityScore}/5</p>
            </div>
          </div>
        </div>

        {/* Property Preferences */}
        {(lead.budget || lead.propertyType || lead.block || lead.location) && (
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Property Preferences</h2>
            <div className="space-y-3">
              {lead.budget && (
                <div>
                  <p className="text-sm text-gray-600">Budget</p>
                  <p className="font-medium">₹ {(lead.budget / 100000).toFixed(2)}L</p>
                </div>
              )}
              {lead.propertyType && (
                <div>
                  <p className="text-sm text-gray-600">Property Type</p>
                  <p className="font-medium capitalize">{lead.propertyType}</p>
                </div>
              )}
              {lead.block && (
                <div>
                  <p className="text-sm text-gray-600">Block</p>
                  <p className="font-medium">Block {lead.block}</p>
                </div>
              )}
              {lead.location && (
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium">{lead.location}</p>
                </div>
              )}
              {lead.configuration && lead.configuration !== 'NA' && (
                <div>
                  <p className="text-sm text-gray-600">Configuration</p>
                  <p className="font-medium">{lead.configuration}</p>
                </div>
              )}
              {lead.size && (
                <div>
                  <p className="text-sm text-gray-600">Size</p>
                  <p className="font-medium">{lead.size} Sq Yards</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Follow-up */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Follow-up</h2>
          <div className="space-y-3">
            {lead.followUpDate && (
              <div>
                <p className="text-sm text-gray-600">Follow-up Date</p>
                <p className="font-medium">{format(new Date(lead.followUpDate), 'dd MMM yyyy, EEE')}</p>
              </div>
            )}
            {lead.followUpNotes && (
              <div>
                <p className="text-sm text-gray-600">Follow-up Notes</p>
                <p className="font-medium text-sm">{lead.followUpNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Timestamps</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Created At</p>
              <p className="font-medium text-sm">{format(new Date(lead.createdAt), 'dd MMM yyyy, HH:mm')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Updated At</p>
              <p className="font-medium text-sm">{format(new Date(lead.updatedAt), 'dd MMM yyyy, HH:mm')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {lead.notes && (
        <div className="card mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Notes</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
        </div>
      )}
    </div>
  );
}
