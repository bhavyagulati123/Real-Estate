'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { usePropertyStore } from '@/stores/useStore';
import { format } from 'date-fns';

export default function PropertiesPage() {
  const { properties, fetchProperties, deleteProperty, loading } = usePropertyStore();
  const [filters, setFilters] = useState({
    status: '',
    block: '',
    propertyType: '',
    dealType: ''
  });

  useEffect(() => {
    loadProperties();
  }, [filters]);

  const loadProperties = async () => {
    try {
      await fetchProperties(filters);
    } catch (error) {
      toast.error('Failed to load properties');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    try {
      await deleteProperty(id);
      toast.success('Property deleted successfully');
    } catch (error) {
      toast.error('Failed to delete property');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getStatusColor = (status) => {
    const colors = {
      'available': 'badge-success',
      'underNegotiation': 'badge-warning',
      'sold': 'badge-danger',
      'ownerOwned': 'badge-info'
    };
    return colors[status] || 'badge-info';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-1">Manage all listings and investments</p>
        </div>
        <Link href="/properties/new" className="btn-primary">
          + New Property
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="underNegotiation">Under Negotiation</option>
              <option value="sold">Sold</option>
              <option value="ownerOwned">Owner Owned</option>
            </select>
          </div>

          <div>
            <label className="form-label">Block</label>
            <select
              name="block"
              value={filters.block}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">All Blocks</option>
              <option value="A">Block A</option>
              <option value="B">Block B</option>
              <option value="C">Block C</option>
              <option value="D">Block D</option>
              <option value="E">Block E</option>
              <option value="F">Block F</option>
            </select>
          </div>

          <div>
            <label className="form-label">Type</label>
            <select
              name="propertyType"
              value={filters.propertyType}
              onChange={handleFilterChange}
              className="form-select"
            >
              <option value="">All Types</option>
              <option value="residential">Residential</option>
              <option value="floor">Floor</option>
              <option value="office">Office</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', block: '', propertyType: '', dealType: '' })}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Properties List */}
      {loading ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">Loading properties...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 text-lg mb-4">No properties found</p>
          <Link href="/properties/new" className="btn-primary">
            Create First Property
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {properties.map((property) => (
            <Link key={property._id} href={`/properties/${property._id}`}>
              <div className="card hover:shadow-lg cursor-pointer transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{property.title}</h3>
                    <p className="text-gray-600 text-sm">
                      {property.location} • Block {property.block}
                    </p>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <span className={`badge ${getStatusColor(property.ownershipStatus)}`}>
                        {property.ownershipStatus}
                      </span>
                      <span className="badge">{property.dealType}</span>
                      {property.propertyType && (
                        <span className="badge">{property.propertyType}</span>
                      )}
                      {property.configuration && property.configuration !== 'NA' && (
                        <span className="badge">{property.configuration}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {property.listedPrice && (
                      <p className="font-bold text-green-600">
                        ₹ {(property.listedPrice / 100000).toFixed(1)}L
                      </p>
                    )}
                    {property.floorPrice && (
                      <p className="text-xs text-gray-600">
                        Floor: ₹ {(property.floorPrice / 100000).toFixed(1)}L
                      </p>
                    )}
                    {property.size && (
                      <p className="text-sm text-gray-600">{property.size} Sq Yards</p>
                    )}
                  </div>
                </div>
                {property.notes && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">{property.notes}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
