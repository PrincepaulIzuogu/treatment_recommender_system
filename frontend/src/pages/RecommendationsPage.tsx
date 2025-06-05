import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getPatients, getPatientRecommendations, getCoUsageRecommendations } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { PillIcon } from 'lucide-react'; // use correct import or replace with your icon component

interface Patient {
  id: number;
  name: string;
}

interface Recommendation {
  drug_concept_id: number;
  concept_name: string;
  condition_name: string;
  exposure_count?: number;
}

export default function RecommendationsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [coUsageDrugs, setCoUsageDrugs] = useState<Recommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Error fetching patients', err);
    }
  };

  const handleFetchRecommendations = async () => {
    if (!selectedPatient) return;
    try {
      const [mainRecs, coRecs] = await Promise.all([
        getPatientRecommendations(selectedPatient),
        getCoUsageRecommendations(selectedPatient),
      ]);
      setRecommendations(mainRecs);
      setCoUsageDrugs(coRecs);
      setShowRecommendations(true);
    } catch (err) {
      console.error('Error fetching recommendations', err);
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Drug Recommendations</h1>
        <p className="text-gray-600">
          Select a patient to view personalized drug recommendations based on exposure history, age, gender, and condition.
        </p>
      </motion.div>

      <div className="mb-6 flex items-center gap-4">
        <select
          onChange={(e) => setSelectedPatient(parseInt(e.target.value))}
          value={selectedPatient ?? ''}
          className="border p-3 rounded shadow"
        >
          <option value="">Select a patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          onClick={handleFetchRecommendations}
          disabled={!selectedPatient}
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
        >
          Get Recommendations
        </button>
      </div>

      <AnimatePresence>
        {showRecommendations && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {recommendations.length === 0 ? (
              <p className="text-gray-500">No recommendations found for this patient.</p>
            ) : (
              <>
                <div className="mb-10">
                  <h2 className="text-xl font-bold text-blue-700 mb-2">Top Drug Recommendations</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    These drugs are recommended based on highest exposure patterns among similar patients.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {recommendations.map((rec) => (
                      <div key={rec.drug_concept_id} className="bg-white p-3 rounded-lg shadow border-l-4 border-blue-500 text-sm">
                        <h3 className="font-semibold">{rec.concept_name}</h3>
                        <p className="text-xs text-gray-600">Condition: {rec.condition_name}</p>
                        {rec.exposure_count !== undefined && (
                          <p className="text-xs text-gray-500">Exposure: {rec.exposure_count}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {coUsageDrugs.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 text-left">Drugs Often Used Together by Similar Patients</h2>
                    <div className="bg-yellow-100 p-6 rounded-lg shadow flex flex-wrap items-center justify-center gap-4">
                      {coUsageDrugs[0] && (
                        <div className="bg-white p-3 rounded-lg shadow hover:shadow-md flex flex-col items-center text-center text-sm w-36">
                          <PillIcon className="w-8 h-8 text-blue-600 mb-2" />
                          <h3 className="font-semibold truncate w-full">{coUsageDrugs[0].concept_name}</h3>
                          <p className="text-xs text-gray-600 truncate w-full">{coUsageDrugs[0].condition_name}</p>
                        </div>
                      )}
                      <span className="text-3xl font-bold text-gray-800">+</span>
                      {recommendations[0] && (
                        <div className="bg-white p-3 rounded-lg shadow flex flex-col items-center text-center text-sm w-36">
                          <PillIcon className="w-8 h-8 text-green-500 mb-2" />
                          <h3 className="font-semibold truncate w-full">{recommendations[0].concept_name}</h3>
                          <p className="text-xs text-gray-600 truncate w-full">{recommendations[0].condition_name}</p>
                        </div>
                      )}
                      <span className="text-3xl font-bold text-gray-800">+</span>
                      {coUsageDrugs[1] && (
                        <div className="bg-white p-3 rounded-lg shadow hover:shadow-md flex flex-col items-center text-center text-sm w-36">
                          <PillIcon className="w-8 h-8 text-blue-600 mb-2" />
                          <h3 className="font-semibold truncate w-full">{coUsageDrugs[1].concept_name}</h3>
                          <p className="text-xs text-gray-600 truncate w-full">{coUsageDrugs[1].condition_name}</p>
                        </div>
                      )}
                      <span className="text-3xl font-bold text-green-600">=</span>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
                        Add All to Patient
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
