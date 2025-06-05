import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import DrugsBrowserSection from '../components/DrugsBrowserSection';
import { createSession, getDrugs } from '../services/api';

export interface Drug {
  drug_concept_id: number;
  concept_name: string;
  condition_name: string;
  condition_concept_id: number;
  exposure_count: number;
}

export default function DashboardPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigate = useNavigate();
  const observer = useRef<IntersectionObserver | null>(null);
  const lastDrugRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    createSession()
      .then(({ session_id }) => {
        setSessionId(session_id);
        fetchDrugs(session_id, 1, searchQuery);
      })
      .catch(err => {
        console.error('Error creating session:', err);
        setError('Failed to create session');
        setLoading(false);
      });
  }, []);

  const fetchDrugs = (sessionId: string, page: number, query: string = '') => {
    setLoading(true);
    getDrugs(sessionId, page, pageSize, query)
      .then((data) => {
        setDrugs(prev => [...prev, ...data]);
        setHasMore(data.length === pageSize);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error('Error fetching drugs:', err);
        setError('Failed to fetch drugs');
        setLoading(false);
      });
  };

  const loadMore = useCallback(() => {
    if (sessionId && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchDrugs(sessionId, nextPage, searchQuery);
    }
  }, [sessionId, hasMore, loading, page, searchQuery]);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (lastDrugRef.current) {
      observer.current.observe(lastDrugRef.current);
    }
  }, [loadMore, drugs]);

  const handleSearch = () => {
    if (sessionId) {
      setDrugs([]);
      setPage(1);
      fetchDrugs(sessionId, 1, searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (sessionId) {
      setDrugs([]);
      setPage(1);
      fetchDrugs(sessionId, 1);
    }
  };

  // 🔥 Handle drug selection and navigate with data
  const handleDrugClick = (drug: Drug) => {
    if (sessionId) {
      navigate(`/drug/${drug.drug_concept_id}/${sessionId}`, {
        state: { drug } // Pass the entire drug object
      });
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col bg-gray-50 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="text"
            placeholder="Search for drugs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 w-64"
          />
          <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded">Search</button>
          <button onClick={handleClearSearch} className="bg-gray-300 px-4 py-2 rounded">Clear</button>
        </div>

        <div className="bg-yellow-100 p-4 rounded mb-4 flex items-center justify-between">
          <span>Would you like personalized drug recommendations based on your medical history and conditions?</span>
          <button onClick={() => navigate('/recommendations')} className="bg-green-500 text-white px-4 py-2 rounded ml-4">
             Recommend
          </button>
        </div>



        {error && <p className="text-red-500">{error}</p>}
        {!error && drugs.length === 0 && !loading && <p>No drugs available.</p>}

        <DrugsBrowserSection drugs={drugs} sessionId={sessionId} onDrugClick={handleDrugClick} />

        <div ref={lastDrugRef} className="h-10" />
        {loading && <p>Loading more drugs...</p>}
        {!hasMore && <p className="text-center text-sm text-gray-600 mt-4">No more drugs to load.</p>}
      </div>
    </Layout>
  );
}
