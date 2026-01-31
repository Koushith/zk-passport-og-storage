import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, ScanLine, ShieldCheck, User, Calendar, Globe, FileText, Upload, Database, Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export function ResultModal({ show, onClose, result, url, loadingState, onStoreProof, storedHash, isStoring }) {
    if (!show && !url && !loadingState) return null;

    const isSuccess = true;

    const copyHash = () => {
        if (storedHash) {
            navigator.clipboard.writeText(storedHash);
        }
    };

    return (
        <AnimatePresence>
            {(show || url) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 10 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-full max-w-xl bg-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 transition-colors z-20"
                        >
                            <X className="w-5 h-5 stroke-[1.5]" />
                        </button>

                        <div className="relative z-10 p-12">
                            {!show ? (
                                // QR Code State
                                <div className="flex flex-col items-center text-center">
                                    <div className="bg-white p-6 border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-6">
                                        <QRCodeSVG value={url} size={260} level="H" fgColor="#000000" bgColor="#FFFFFF" />
                                    </div>

                                    {loadingState ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mb-6"
                                        >
                                            <div className="flex items-center justify-center gap-3 px-6 py-3 bg-stone-900 text-white">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="text-sm font-medium">
                                                    {loadingState === 'received' ? 'Request received...' : 'Generating proof...'}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <div className="mb-6 h-[46px]" />
                                    )}

                                    <h3 className="text-2xl font-serif text-stone-900 mb-3">Scan to Verify</h3>
                                    <p className="text-stone-500 max-w-xs mx-auto text-sm">
                                        Scan the QR code with your ZKPassport app
                                    </p>
                                </div>
                            ) : (
                                // Result State
                                <div className="flex flex-col items-center">
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                        className="w-16 h-16 rounded-full flex items-center justify-center mb-8 border border-[#c5a47e]/30 text-[#c5a47e]"
                                    >
                                        {isSuccess ? <Check className="w-8 h-8 stroke-[1.5]" /> : <X className="w-8 h-8 stroke-[1.5]" />}
                                    </motion.div>

                                    <h2 className="text-3xl font-serif text-stone-900 mb-3">
                                        {isSuccess ? 'Verification Complete' : 'Verification Failed'}
                                    </h2>
                                    <p className="text-stone-600 mb-10 text-center font-normal text-sm tracking-wide">
                                        {isSuccess
                                            ? 'Your identity has been successfully verified.'
                                            : 'Unable to verify identity. Please try again.'}
                                    </p>

                                    {isSuccess && result && (
                                        <div className="w-full border-t border-stone-100 pt-8 space-y-6">
                                            {result.type === 'age' && (
                                                <ResultRow
                                                    icon={Calendar}
                                                    label="Age Requirement"
                                                    value={result.data.age.gte.result ? "Verified 18+" : "Under 18"}
                                                    success={result.data.age.gte.result}
                                                />
                                            )}

                                            {result.type === 'nationality' && (
                                                <ResultRow
                                                    icon={Globe}
                                                    label="Nationality"
                                                    value={result.data.nationality.disclose.result}
                                                    success={true}
                                                />
                                            )}

                                            {result.type === 'eu-resident' && (
                                                <>
                                                    <ResultRow
                                                        icon={FileText}
                                                        label="Document Type"
                                                        value="Residence Permit"
                                                        success={result.data.document_type.eq.result}
                                                    />
                                                    <ResultRow
                                                        icon={Globe}
                                                        label="EU Status"
                                                        value={result.data.issuing_country.in.result ? "Resident" : "Non-Resident"}
                                                        success={result.data.issuing_country.in.result}
                                                    />
                                                </>
                                            )}

                                            {result.type === 'kyc' && (
                                                <>
                                                    <ResultRow icon={User} label="Full Name" value={result.data.fullname.disclose.result} success={true} />
                                                    <ResultRow icon={Globe} label="Nationality" value={result.data.nationality.disclose.result} success={true} />
                                                    <ResultRow icon={Calendar} label="Date of Birth" value={new Date(result.data.birthdate.disclose.result).toLocaleDateString()} success={true} />
                                                    <ResultRow icon={FileText} label="Document No." value={result.data.document_number.disclose.result} success={true} />
                                                    <ResultRow icon={Calendar} label="Expiry Date" value={new Date(result.data.expiry_date.disclose.result).toLocaleDateString()} success={true} />
                                                    <ResultRow icon={ShieldCheck} label="Sanctions" value={result.data.sanctions.passed ? "Cleared" : "Flagged"} success={result.data.sanctions.passed} />

                                                    <div className="mt-6 pt-6 border-t border-stone-100">
                                                        <p className="text-[10px] font-bold text-stone-500 mb-4 uppercase tracking-widest">Sanctions Screening</p>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {Object.entries(result.data.sanctions.countries).map(([country, data]) => (
                                                                <SanctionItem key={country} country={country} passed={data.passed} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {result.type === 'facematch' && (
                                                <ResultRow
                                                    icon={ScanLine}
                                                    label="Biometric Match"
                                                    value={result.data.facematch.passed ? "Confirmed" : "Failed"}
                                                    success={result.data.facematch.passed}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {/* 0G Storage Section */}
                                    {isSuccess && result && (
                                        <div className="w-full mt-8 pt-8 border-t border-stone-100">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Database className="w-4 h-4 text-stone-500" />
                                                <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">0G Decentralized Storage</p>
                                            </div>

                                            {storedHash ? (
                                                <div className="bg-green-50 border border-green-200 p-4">
                                                    <p className="text-xs text-green-800 font-medium mb-2">Proof Stored on 0G Network</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[10px] font-mono text-green-700 break-all flex-1">{storedHash}</p>
                                                        <button onClick={copyHash} className="p-1 hover:bg-green-100 rounded">
                                                            <Copy className="w-3 h-3 text-green-700" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={onStoreProof}
                                                    disabled={isStoring}
                                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                                >
                                                    {isStoring ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Storing to 0G...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-4 h-4" />
                                                            Store Proof to 0G
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        onClick={onClose}
                                        className="mt-8 px-8 py-4 bg-[#1a1a1a] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#c5a47e] transition-colors w-full duration-500"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function ResultRow({ icon: Icon, label, value, success }) {
    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
                <div className="text-stone-400">
                    <Icon className="w-4 h-4 stroke-[1.5]" />
                </div>
                <span className="text-stone-600 font-normal text-sm tracking-wide">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`font-medium text-sm ${success ? 'text-stone-900' : 'text-red-900'}`}>
                    {value}
                </span>
            </div>
        </div>
    );
}

function SanctionItem({ country, passed }) {
    return (
        <div className="flex items-center justify-between p-3 bg-[#faf9f6]">
            <span className="text-xs font-medium text-stone-600">{country}</span>
            {passed ? (
                <span className="text-[10px] font-bold text-[#c5a47e] tracking-wider">PASS</span>
            ) : (
                <span className="text-[10px] font-bold text-red-900 tracking-wider">FAIL</span>
            )}
        </div>
    );
}
