import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getDrugDetails, logClick } from '../services/api';
import { motion } from 'framer-motion';
import { PillIcon } from 'lucide-react';

interface DrugRecommendation {
  drug_concept_id: number;
  concept_name: string;
  condition_name: string;
}

export default function DrugDetailsPage() {
  const { drugId, sessionId } = useParams<{ drugId: string; sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract passed drug data if available
  const passedDrug = (location.state as any)?.drug;
  const [drug, setDrug] = useState<{ concept_name: string; condition_name: string } | null>(passedDrug || null);
  const [relatedDrugs, setRelatedDrugs] = useState<DrugRecommendation[]>([]);

  useEffect(() => {
    if (drugId) {
      if (!drug) {
        // Fetch drug details including related drugs if no passed drug data
        getDrugDetails(parseInt(drugId))
          .then((data) => {
            setDrug({ concept_name: data.concept_name, condition_name: data.condition_name });
            setRelatedDrugs(data.related_drugs || []);
          })
          .catch(() => setDrug(null));
      } else {
        // Only fetch related drugs if drug data is already present
        getDrugDetails(parseInt(drugId))
          .then((data) => setRelatedDrugs(data.related_drugs || []))
          .catch(() => setRelatedDrugs([]));
      }

      if (sessionId) {
        logClick(sessionId, parseInt(drugId));
      }
    }
  }, [drugId, sessionId, drug]);

  if (!drug) {
    return <p className="text-center text-lg text-gray-600">Loading drug details...</p>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg"
    >
      {/* 🔙 Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold transition"
      >
        ← Back to Drug List
      </button>

      {/* 🌟 Drug Header */}
      <div className="flex items-center gap-4 mb-6">
        <PillIcon size={40} className="text-green-500" />
        <h1 className="text-4xl font-bold text-gray-800">{drug.concept_name}</h1>
      </div>

      {/* 📌 Key Points */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Key Points:</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li><strong>Name:</strong> {drug.concept_name}</li>
          <li><strong>Main Condition:</strong> {drug.condition_name}</li>
          <li><strong>Usage:</strong> Used for treating {drug.condition_name}.</li>
          <li><strong>Note:</strong> Always consult a healthcare provider before use.</li>
        </ul>
      </div>

      {/* 🔥 Often Used Together */}
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-left">Often Used Together</h2>
      <div className="bg-yellow-100 p-6 rounded-lg shadow flex flex-wrap items-center justify-center gap-4">
        {relatedDrugs[0] && (
          <div className="bg-white p-3 rounded-lg shadow hover:shadow-md flex flex-col items-center text-center text-sm w-36">
            <PillIcon className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold truncate w-full">{relatedDrugs[0].concept_name}</h3>
            <p className="text-xs text-gray-600 truncate w-full">{relatedDrugs[0].condition_name}</p>
          </div>
        )}
        <span className="text-3xl font-bold text-gray-800">+</span>
        <div className="bg-white p-3 rounded-lg shadow flex flex-col items-center text-center text-sm w-36">
          <PillIcon className="w-8 h-8 text-green-500 mb-2" />
          <h3 className="font-semibold truncate w-full">{drug.concept_name}</h3>
          <p className="text-xs text-gray-600 truncate w-full">{drug.condition_name}</p>
        </div>
        <span className="text-3xl font-bold text-gray-800">+</span>
        {relatedDrugs[1] && (
          <div className="bg-white p-3 rounded-lg shadow hover:shadow-md flex flex-col items-center text-center text-sm w-36">
            <PillIcon className="w-8 h-8 text-blue-600 mb-2" />
            <h3 className="font-semibold truncate w-full">{relatedDrugs[1].concept_name}</h3>
            <p className="text-xs text-gray-600 truncate w-full">{relatedDrugs[1].condition_name}</p>
          </div>
        )}
        <span className="text-3xl font-bold text-green-600">=</span>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
          Add All to Patient
        </button>
      </div>

      {/* ➕ Single Add to Patient Button */}
      <div className="mt-6 flex gap-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
          Add {drug.concept_name} to Patient
        </button>
      </div>

      {/* 📚 Additional Info */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-700">
          This combination is based on analysis of similar cases and treatments. Consult your healthcare provider for personalized recommendations.
        </p>
      </div>
    </motion.div>
  );
}
