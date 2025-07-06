import React, { useState } from 'react';
import { Search, Filter, Eye, Check, X, MessageSquare, Calendar, User } from 'lucide-react';

interface ServiceRequest {
  id: string;
  memberName: string;
  memberEmail: string;
  service: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  submissionDate: string;
  documents: string[];
  comments?: string;
}

export default function RequestManagement() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [comment, setComment] = useState('');

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (requestId: string, newStatus: 'approved' | 'rejected', comment: string) => {
    setRequests(requests.map(request => 
      request.id === requestId 
        ? { ...request, status: newStatus, comments: comment }
        : request
    ));
    setSelectedRequest(null);
    setComment('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvée';
      case 'rejected': return 'Rejetée';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion des demandes</h1>
        <p className="text-gray-600 mt-2">Traitement et suivi des demandes de prestations</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white min-w-[150px]"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvées</option>
              <option value="rejected">Rejetées</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total', count: requests.length, color: 'blue' },
          { label: 'En attente', count: requests.filter(r => r.status === 'pending').length, color: 'yellow' },
          { label: 'Approuvées', count: requests.filter(r => r.status === 'approved').length, color: 'green' },
          { label: 'Rejetées', count: requests.filter(r => r.status === 'rejected').length, color: 'red' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="text-sm font-medium text-gray-600">{stat.label}</div>
            <div className="text-2xl font-bold text-gray-900 mt-2">{stat.count}</div>
          </div>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Aucune demande trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((request) => (
              <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{request.memberName}</h3>
                        <p className="text-sm text-gray-500">{request.memberEmail}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Service demandé</p>
                        <p className="text-sm text-gray-900">{request.service}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Date de soumission</p>
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(request.submissionDate).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700">Description</p>
                      <p className="text-sm text-gray-900 mt-1">{request.description}</p>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700">Documents joints ({request.documents.length})</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {request.documents.map((doc, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>

                    {request.comments && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 flex items-center">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Commentaire
                        </p>
                        <p className="text-sm text-gray-900 mt-1">{request.comments}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(request.id, 'approved', 'Demande approuvée')}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for detailed view and comments */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Détails de la demande</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commentaire / Raison du rejet
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Ajoutez un commentaire..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setComment('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Annuler
              </button>
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatusChange(selectedRequest.id, 'rejected', comment)}
                    className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
                  >
                    Rejeter
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedRequest.id, 'approved', comment)}
                    className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors duration-200"
                  >
                    Approuver
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}