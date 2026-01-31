import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function VerificationCard({ title, description, icon: Icon, onClick, delay }) {
    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
            onClick={onClick}
            className="group relative w-full text-left bg-white p-8 shadow-sm hover:shadow-lg transition-all duration-500 border border-stone-100 hover:border-amber-200"
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-300 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

            <div className="flex flex-col h-full min-h-[180px]">
                <div className="flex items-start justify-between mb-6">
                    <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-amber-50 transition-colors duration-500">
                        <Icon className="w-5 h-5 text-stone-400 group-hover:text-amber-600 transition-colors duration-500" />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 group-hover:translate-x-0">
                        <ArrowRight className="w-5 h-5 text-amber-500" />
                    </div>
                </div>

                <div className="mt-auto">
                    <h3 className="text-xl font-serif text-stone-800 mb-2">{title}</h3>
                    <p className="text-sm text-stone-500 leading-relaxed">{description}</p>
                </div>
            </div>
        </motion.button>
    );
}
