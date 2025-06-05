import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getDrugDetails, logClick } from '../services/api';

interface Recommendation {
  drug_concept_id: number;
  concept_name: string;
  condition_name?: string; // Optional for future
}

interface Props {
  drugId: number;
  sessionId: string;
  onClose: () => void;
}

export default function DrugDetailDrawer({ drugId, sessionId, onClose }: Props) {
  const [drug, setDrug] = useState<{
    concept_name: string;
    condition_name?: string;
    related_drugs: Recommendation[];
  } | null>(null);

  useEffect(() => {
    getDrugDetails(drugId)
      .then((data) => {
        setDrug({
          concept_name: data.concept_name,
          condition_name: data.condition_name ?? 'Unknown Condition', // Default if missing
          related_drugs: data.related_drugs ?? [],
        });
      })
      .catch(() => setDrug(null));

    logClick(sessionId, drugId); // log the click
  }, [drugId, sessionId]);

  return (
    <motion.div
      className="fixed top-0 right-0 w-96 h-full bg-white shadow-lg p-6 overflow-auto"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
    >
      <button onClick={onClose} className="mb-4 text-gray-600 hover:text-gray-800">
        Close ×
      </button>
      {drug ? (
        <>
          <h2 className="text-2xl font-bold text-gray-800">{drug.concept_name}</h2>
          <p className="text-sm text-gray-600 mb-4">Condition: {drug.condition_name}</p>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
            Add to Patient
          </button>
          <button className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg" onClick={onClose}>
            Cancel
          </button>
          <h3 className="mt-6 font-semibold text-gray-700">Often Used Together</h3>
          {drug.related_drugs.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {drug.related_drugs.map((d, idx) => (
                <div key={d.drug_concept_id} className="bg-yellow-100 px-2 py-1 rounded text-xs">
                  {d.concept_name}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-2">No related drugs found.</p>
          )}
        </>
      ) : (
        <p>Loading...</p>
      )}
    </motion.div>
  );
}
