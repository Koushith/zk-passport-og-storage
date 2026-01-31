import { useState } from 'react';
import { ZKPassport, EU_COUNTRIES } from '@zkpassport/sdk';
import { motion } from 'framer-motion';
import { Shield, Globe, UserCheck, ScanFace, Building2 } from 'lucide-react';
import { VerificationCard } from './components/VerificationCard.jsx';
import { ResultModal } from './components/ResultModal.jsx';

function App() {
  const [url, setUrl] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [verificationType, setVerificationType] = useState(null);
  const [loadingState, setLoadingState] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const closeModal = () => {
    setShowModal(false);
    setVerificationResult(null);
    setUrl('');
    setLoadingState(null);
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

      console.log('url', url);

      setUrl(url);
      setVerificationType('age');
      setVerificationResult(null);
      setLoadingState(null);

      onRequestReceived(() => {
        console.log('Request received');
        setLoadingState('received');
      });

      onGeneratingProof(() => {
        console.log('Generating proof');
        setLoadingState('generating');
      });

      onResult(({ verified, result }) => {
        console.log('verified', verified);
        console.log('result', result);

        setLoadingState('complete');
        setVerificationResult({
          verified,
          data: result,
          type: 'age',
        });
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

      console.log('zk-p origin', zkPassport);

      const queryBuilder = await zkPassport.request({
        name: 'ZK Proof Vault',
        logo: 'https://0g.ai/assets/press/0G-logo-black.png',
        purpose: 'Verify nationality for proof generation',
        scope: 'nationality',
      });

      const { url, onResult, onRequestReceived, onGeneratingProof } = queryBuilder.disclose('nationality').done();

      setUrl(url);
      setVerificationType('nationality');
      setVerificationResult(null);
      setLoadingState(null);

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
      setVerificationType('eu-resident');
      setVerificationResult(null);
      setLoadingState(null);

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
      setVerificationType('kyc');
      setVerificationResult(null);
      setLoadingState(null);

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
      setVerificationType('facematch');
      setVerificationResult(null);
      setLoadingState(null);

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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-24">
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-6 tracking-tight leading-tight">
            ZK Proof Vault
            <br />
            <span className="text-stone-600 text-3xl md:text-4xl font-light italic">Identity Verification</span>
          </h1>

          <p className="text-stone-700 max-w-lg mx-auto leading-relaxed font-medium text-sm md:text-base tracking-wide">
            Generate zero-knowledge identity proofs using ZKPassport. Your data stays private — only cryptographic
            proofs are created.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
      />
    </div>
  );
}

export default App;
