import React from 'react';
import { Trash2 } from 'lucide-react';

interface ClearCartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const ClearCartModal: React.FC<ClearCartModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[10007] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-slide-up ring-1 ring-black/5" onClick={e => e.stopPropagation()}>
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={32} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-extrabold text-gray-900 mb-2">Clear entire cart?</h3>
                    <p className="text-gray-500 text-sm font-medium mb-6">
                        Are you sure you want to remove all items from your cart? This action cannot be undone.
                    </p>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => { onConfirm(); onClose(); }}
                            className="flex-1 py-3 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all"
                        >
                            Yes, Clear All
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClearCartModal;