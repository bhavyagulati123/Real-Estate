'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useLeadStore } from '@/stores/useStore';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { leads, fetchLeads } = useLeadStore();
  const [overdue, setOverdue] = useState([]);
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    loadFollowUps();
  }, []);

  const loadFollowUps = async () => {
    try {
      await fetchLeads({ searchOverdue: true });
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueLeads = leads.filter(lead => {
        const followUpDate = new Date(lead.followUpDate);
        followUpDate.setHours(0, 0, 0, 0);
        return followUpDate < today;
      });

      const upcomingLeads = leads.filter(lead => {
        const followUpDate = new Date(lead.followUpDate);
        followUpDate.setHours(0, 0, 0, 0);
        return followUpDate >= today && followUpDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      });

      setOverdue(overdueLeads);
      setUpcoming(upcomingLeads);
    } catch (error) {
      toast.error('Failed to load follow-ups');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Follow-up engine - Daily priorities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card bg-red-50 border-red-200">
          <h3 className="text-sm font-medium text-red-900">Overdue Follow-ups</h3>
          <p className="text-3xl font-bold text-red-600 mt-1">{overdue.length}</p>
        </div>
        <div className="card bg-yellow-50 border-yellow-200">
          <h3 className="text-sm font-medium text-yellow-900">Upcoming This Week</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{upcoming.length}</p>
        </div>
        <div className="card bg-blue-50 border-blue-200">
          <h3 className="text-sm font-medium text-blue-900">Links</h3>
          <div className="flex gap-2 mt-2">
            <Link href="/leads" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              All Leads →
            </Link>
            <Link href="/leads/new" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              New Lead →
            </Link>
          </div>
        </div>
      </div>

      {/* Overdue Follow-ups */}
      {overdue.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Overdue Follow-ups</h2>
          <div className="grid gap-4">
            {overdue.map((lead) => (
              <Link href={`/leads/${lead._id}`} key={lead._id}>
                <div className="card bg-red-50 border-red-200 hover:shadow-md cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">{lead.name}</h3>
                      <p className="text-sm text-gray-600">{lead.phone}</p>
                      <div className="mt-2 flex gap-2">
                        <span className="badge badge-danger">{lead.leadType}</span>
                        <span className="badge">{lead.status}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-red-600">
                        Follow-up: {formatDistanceToNow(new Date(lead.followUpDate), { addSuffix: true })}
                      </p>
                      {lead.followUpNotes && (
                        <p className="text-sm text-gray-700 mt-2 max-w-xs text-left">{lead.followUpNotes}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Follow-ups */}
      {upcoming.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-yellow-600 mb-4">📅 Upcoming This Week</h2>
          <div className="grid gap-4">
            {upcoming.map((lead) => (
              <Link href={`/leads/${lead._id}`} key={lead._id}>
                <div className="card hover:shadow-md cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">{lead.name}</h3>
                      <p className="text-sm text-gray-600">{lead.phone}</p>
                      <div className="mt-2 flex gap-2">
                        <span className="badge badge-info">{lead.leadType}</span>
                        <span className="badge">{lead.status}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-amber-600">
                        Follow-up: {formatDistanceToNow(new Date(lead.followUpDate), { addSuffix: true })}
                      </p>
                      {lead.followUpNotes && (
                        <p className="text-sm text-gray-700 mt-2 max-w-xs text-left">{lead.followUpNotes}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {overdue.length === 0 && upcoming.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-600 text-lg mb-4">✓ No follow-ups due today!</p>
          <Link href="/leads/new" className="btn-primary">
            Add New Lead
          </Link>
        </div>
      )}
    </div>
  );
}
