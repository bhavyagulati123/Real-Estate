'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { usePropertyStore } from '@/stores/useStore';
import { format } from 'date-fns';

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { deleteProperty } = usePropertyStore();
  const [property, setProperty] = useState(null);
  const [matchingBuyers, setMatchingBuyers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperty();
  }, [params.id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/properties/${params.id}`);
      setProperty(response.data.data);

      // Load matching buyers
      try {
        const buyersResponse = await api.get(`/properties/${params.id}/matches`);
        setMatchingBuyers(buyersResponse.data.data || []);
      } catch (err) {
        // Silently fail on matching buyers
      }
    } catch (error) {
      toast.error('Failed to load property');
      router.push('/properties');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    try {
      await deleteProperty(params.id);
      toast.success('Property deleted successfully');
      router.push('/properties');
    } catch (error) {
      toast.error('Failed to delete property');
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

  if (!property) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card text-center py-12">
          <p className="text-gray-600">Property not found</p>
          <Link href="/properties" className="text-blue-600 hover:text-blue-800 mt-4 block">
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <Link href="/properties" className="text-blue-600 hover:text-blue-800">← Back to Properties</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{property.title}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/properties/${params.id}/edit`} className="btn-primary">
            Edit
          </Link>
          <button onClick={handleDelete} className="btn-secondary">
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Location & Status */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Location & Status</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium">{property.location}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Block</p>
              <p className="font-medium">Block {property.block}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`badge ${getStatusColor(property.ownershipStatus)} font-medium`}>
                {property.ownershipStatus}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Deal Type</p>
              <span className="badge font-medium">{property.dealType}</span>
            </div>
          </div>
        </div>

        {/* Property Details */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Property Details</h2>
          <div className="space-y-3">
            {property.propertyType && (
              <div>
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-medium capitalize">{property.propertyType}</p>
              </div>
            )}
            {property.configuration && property.configuration !== 'NA' && (
              <div>
                <p className="text-sm text-gray-600">Configuration</p>
                <p className="font-medium">{property.configuration}</p>
              </div>
            )}
            {property.size && (
              <div>
                <p className="text-sm text-gray-600">Size</p>
                <p className="font-medium">{property.size} Sq Yards</p>
              </div>
            )}
            {property.buildingAge && (
              <div>
                <p className="text-sm text-gray-600">Building Age</p>
                <p className="font-medium">{property.buildingAge}</p>
              </div>
            )}
            {property.buildingCredibility && (
              <div>
                <p className="text-sm text-gray-600">Building Credibility</p>
                <p className="font-medium">⭐ {property.buildingCredibility}/5</p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pricing</h2>
          <div className="space-y-3">
            {property.floorPrice && (
              <div>
                <p className="text-sm text-gray-600">Floor Price</p>
                <p className="font-medium">₹ {(property.floorPrice / 100000).toFixed(2)}L</p>
              </div>
            )}
            {property.askingPrice && (
              <div>
                <p className="text-sm text-gray-600">Asking Price</p>
                <p className="font-medium">₹ {(property.askingPrice / 100000).toFixed(2)}L</p>
              </div>
            )}
            {property.listedPrice && (
              <div>
                <p className="text-sm text-gray-600">Listed Price</p>
                <p className="font-bold text-green-600">₹ {(property.listedPrice / 100000).toFixed(2)}L</p>
              </div>
            )}
            {property.floorPrice && property.listedPrice && (
              <div>
                <p className="text-sm text-gray-600">Margin</p>
                <p className="font-medium">
                  ₹ {((property.listedPrice - property.floorPrice) / 100000).toFixed(2)}L
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Matching Buyers */}
      {matchingBuyers.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Matching Buyers ({matchingBuyers.length})
          </h2>
          <div className="grid gap-3">
            {matchingBuyers.map((buyer) => (
              <Link key={buyer._id} href={`/leads/${buyer._id}`}>
                <div className="border border-blue-200 rounded-md p-4 hover:bg-blue-50 cursor-pointer">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">{buyer.name}</h4>
                      <p className="text-sm text-gray-600">{buyer.phone}</p>
                      <div className="mt-2 flex gap-2">
                        <span className="badge badge-info">{buyer.status}</span>
                        {buyer.credibilityScore && (
                          <span className="badge">⭐ {buyer.credibilityScore}/5</span>
                        )}
                      </div>
                    </div>
                    {buyer.budget && (
                      <div className="text-right">
                        <p className="font-semibold">₹ {(buyer.budget / 100000).toFixed(1)}L</p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {property.notes && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Notes</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{property.notes}</p>
        </div>
      )}
    </div>
  );
}
