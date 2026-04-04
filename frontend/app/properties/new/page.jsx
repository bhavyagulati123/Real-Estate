'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { usePropertyStore } from '@/stores/useStore';
import api from '@/lib/axios';

export default function PropertyFormPage() {
  const router = useRouter();
  const params = useParams();
  const { addProperty, updateProperty } = usePropertyStore();
  const [loading, setLoading] = useState(false);
  const [propertyId, setPropertyId] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    block: '',
    propertyType: '',
    configuration: 'NA',
    size: '',
    buildingAge: '',
    buildingCredibility: 3,
    floorPrice: '',
    askingPrice: '',
    listedPrice: '',
    dealType: 'brokerage',
    ownershipStatus: 'available',
    sellerId: '',
    images: [],
    notes: ''
  });

  useEffect(() => {
    if (params?.id && params.id !== 'new') {
      setPropertyId(params.id);
      loadProperty(params.id);
    }
  }, [params]);

  const loadProperty = async (id) => {
    try {
      setLoading(true);
      const response = await api.get(`/properties/${id}`);
      const property = response.data.data;
      setFormData(property);
    } catch (error) {
      toast.error('Failed to load property');
      router.push('/properties');
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
        size: formData.size ? Number(formData.size) : undefined,
        floorPrice: formData.floorPrice ? Number(formData.floorPrice) : undefined,
        askingPrice: formData.askingPrice ? Number(formData.askingPrice) : undefined,
        listedPrice: formData.listedPrice ? Number(formData.listedPrice) : undefined,
        buildingCredibility: Number(formData.buildingCredibility),
        sellerId: formData.sellerId || undefined
      };

      if (propertyId) {
        await updateProperty(propertyId, submitData);
        toast.success('Property updated successfully');
      } else {
        await addProperty(submitData);
        toast.success('Property created successfully');
      }

      router.push('/properties');
    } catch (error) {
      toast.error(error.message || 'Failed to save property');
    } finally {
      setLoading(false);
    }
  };

  if (loading && propertyId) {
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
        <Link href="/properties" className="text-blue-600 hover:text-blue-800">← Back to Properties</Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">{propertyId ? 'Edit Property' : 'Add New Property'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Basic Info */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group md:col-span-2">
              <label className="form-label">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="e.g., 2BHK Floor, Block C, Mohan Garden"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Area or lane"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Block *</label>
              <select
                name="block"
                value={formData.block}
                onChange={handleChange}
                required
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
              <label className="form-label">Property Type *</label>
              <select
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                required
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

            <div className="form-group">
              <label className="form-label">Building Credibility</label>
              <input
                type="number"
                name="buildingCredibility"
                value={formData.buildingCredibility}
                onChange={handleChange}
                min="1"
                max="5"
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Floor Price (₹)</label>
              <input
                type="number"
                name="floorPrice"
                value={formData.floorPrice}
                onChange={handleChange}
                className="form-input"
                placeholder="Seller's minimum (private)"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Asking Price (₹)</label>
              <input
                type="number"
                name="askingPrice"
                value={formData.askingPrice}
                onChange={handleChange}
                className="form-input"
                placeholder="What seller is asking"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Listed Price (₹)</label>
              <input
                type="number"
                name="listedPrice"
                value={formData.listedPrice}
                onChange={handleChange}
                className="form-input"
                placeholder="What Father shows to buyers"
              />
            </div>
          </div>
        </div>

        {/* Deal & Status */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Deal & Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Deal Type *</label>
              <select
                name="dealType"
                value={formData.dealType}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="brokerage">Brokerage</option>
                <option value="inflated">Price Inflation</option>
                <option value="coInvestment">Co-Investment</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ownership Status</label>
              <select
                name="ownershipStatus"
                value={formData.ownershipStatus}
                onChange={handleChange}
                className="form-select"
              >
                <option value="available">Available</option>
                <option value="underNegotiation">Under Negotiation</option>
                <option value="sold">Sold</option>
                <option value="ownerOwned">Owner Owned</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Additional Information</h2>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-input"
              rows="4"
              placeholder="Additional details about the property..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-4 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Saving...' : propertyId ? 'Update Property' : 'Create Property'}
          </button>
          <Link href="/properties" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
