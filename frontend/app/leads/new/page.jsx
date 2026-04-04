'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useLeadStore } from '@/stores/useStore';
import api from '@/lib/axios';

export default function LeadFormPage() {
  const router = useRouter();
  const params = useParams();
  const { addLead, updateLead } = useLeadStore();
  const [loading, setLoading] = useState(false);
  const [leadId, setLeadId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    alternatePhone: '',
    source: 'call',
    leadType: 'buyer',
    budget: '',
    location: '',
    block: '',
    propertyType: '',
    configuration: 'NA',
    size: '',
    buildingAge: '',
    credibilityScore: 3,
    status: 'new',
    followUpDate: '',
    followUpNotes: '',
    notes: ''
  });

  useEffect(() => {
    if (params?.id && params.id !== 'new') {
      setLeadId(params.id);
      loadLead(params.id);
    }
  }, [params]);

  const loadLead = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/leads/${id}`);
      const lead = response.data.data;
      
      // Format date for input
      const followUpDate = lead.followUpDate ? new Date(lead.followUpDate).toISOString().split('T')[0] : '';
      
      setFormData({
        ...lead,
        followUpDate
      });
    } catch (error) {
      toast.error('Failed to load lead');
      router.push('/leads');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : '') : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      const submitData = {
        ...formData,
        budget: formData.budget ? Number(formData.budget) : undefined,
        size: formData.size ? Number(formData.size) : undefined,
        credibilityScore: Number(formData.credibilityScore)
      };

      if (leadId) {
        await updateLead(leadId, submitData);
        toast.success('Lead updated successfully');
      } else {
        await addLead(submitData);
        toast.success('Lead created successfully');
      }

      router.push('/leads');
    } catch (error) {
      toast.error(error.message || 'Failed to save lead');
    } finally {
      setLoading(false);
    }
  };

  if (loading && leadId) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center py-12">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/leads" className="text-blue-600 hover:text-blue-800">← Back to Leads</Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">{leadId ? 'Edit Lead' : 'Add New Lead'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Basic Info */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Full name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Alternate Phone</label>
              <input
                type="tel"
                name="alternatePhone"
                value={formData.alternatePhone}
                onChange={handleChange}
                className="form-input"
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lead Type *</label>
              <select
                name="leadType"
                value={formData.leadType}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Source *</label>
              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="call">Call</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="agent">Agent</option>
                <option value="walkin">Walk-in</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Credibility Score</label>
              <input
                type="number"
                name="credibilityScore"
                value={formData.credibilityScore}
                onChange={handleChange}
                min="1"
                max="5"
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Property Preferences */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Property Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Budget (₹)</label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className="form-input"
                placeholder="5000000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="form-input"
                placeholder="Area or lane"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Block</label>
              <select
                name="block"
                value={formData.block}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select Block</option>
                <option value="A">Block A</option>
                <option value="B">Block B</option>
                <option value="C">Block C</option>
                <option value="D">Block D</option>
                <option value="E">Block E</option>
                <option value="F">Block F</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Property Type</label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select Type</option>
                <option value="residential">Residential</option>
                <option value="floor">Floor</option>
                <option value="office">Office</option>
                <option value="rootFloor">Root Floor</option>
                <option value="fullBuilding">Full Building</option>
                <option value="plot">Plot</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Configuration</label>
              <select
                name="configuration"
                value={formData.configuration}
                onChange={handleChange}
                className="form-select"
              >
                <option value="NA">NA</option>
                <option value="1BHK">1BHK</option>
                <option value="2BHK">2BHK</option>
                <option value="3BHK">3BHK</option>
                <option value="4BHK">4BHK</option>
                <option value="villa">Villa</option>
                <option value="plot">Plot</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Size (Sq Yards)</label>
              <input
                type="number"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="form-input"
                placeholder="250"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Building Age</label>
              <input
                type="text"
                name="buildingAge"
                value={formData.buildingAge}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 5 years, new construction"
              />
            </div>
          </div>
        </div>

        {/* Pipeline & Follow-up */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pipeline & Follow-up</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
              >
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

            <div className="form-group">
              <label className="form-label">Follow-up Date</label>
              <input
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group md:col-span-2">
              <label className="form-label">Follow-up Notes</label>
              <textarea
                name="followUpNotes"
                value={formData.followUpNotes}
                onChange={handleChange}
                className="form-input"
                rows="3"
                placeholder="What to discuss on next call..."
              />
            </div>

            <div className="form-group md:col-span-2">
              <label className="form-label">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-input"
                rows="4"
                placeholder="General notes, gut feeling, context..."
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Saving...' : leadId ? 'Update Lead' : 'Create Lead'}
          </button>
          <Link href="/leads" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
