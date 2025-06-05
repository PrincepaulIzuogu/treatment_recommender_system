import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Drug } from '../pages/Dashboard';
import { PillIcon } from 'lucide-react';

interface Props {
  drugs: Drug[] | null;
  sessionId: string | null;
  onDrugClick: (drug: Drug) => void; // 🔥 Add this prop
}

export default function DrugsBrowserSection({ drugs, sessionId, onDrugClick }: Props) {
  const navigate = useNavigate();

  if (!drugs || drugs.length === 0) {
    return <div className="text-center text-gray-600 py-10">No drugs found.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {drugs.map((drug) => (
        <div
          key={drug.drug_concept_id}
          className="bg-white p-3 rounded-lg shadow hover:shadow-md transition flex flex-col items-center text-center text-sm"
        >
          <PillIcon className="w-8 h-8 text-blue-600 mb-2" />
          <h3 className="font-semibold truncate w-full">{drug.concept_name}</h3>
          <p className="text-xs text-gray-600 truncate w-full">{drug.condition_name}</p>
          <p className="text-xs text-gray-500">Exposures: {drug.exposure_count}</p>
          <button
            onClick={() => onDrugClick(drug)} // 🔥 Use the passed handler
            className="mt-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            View Details
          </button>
        </div>
      ))}
    </div>
  );
}
