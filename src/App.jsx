import { useState } from 'react';
import { ZKPassport, EU_COUNTRIES } from '@zkpassport/sdk';
import { motion } from 'framer-motion';
import { Shield, Globe, UserCheck, ScanFace, Building2, Sparkles } from 'lucide-react';
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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const closeModal = () => {
    setShowModal(false);
    setVerificationResult(null);
    setUrl('');
    setLoadingState(null);
    setStoredHash('');
  };

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

      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofArtifact }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setStoredHash(data.rootHash);
    } catch (error) {
      console.error('Error storing proof:', error);
      alert('Error storing proof: ' + error.message);
    } finally {
      setIsStoring(false);
    }
  };

  const getAgeVerification = async () => {
    try {
      const zkPassport = new ZKPassport(window.location.origin);
      const queryBuilder = await zkPassport.request({
        name: 'The Grand Hotel',
        logo: 'https://0g.ai/assets/press/0G-logo-black.png',
        purpose: 'Age verification for check-in',
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
        name: 'The Grand Hotel',
        logo: 'https://0g.ai/assets/press/0G-logo-black.png',
        purpose: 'Nationality verification for check-in',
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
        name: 'The Grand Hotel',
        logo: 'https://0g.ai/assets/press/0G-logo-black.png',
        purpose: 'EU residency verification',
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
        name: 'The Grand Hotel',
        logo: 'https://0g.ai/assets/press/0G-logo-black.png',
        purpose: 'Full identity verification',
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
        name: 'The Grand Hotel',
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
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      {/* Elegant Top Bar */}
      <div className="bg-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span className="text-sm tracking-wide">{today}</span>
          </div>
          <a href="/admin" className="text-xs text-stone-400 hover:text-white transition-colors tracking-widest uppercase">
            Staff Portal
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Grand Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-block mb-6">
            <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mb-4" />
            <p className="text-xs text-stone-400 uppercase tracking-[0.4em] font-light">Welcome to</p>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif text-stone-800 mb-4 tracking-tight">
            The Grand Hotel
          </h1>

          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-12 h-[1px] bg-amber-400" />
            <p className="text-lg text-stone-500 font-light italic tracking-wide">Self Check-In</p>
            <div className="w-12 h-[1px] bg-amber-400" />
          </div>

          <p className="text-stone-500 max-w-lg mx-auto leading-relaxed">
            Experience seamless, privacy-first identity verification.
            Your personal data never leaves your device.
          </p>
        </motion.div>

        {/* Verification Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
        >
          <VerificationCard
            title="Age Verification"
            description="Confirm you are 18 or older without revealing your birthdate"
            icon={UserCheck}
            onClick={getAgeVerification}
            delay={0}
          />
          <VerificationCard
            title="Nationality"
            description="Verify your nationality for international travel compliance"
            icon={Globe}
            onClick={getNationalityVerification}
            delay={0.1}
          />
          <VerificationCard
            title="EU Residency"
            description="Prove EU residency status with your residence permit"
            icon={Building2}
            onClick={getEUResidencyVerification}
            delay={0.2}
          />
          <VerificationCard
            title="Full Identity"
            description="Complete identity verification with sanctions screening"
            icon={Shield}
            onClick={getKYCVerification}
            delay={0.3}
          />
          <VerificationCard
            title="Biometric"
            description="Secure face match verification for enhanced security"
            icon={ScanFace}
            onClick={getPrivateFaceMatchVerification}
            delay={0.4}
          />
        </motion.div>

        {/* Elegant Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center pt-12 border-t border-stone-200"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-[1px] bg-stone-300" />
            <Shield className="w-4 h-4 text-stone-400" />
            <div className="w-8 h-[1px] bg-stone-300" />
          </div>
          <p className="text-stone-400 text-sm mb-1">
            Privacy-First Identity Verification
          </p>
          <p className="text-stone-300 text-xs tracking-wide">
            Powered by ZKPassport × 0G Decentralized Storage
          </p>
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
