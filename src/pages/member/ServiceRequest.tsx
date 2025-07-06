import React, { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';
import { FamilyMember } from '../../types';

export default function ServiceRequest() {
  const { user } = useAuth();
  const [service, setService] = useState<string | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les membres de famille
  useEffect(() => {
    if (!user) return;

    const loadFamilyMembers = async () => {
      try {
        setLoading(true);
        const members = await userService.getFamilyMembers(user.id);
        setFamilyMembers(members);
      } catch (error) {
        console.error('Erreur lors du chargement des membres de famille:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFamilyMembers();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Header simple */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Demande de service</h1>
        <p className="text-gray-600 mt-2">Soumettez votre demande de prestation sociale</p>
      </div>

      <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Type de service</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <ServiceCard
            title="Scolaire"
            description="Aide aux frais de scolarité et fournitures"
            max="Max: 500€"
            selected={service === "Scolaire"}
            onClick={() => setService("Scolaire")}
          />
          <ServiceCard
            title="Santé"
            description="Remboursement frais médicaux"
            max="Max: 1000€"
            selected={service === "Santé"}
            onClick={() => setService("Santé")}
          />
          <ServiceCard
            title="Décès"
            description="Aide funéraire"
            max="Max: 2000€"
            selected={service === "Décès"}
            onClick={() => setService("Décès")}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Bénéficiaire</label>
          <select className="w-full border rounded p-2" disabled={loading}>
            <option value="">
              {loading ? 'Chargement...' : 'Sélectionnez le bénéficiaire...'}
            </option>
            {/* L'adhérent lui-même */}
            <option value="self">
              {user?.name} (Moi-même)
            </option>
            {/* Membres de famille */}
            {familyMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.firstName} {member.lastName} ({member.relationship})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Montant demandé (€)</label>
          <input type="number" className="w-full border rounded p-2" placeholder="0.00" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Description de la demande</label>
          <textarea
            className="w-full border rounded p-2"
            rows={4}
            placeholder="Décrivez votre demande en détail..."
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Pièces justificatives</label>
          <div className="border-2 border-dashed rounded p-6 text-center text-gray-500 cursor-pointer">
            <p>Cliquez pour uploader ou glissez-déposez</p>
            <p className="text-xs mt-2">PDF, PNG, JPG (MAX. 10MB chacun)</p>
          </div>
        </div>

        <div className="bg-blue-50 text-blue-700 text-sm p-4 rounded mb-4">
          <strong>Important</strong><br />
          Assurez-vous que tous les documents requis sont joints à votre demande. Les demandes incomplètes peuvent être retardées ou rejetées.
        </div>

        <button className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700">
          Soumettre la demande
        </button>
      </div>
    </div>
  );
}

function ServiceCard({
  title,
  description,
  max,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  max: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`border rounded p-4 cursor-pointer transition ${
        selected ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-300"
      }`}
    >
      <div className="text-3xl mb-2">
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
      <div className="font-bold">{title}</div>
      <div className="text-sm text-gray-600">{description}</div>
      <div className="text-sm text-blue-600 font-bold mt-1">{max}</div>
    </div>
  );
}