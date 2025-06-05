import React, { useEffect, useState, useRef } from 'react';
import Layout from '../components/Layout';
import { getPatients, createPatient, deletePatient } from '../services/api';
import { PlusIcon, XIcon, Trash2Icon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa, { ParseResult } from 'papaparse';

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  condition: string;
}

interface ConditionOption {
  concept_id: string;
  concept_name: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [conditions, setConditions] = useState<ConditionOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    condition: '',
  });

  useEffect(() => {
    fetchPatients();
    loadConditions();
  }, []);

  const fetchPatients = async () => {
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (err: any) {
      console.error('❌ Failed to fetch patients', err);
    }
  };

  const loadConditions = () => {
    fetch('/data/condition.csv')
      .then((res) => {
        if (!res.ok) throw new Error('CSV file not found');
        console.log('✅ Found and loaded: /data/condition.csv');
        return res.text();
      })
      .then((text) => {
        Papa.parse(text, {
          header: false,
          delimiter: '\t',
          skipEmptyLines: true,
          complete: (results: ParseResult<string[]>) => {
            const parsed = results.data;
            console.log('📦 Parsed rows:', parsed.slice(0, 5));

            const options = parsed
              .filter(
                (row) =>
                  Array.isArray(row) &&
                  row.length > 1 &&
                  typeof row[1] === 'string' &&
                  row[1].trim() !== ''
              )
              .map((row) => ({
                concept_id: row[0]?.trim(),
                concept_name: row[1]?.replace(/"/g, '').trim(),
              }));

            console.log(`✅ Loaded ${options.length} valid conditions`);
            setConditions(options);
          },
          error: (err: any) => {
            console.error('❌ Error parsing CSV:', err);
          },
        });
      })
      .catch((err: any) => {
        console.error('❌ Failed to load CSV:', err);
      });
  };

  const handleSubmit = async () => {
    try {
      await createPatient({
        name: form.name,
        age: parseInt(form.age),
        gender: form.gender,
        condition: form.condition,
      });
      setShowModal(false);
      setForm({ name: '', age: '', gender: '', condition: '' });
      fetchPatients();
    } catch (err: any) {
      console.error('❌ Failed to create patient', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await deletePatient(id);
        fetchPatients();
      } catch (err: any) {
        console.error('❌ Failed to delete patient', err);
      }
    }
  };

  const filteredConditions = conditions.filter((c) =>
    c.concept_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const visibleConditions = filteredConditions.slice(0, visibleCount);

  const handleScroll = () => {
    const container = dropdownRef.current;
    if (container && container.scrollTop + container.clientHeight >= container.scrollHeight - 10) {
      setVisibleCount((prev) => prev + 20);
    }
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <PlusIcon size={18} /> Add Patient
        </button>
      </div>

      {patients.length === 0 ? (
        <p className="text-gray-500">No patients found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {patients.map((patient) => (
            <div key={patient.id} className="bg-white rounded-lg shadow p-4 relative">
              <h2 className="text-lg font-semibold">{patient.name}</h2>
              <p className="text-sm text-gray-600">Age: {patient.age}</p>
              <p className="text-sm text-gray-600">Gender: {patient.gender}</p>
              <p className="text-sm text-gray-600">Condition: {patient.condition}</p>
              <button
                onClick={() => handleDelete(patient.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                title="Delete Patient"
              >
                <Trash2Icon size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add Patient</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-600 hover:text-gray-800">
                  <XIcon size={20} />
                </button>
              </div>

              <input
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
              />
              <input
                type="number"
                placeholder="Age"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
              />
              <input
                type="text"
                placeholder="Gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
              />

              <input
                type="text"
                placeholder="Search Condition"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setVisibleCount(20);
                }}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
              />

              <div
                ref={dropdownRef}
                onScroll={handleScroll}
                className="w-full max-h-48 overflow-y-auto border border-gray-300 rounded px-2 py-2 mb-4"
              >
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="w-full"
                  size={5}
                >
                  <option value="">Select Condition</option>
                  {visibleConditions.map((c) => (
                    <option key={c.concept_id} value={c.concept_name}>
                      {c.concept_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
                >
                  Create Patient
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded w-full"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
