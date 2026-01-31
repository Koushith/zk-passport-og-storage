import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Search, Shield, CheckCircle, XCircle } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

function Admin() {
  const [fetchHash, setFetchHash] = useState('');
  const [fetchedProof, setFetchedProof] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

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

      setFetchedProof(data);
    } catch (error) {
      console.error('Error fetching proof:', error);
      setFetchError(error.message);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-stone-400" />
            <h1 className="text-3xl font-serif">Admin Panel</h1>
          </div>
          <p className="text-stone-400 text-sm">Verify guest proofs from 0G storage</p>
        </motion.div>

        {/* Verify Proof Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-stone-800 border border-stone-700 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-stone-400" />
            <h2 className="text-xl font-medium">Verify Proof</h2>
          </div>

          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={fetchHash}
              onChange={(e) => setFetchHash(e.target.value)}
              placeholder="Enter proof hash (0x...)"
              className="flex-1 p-3 bg-stone-900 border border-stone-700 text-sm font-mono text-white placeholder-stone-500 focus:outline-none focus:border-stone-500"
            />
            <button
              onClick={fetchProofFromStorage}
              disabled={isFetching || !fetchHash}
              className="px-6 py-3 bg-white text-stone-900 text-xs font-bold uppercase tracking-widest hover:bg-stone-100 disabled:bg-stone-600 disabled:text-stone-400 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {isFetching ? 'Verifying...' : 'Verify'}
            </button>
          </div>

          {fetchError && (
            <div className="flex items-center gap-2 text-red-400 mb-4">
              <XCircle className="w-4 h-4" />
              <p className="text-sm">{fetchError}</p>
            </div>
          )}

          {fetchedProof && (
            <div className="space-y-4">
              {/* Signature Verification Status */}
              {fetchedProof.hotelAttestation ? (
                fetchedProof.hotelAttestation.signatureValid ? (
                  <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <span className="font-medium text-green-400">Hotel Signature Verified</span>
                      <p className="text-xs text-green-500/70 mt-1">
                        Signed by: {fetchedProof.hotelAttestation.signerAddress.slice(0, 10)}...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700">
                    <XCircle className="w-5 h-5 text-red-400" />
                    <div>
                      <span className="font-medium text-red-400">Invalid Signature - Possible Tampering</span>
                      <p className="text-xs text-red-500/70 mt-1">
                        {fetchedProof.hotelAttestation.verificationError || 'Signature does not match'}
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-2 text-yellow-400">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">No Hotel Attestation (Legacy Proof)</span>
                </div>
              )}

              {/* Proof Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-stone-900 border border-stone-700">
                <div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Type</p>
                  <p className="text-sm font-mono">{fetchedProof.proofData?.type || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Verified</p>
                  <p className="text-sm font-mono">{fetchedProof.proofData?.verified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Issuer</p>
                  <p className="text-sm font-mono">{fetchedProof.proofData?.issuer || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Timestamp</p>
                  <p className="text-sm font-mono">
                    {fetchedProof.proofData?.timestamp
                      ? new Date(fetchedProof.proofData.timestamp).toLocaleString()
                      : 'Unknown'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Source</p>
                  <p className="text-sm font-mono">{fetchedProof.source}</p>
                </div>
                {fetchedProof.proofData?.attestation && (
                  <>
                    <div>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Hotel ID</p>
                      <p className="text-sm font-mono">{fetchedProof.proofData.attestation.hotelId}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Verified At</p>
                      <p className="text-sm font-mono">
                        {new Date(fetchedProof.proofData.attestation.verifiedAt).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Raw Data */}
              <details className="group">
                <summary className="cursor-pointer text-xs text-stone-500 hover:text-stone-300">
                  View Raw Proof Data
                </summary>
                <pre className="mt-2 p-4 bg-stone-900 border border-stone-700 text-xs font-mono text-stone-400 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {JSON.stringify(fetchedProof.proofData?.rawProof, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </motion.div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <a href="/" className="text-stone-500 text-sm hover:text-white transition-colors">
            ← Back to Guest Check-In
          </a>
        </div>
      </div>
    </div>
  );
}

export default Admin;
