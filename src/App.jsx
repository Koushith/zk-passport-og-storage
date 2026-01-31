import { useState, useEffect } from 'react';
import { ZKPassport, EU_COUNTRIES } from '@zkpassport/sdk';
import { motion } from 'framer-motion';
import { Shield, Globe, UserCheck, ScanFace, Building2, Database, Search, Wallet, CheckCircle } from 'lucide-react';
import { VerificationCard } from './components/VerificationCard.jsx';
import { ResultModal } from './components/ResultModal.jsx';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [url, setUrl] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loadingState, setLoadingState] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [storedHash, setStoredHash] = useState('');
  const [isStoring, setIsStoring] = useState(false);

  // Server wallet (hotel's wallet for 0G storage)
  const [serverWallet, setServerWallet] = useState(null);

  // Fetch proof state
  const [fetchHash, setFetchHash] = useState('');
  const [fetchedProof, setFetchedProof] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Load server wallet info on mount
  useEffect(() => {
    fetch(`${API_URL}/wallet`)
      .then(res => res.json())
      .then(data => {
        if (data.address) {
          setServerWallet(data);
        }
      })
      .catch(err => console.log('Server wallet not configured:', err));
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setVerificationResult(null);
    setUrl('');
    setLoadingState(null);
    setStoredHash('');
  };

  // Store raw proof to 0G via backend
  const storeProofTo0G = async () => {
    if (!verificationResult) return;

    setIsStoring(true);

    try {
      const proofArtifact = {
        rawProof: verificationResult.data,
        verified: verificationResult.verified,
        type: verificationResult.type,
        timestamp: Date.now(),
        issuer: 'zkpassport',
      };

      console.log('Sending proof to backend for 0G upload...');

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofArtifact }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      console.log('Upload successful!', data);
      setStoredHash(data.rootHash);
    } catch (error) {
      console.error('Error storing proof:', error);
      alert('Error storing proof: ' + error.message);
    } finally {
      setIsStoring(false);
    }
  };

  // Fetch proof from 0G via backend
  const fetchProofFromStorage = async () => {
    if (!fetchHash) return;

    setIsFetching(true);
    setFetchError('');
    setFetchedProof(null);

    try {
      const response = await fetch(`${API_URL}/proof/${fetchHash}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fetch failed');
      }

      console.log('Fetched proof from 0G:', data);
      setFetchedProof(data);
    } catch (error) {
      console.error('Error fetching proof:', error);
      setFetchError(error.message);
    } finally {
      setIsFetching(false);
    }
  };

  const getAgeVerification = async () => {
    try {
      const zkPassport = new ZKPassport(window.location.origin);

      const queryBuilder = await zkPassport.request({
        name: 'ZK Proof Vault',
        logo: 'https://0g.ai/assets/press/0G-logo-black.png',
        purpose: 'Verify age for proof generation',
        scope: 'adult',
      });

      const { url, onResult, onRequestReceived, onGeneratingProof } = queryBuilder.gte('age', 18).done();

      setUrl(url);
      setVerificationResult(null);
      setLoadingState(null);
      setStoredHash('');

      onRequestReceived(() => setLoadingState('received'));
      onGeneratingProof(() => setLoadingState('generating'));

      onResult(({ verified, result }) => {
        setLoadingState('complete');
        setVerificationResult({ verified, data: result, type: 'age' });
        setShowModal(true);
      });
    } catch (error) {
      console.log('error', error);
      setLoadingState(null);
    }
  };

  const getNationalityVerification = async () => {
    try {
      const zkPassport = new ZKPassport(window.location.origin);

      const queryBuilder = await zkPassport.request({
        name: 'ZK Proof Vault',
        logo: 'https://0g.ai/assets/press/0G-logo-black.png',
        purpose: 'Verify nationality for proof generation',
        scope: 'nationality',
      });

      const { url, onResult, onRequestReceived, onGeneratingProof } = queryBuilder.disclose('nationality').done();

      setUrl(url);
      setVerificationResult(null);
      setLoadingState(null);
      setStoredHash('');

      onRequestReceived(() => setLoadingState('received'));
      onGeneratingProof(() => setLoadingState('generating'));

      onResult(({ verified, result }) => {
        setLoadingState('complete');
        setVerificationResult({ verified, data: result, type: 'nationality' });
        setShowModal(true);
      });
    } catch (error) {
      console.log('error', error);
      setLoadingState(null);
    }
  };

  const getEUResidencyVerification = async () => {
    try {
      const zkPassport = new ZKPassport(window.location.origin);

      const queryBuilder = await zkPassport.request({
        name: 'ZK Proof Vault',
        logo: 'https://0g.ai/assets/press/0G-logo-black.png',
        purpose: 'Verify EU residency status',
        scope: 'eu-resident',
      });

      const { url, onResult, onRequestReceived, onGeneratingProof } = queryBuilder
        .eq('document_type', 'residence_permit')
        .in('issuing_country', EU_COUNTRIES)
        .done();

      setUrl(url);
      setVerificationResult(null);
      setLoadingState(null);
      setStoredHash('');

      onRequestReceived(() => setLoadingState('received'));
      onGeneratingProof(() => setLoadingState('generating'));

      onResult(({ verified, result }) => {
        setLoadingState('complete');
        setVerificationResult({ verified, data: result, type: 'eu-resident' });
        setShowModal(true);
      });
    } catch (error) {
      console.log('error', error);
      setLoadingState(null);
    }
  };

  const getKYCVerification = async () => {
    try {
      const zkPassport = new ZKPassport(window.location.origin);

      const queryBuilder = await zkPassport.request({
        name: 'ZK Proof Vault',
        logo: 'https://0g.ai/assets/press/0G-logo-black.png',
        purpose: 'Complete identity verification',
        scope: 'identity',
      });

      const { url, onResult, onRequestReceived, onGeneratingProof } = queryBuilder
        .disclose('nationality')
        .disclose('birthdate')
        .disclose('fullname')
        .disclose('expiry_date')
        .disclose('document_number')
        .sanctions()
        .done();

      setUrl(url);
      setVerificationResult(null);
      setLoadingState(null);
      setStoredHash('');

      onRequestReceived(() => setLoadingState('received'));
      onGeneratingProof(() => setLoadingState('generating'));

      onResult(({ verified, result }) => {
        setLoadingState('complete');
        setVerificationResult({ verified, data: result, type: 'kyc' });
        setShowModal(true);
      });
    } catch (error) {
      console.log('error', error);
      setLoadingState(null);
    }
  };

  const getPrivateFaceMatchVerification = async () => {
    try {
      const zkPassport = new ZKPassport(window.location.origin);

      const queryBuilder = await zkPassport.request({
        name: 'ZK Proof Vault',
        logo: 'https://0g.ai/assets/press/0G-logo-black.png',
        purpose: 'Biometric verification',
        scope: 'facematch',
      });

      const { url, onResult, onRequestReceived, onGeneratingProof } = queryBuilder.facematch('strict').done();

      setUrl(url);
      setVerificationResult(null);
      setLoadingState(null);
      setStoredHash('');

      onRequestReceived(() => setLoadingState('received'));
      onGeneratingProof(() => setLoadingState('generating'));

      onResult(({ verified, result }) => {
        setLoadingState('complete');
        setVerificationResult({ verified, data: result, type: 'facematch' });
        setShowModal(true);
      });
    } catch (error) {
      console.log('error', error);
      setLoadingState(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-stone-900 selection:bg-stone-200">
      <div className="relative max-w-7xl mx-auto px-6 py-12 md:py-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-6 tracking-tight leading-tight">
            ZK Proof Vault
            <br />
            <span className="text-stone-600 text-3xl md:text-4xl font-light italic">Identity Verification</span>
          </h1>

          <p className="text-stone-700 max-w-lg mx-auto leading-relaxed font-medium text-sm md:text-base tracking-wide">
            Generate zero-knowledge identity proofs using ZKPassport and store them on 0G decentralized storage.
          </p>
        </motion.div>

        {/* Server Wallet Status */}
        {serverWallet && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto mb-12"
          >
            <div className="bg-white p-6 border border-stone-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-stone-500" />
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">0G Storage Wallet</p>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs text-stone-500">Connected</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-stone-600">{serverWallet.address.slice(0, 10)}...{serverWallet.address.slice(-8)}</span>
                  <span className="text-xs text-stone-500">{parseFloat(serverWallet.balance).toFixed(4)} A0GI</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          <VerificationCard
            title="Age Verification"
            description="Prove you are 18+ without revealing your exact birthdate."
            icon={UserCheck}
            onClick={getAgeVerification}
            delay={0}
          />
          <VerificationCard
            title="Nationality Check"
            description="Disclose your nationality for verification purposes."
            icon={Globe}
            onClick={getNationalityVerification}
            delay={0.1}
          />
          <VerificationCard
            title="EU Residency"
            description="Prove EU residency status with residence permit."
            icon={Building2}
            onClick={getEUResidencyVerification}
            delay={0.2}
          />
          <VerificationCard
            title="Full KYC"
            description="Complete identity disclosure with sanctions screening."
            icon={Shield}
            onClick={getKYCVerification}
            delay={0.3}
          />
          <VerificationCard
            title="Biometric Check"
            description="Face match verification for secure identity confirmation."
            icon={ScanFace}
            onClick={getPrivateFaceMatchVerification}
            delay={0.4}
          />
        </div>

        {/* Fetch Proof Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white p-8 border border-stone-200">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-5 h-5 text-stone-500" />
              <h2 className="text-xl font-serif text-stone-900">Retrieve Proof from 0G</h2>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={fetchHash}
                onChange={(e) => setFetchHash(e.target.value)}
                placeholder="Enter root hash (0x...)"
                className="flex-1 p-3 bg-stone-50 border border-stone-200 text-sm font-mono focus:outline-none focus:border-stone-400"
              />
              <button
                onClick={fetchProofFromStorage}
                disabled={isFetching || !fetchHash}
                className="px-6 py-3 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-stone-800 disabled:bg-stone-400 transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                {isFetching ? 'Fetching...' : 'Fetch'}
              </button>
            </div>

            {fetchError && <p className="mt-4 text-sm text-red-600">{fetchError}</p>}

            {fetchedProof && (
              <div className="mt-6 p-4 bg-stone-50 border border-stone-200">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Proof Data from 0G</p>
                <pre className="text-xs font-mono text-stone-700 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(fetchedProof, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-20 text-center text-stone-400 text-sm font-light"
        >
          <p>ZKPassport × 0G • Privacy First Identity Proofs</p>
        </motion.div>
      </div>

      <ResultModal
        show={showModal}
        url={url}
        loadingState={loadingState}
        result={verificationResult}
        onClose={closeModal}
        onStoreProof={storeProofTo0G}
        storedHash={storedHash}
        isStoring={isStoring}
      />
    </div>
  );
}

export default App;
