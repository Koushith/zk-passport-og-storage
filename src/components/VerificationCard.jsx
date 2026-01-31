import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function VerificationCard({ title, description, icon: Icon, onClick, delay }) {
    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClick}
            className="group relative w-full text-left bg-white p-8 hover:bg-[#faf9f6] transition-all duration-500 border-b border-stone-200 hover:border-[#c5a47e]"
        >
            <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-8">
                    <div className="text-stone-500 group-hover:text-[#c5a47e] transition-colors duration-500">
                        <Icon className="w-6 h-6 stroke-[1.5]" />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                        <ArrowRight className="w-5 h-5 text-[#c5a47e]" />
                    </div>
                </div>

                <div className="mt-auto">
                    <h3 className="text-lg font-serif text-stone-900 mb-3 tracking-wide">{title}</h3>
                    <p className="text-sm text-stone-600 leading-relaxed font-normal tracking-wide">{description}</p>
                </div>
            </div>
        </motion.button>
    );
}
