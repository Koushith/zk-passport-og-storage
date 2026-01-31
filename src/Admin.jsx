import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Search, Shield, CheckCircle, XCircle, Link, AlertTriangle, Loader2, ExternalLink, Clock, Building2, FileText, Copy, Check } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const STORAGE_EXPLORER = 'https://storagescan.0g.ai/file';
const CHAIN_EXPLORER = 'https://chainscan.0g.ai';

function Admin() {
  const [fetchHash, setFetchHash] = useState('');
  const [fetchedProof, setFetchedProof] = useState(null);
  const [onChainStatus, setOnChainStatus] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [revokeTxHash, setRevokeTxHash] = useState('');
  const [copied, setCopied] = useState(false);

  const copyHash = () => {
    navigator.clipboard.writeText(fetchHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchProofFromStorage = async () => {
    if (!fetchHash) return;

    setIsFetching(true);
    setFetchError('');
    setFetchedProof(null);
    setOnChainStatus(null);
    setRevokeTxHash('');

    try {
      const [proofRes, registryRes] = await Promise.all([
        fetch(`${API_URL}/proof/${fetchHash}`),
        fetch(`${API_URL}/registry/${fetchHash}`),
      ]);

      const proofData = await proofRes.json();
      const registryData = await registryRes.json();

      if (!proofRes.ok) {
        throw new Error(proofData.error || 'Proof not found');
      }

      setFetchedProof(proofData);
      if (registryRes.ok) {
        setOnChainStatus(registryData);
      }
    } catch (error) {
      setFetchError(error.message);
    } finally {
      setIsFetching(false);
    }
  };

  const revokeProof = async () => {
    if (!fetchHash || !confirm('Revoke this proof? This marks it as invalid on-chain and cannot be undone.')) return;

    setIsRevoking(true);
    setRevokeTxHash('');
    try {
      const response = await fetch(`${API_URL}/registry/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofHash: fetchHash }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Revoke failed');

      setRevokeTxHash(data.txHash);

      const registryRes = await fetch(`${API_URL}/registry/${fetchHash}`);
      const registryData = await registryRes.json();
      if (registryRes.ok) setOnChainStatus(registryData);
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setIsRevoking(false);
    }
  };

  const getVerificationType = (type) => {
    const types = {
      'age': { label: 'Age Verification', color: 'text-emerald-600' },
      'nationality': { label: 'Nationality', color: 'text-blue-600' },
      'eu-resident': { label: 'EU Residency', color: 'text-purple-600' },
      'kyc': { label: 'Full Identity (KYC)', color: 'text-amber-600' },
      'facematch': { label: 'Biometric Match', color: 'text-pink-600' },
    };
    return types[type] || { label: type || 'Unknown', color: 'text-stone-600' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-stone-800">Staff Portal</h1>
                <p className="text-[10px] text-stone-400">The Grand Hotel</p>
              </div>
            </div>
            <a
              href="/"
              className="text-xs text-stone-400 hover:text-amber-600 transition-colors"
            >
              ← Guest Check-In
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <label className="block text-xs text-stone-500 mb-2 uppercase tracking-wider font-medium">
            Verify Guest Proof
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={fetchHash}
              onChange={(e) => setFetchHash(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchProofFromStorage()}
              placeholder="Enter proof hash (0x...)"
              className="flex-1 px-4 py-3 bg-white border border-stone-200 text-sm font-mono text-stone-800 placeholder-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all rounded-lg shadow-sm"
            />
            <button
              onClick={fetchProofFromStorage}
              disabled={isFetching || !fetchHash}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-stone-200 disabled:text-stone-400 text-white text-sm font-semibold transition-colors rounded-lg shadow-sm flex items-center gap-2"
            >
              {isFetching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Verify
            </button>
          </div>

          <AnimatePresence>
            {fetchError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm"
              >
                <XCircle className="w-4 h-4 flex-shrink-0" />
                {fetchError}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {fetchedProof ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Proof Hash Header */}
              <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      onChainStatus?.onChain?.valid === false
                        ? 'bg-red-100'
                        : onChainStatus?.onChain?.exists
                          ? 'bg-emerald-100'
                          : 'bg-stone-100'
                    }`}>
                      {onChainStatus?.onChain?.valid === false ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : onChainStatus?.onChain?.exists ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-stone-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-0.5">Proof Hash</p>
                      <p className="text-sm font-mono text-stone-700">{fetchHash.slice(0, 20)}...{fetchHash.slice(-8)}</p>
                    </div>
                  </div>
                  <button
                    onClick={copyHash}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-stone-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* On-Chain Status */}
                <div className={`rounded-xl p-5 border shadow-sm ${
                  onChainStatus?.onChain?.valid === false
                    ? 'bg-red-50 border-red-200'
                    : onChainStatus?.onChain?.exists
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-white border-stone-200'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Link className="w-4 h-4 text-stone-400" />
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">On-Chain</span>
                  </div>

                  {onChainStatus?.onChain?.exists ? (
                    <div className="space-y-3">
                      <div className={`text-2xl font-bold ${
                        onChainStatus.onChain.valid ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {onChainStatus.onChain.valid ? 'Valid' : 'Revoked'}
                      </div>
                      <div className="space-y-1 text-xs text-stone-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          Registered {new Date(onChainStatus.onChain.registeredAt).toLocaleDateString()}
                        </div>
                        {onChainStatus.onChain.revokedAt && (
                          <div className="flex items-center gap-1.5 text-red-500">
                            <AlertTriangle className="w-3 h-3" />
                            Revoked {new Date(onChainStatus.onChain.revokedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {onChainStatus.onChain.valid && (
                        <button
                          onClick={revokeProof}
                          disabled={isRevoking}
                          className="w-full mt-2 py-2 text-xs font-medium bg-red-100 hover:bg-red-200 border border-red-200 text-red-600 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          {isRevoking ? <Loader2 className="w-3 h-3 animate-spin" /> : <AlertTriangle className="w-3 h-3" />}
                          {isRevoking ? 'Revoking...' : 'Revoke Proof'}
                        </button>
                      )}

                      {revokeTxHash && (
                        <a
                          href={`${CHAIN_EXPLORER}/tx/${revokeTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Transaction
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-stone-400 text-sm">Not registered</div>
                  )}
                </div>

                {/* Signature Status */}
                <div className={`rounded-xl p-5 border shadow-sm ${
                  fetchedProof.hotelAttestation?.signatureValid
                    ? 'bg-emerald-50 border-emerald-200'
                    : fetchedProof.hotelAttestation
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-stone-200'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-4 h-4 text-stone-400" />
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">Signature</span>
                  </div>

                  {fetchedProof.hotelAttestation ? (
                    <div className="space-y-3">
                      <div className={`text-2xl font-bold ${
                        fetchedProof.hotelAttestation.signatureValid ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {fetchedProof.hotelAttestation.signatureValid ? 'Verified' : 'Invalid'}
                      </div>
                      <p className="text-xs text-stone-500 font-mono truncate">
                        {fetchedProof.hotelAttestation.signerAddress}
                      </p>
                    </div>
                  ) : (
                    <div className="text-stone-400 text-sm">No attestation</div>
                  )}
                </div>
              </div>

              {/* Proof Details */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <FileText className="w-4 h-4 text-stone-400" />
                  <span className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">Proof Details</span>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Type</p>
                    <p className={`text-sm font-semibold ${getVerificationType(fetchedProof.proofData?.type).color}`}>
                      {getVerificationType(fetchedProof.proofData?.type).label}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">ZK Verified</p>
                    <p className={`text-sm font-semibold ${fetchedProof.proofData?.verified ? 'text-emerald-600' : 'text-red-600'}`}>
                      {fetchedProof.proofData?.verified ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Source</p>
                    <p className="text-sm font-medium text-stone-700">{fetchedProof.source}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Issuer</p>
                    <p className="text-sm font-medium text-stone-700">{fetchedProof.proofData?.issuer || 'ZKPassport'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Timestamp</p>
                    <p className="text-sm font-medium text-stone-700">
                      {fetchedProof.proofData?.timestamp
                        ? new Date(fetchedProof.proofData.timestamp).toLocaleString()
                        : '—'}
                    </p>
                  </div>
                  {fetchedProof.proofData?.attestation?.hotelId && (
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Hotel</p>
                      <p className="text-sm font-medium text-stone-700">{fetchedProof.proofData.attestation.hotelId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Explorer Links */}
              <div className="grid grid-cols-2 gap-4">
                <a
                  href={`${STORAGE_EXPLORER}/${fetchHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-white border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Database className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-700">0G Storage</p>
                      <p className="text-xs text-stone-400">View raw data</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-stone-300 group-hover:text-emerald-500" />
                </a>
                <a
                  href={`${CHAIN_EXPLORER}/address/${onChainStatus?.contractAddress}#readContract`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-white border border-stone-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Link className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-700">0G Chain</p>
                      <p className="text-xs text-stone-400">View contract</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-stone-300 group-hover:text-blue-500" />
                </a>
              </div>

              {/* Raw Data */}
              <details className="bg-white border border-stone-200 rounded-xl shadow-sm">
                <summary className="px-5 py-4 text-xs text-stone-500 hover:text-stone-700 cursor-pointer flex items-center gap-2 font-medium">
                  <Database className="w-3 h-3" />
                  Raw Proof Data
                </summary>
                <pre className="px-5 pb-5 text-xs font-mono text-stone-500 overflow-x-auto max-h-48 overflow-y-auto border-t border-stone-100 pt-4">
                  {JSON.stringify(fetchedProof.proofData?.rawProof, null, 2)}
                </pre>
              </details>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-stone-300" />
              </div>
              <p className="text-stone-400 text-sm">Enter a proof hash to verify</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-stone-200 bg-white/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <p className="text-[10px] text-stone-400">
            Contract: <span className="font-mono text-stone-500">{onChainStatus?.contractAddress || '0x7A78...DA07'}</span>
          </p>
          <p className="text-[10px] text-stone-400">
            ZKPassport × 0G Network
          </p>
        </div>
      </div>
    </div>
  );
}

export default Admin;
