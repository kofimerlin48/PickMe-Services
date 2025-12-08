import React, { useState, useEffect } from 'react';
import { X, CreditCard, Lock, MapPin, Phone, User, CheckCircle, ArrowRight, Wallet, Receipt } from 'lucide-react';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    subtotal: number;
    deliveryFee: number;
    serviceCharge: number;
    onConfirm: (details: CheckoutDetails) => void;
    loading: boolean;
}

export interface CheckoutDetails {
    name: string;
    momoNumber: string;
    network: string; // 'mtn-gh', 'vodafone-gh', 'tigo-gh'
    deliveryAddress: string;
    deliveryContact: string;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
    isOpen, onClose, subtotal, deliveryFee, serviceCharge, onConfirm, loading 
}) => {
    const [step, setStep] = useState<1 | 2>(1);
    
    // Form State
    const [name, setName] = useState('');
    const [momoNumber, setMomoNumber] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [deliveryContact, setDeliveryContact] = useState('');
    
    // Derived State
    const [network, setNetwork] = useState<string>('');
    const [networkName, setNetworkName] = useState<string>('');

    const grandTotal = subtotal + deliveryFee + serviceCharge;

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            // Optional: Don't clear fields to allow user to fix mistakes if payment fails, 
            // or clear them if you want a fresh start. Keeping them for better UX.
        }
    }, [isOpen]);

    // Network Detection Logic
    useEffect(() => {
        const cleanNum = momoNumber.replace(/\D/g, '');
        if (cleanNum.length >= 3) {
            const prefix = cleanNum.substring(0, 3);
            // Ghana Network Prefixes
            const mtnPrefixes = ['024', '054', '055', '059', '025', '053'];
            const telecelPrefixes = ['020', '050']; // Formerly Vodafone
            const atPrefixes = ['027', '057', '026', '056']; // AirtelTigo

            if (mtnPrefixes.includes(prefix)) {
                setNetwork('mtn-gh');
                setNetworkName('MTN MoMo');
            } else if (telecelPrefixes.includes(prefix)) {
                setNetwork('vodafone-gh');
                setNetworkName('Telecel Cash');
            } else if (atPrefixes.includes(prefix)) {
                setNetwork('tigo-gh');
                setNetworkName('AT Money');
            } else {
                setNetwork('');
                setNetworkName('');
            }
        } else {
            setNetwork('');
            setNetworkName('');
        }
    }, [momoNumber]);

    const handleContinue = () => {
        setStep(2);
    };

    const handlePayment = () => {
        onConfirm({
            name,
            momoNumber,
            network,
            deliveryAddress,
            deliveryContact
        });
    };

    const isStep1Valid = () => {
        return name.length > 2 && 
               momoNumber.length >= 10 && 
               network !== '' && 
               deliveryAddress.length > 3 && 
               deliveryContact.length >= 10;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[10006] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-up ring-1 ring-black/5 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-white p-5 border-b border-gray-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2 text-primary">
                        {step === 1 ? <User size={24} /> : <Receipt size={24} />}
                        <h3 className="font-extrabold text-xl text-gray-900">
                            {step === 1 ? 'Delivery Details' : 'Review & Pay'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-900 bg-gray-50">
                        <X size={20} />
                    </button>
                </div>
                
                {/* Content */}
                <div className="p-6 space-y-6 bg-white overflow-y-auto custom-scrollbar">
                    
                    {step === 1 && (
                        <div className="space-y-5 animate-fade-in">
                            {/* Personal Info */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payer Information</label>
                                <div className="space-y-4">
                                    <input 
                                        type="text" 
                                        value={name} 
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 font-bold placeholder-gray-400 focus:border-primary focus:ring-0 outline-none transition-all"
                                        placeholder="Full Name"
                                    />
                                    <div className="relative">
                                        <input 
                                            type="tel" 
                                            inputMode="numeric"
                                            value={momoNumber} 
                                            onChange={e => setMomoNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                            className={`w-full bg-gray-50 border rounded-xl px-4 py-3.5 text-gray-900 font-bold placeholder-gray-400 focus:ring-0 outline-none transition-all ${network ? 'border-green-500 ring-1 ring-green-100' : 'border-gray-200 focus:border-primary'}`}
                                            placeholder="Mobile Money Number (e.g. 055...)"
                                            maxLength={10}
                                        />
                                        {networkName && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">
                                                <Wallet size={12} className="text-green-600"/>
                                                <span className="text-xs font-bold text-green-700">{networkName}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Info */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Delivery Location</label>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                                        <input 
                                            type="text" 
                                            value={deliveryAddress} 
                                            onChange={e => setDeliveryAddress(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3.5 text-gray-900 font-medium placeholder-gray-400 focus:border-primary focus:ring-0 outline-none transition-all"
                                            placeholder="Delivery Address (e.g. House No, Landmark)"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                                        <input 
                                            type="tel" 
                                            inputMode="numeric"
                                            value={deliveryContact} 
                                            onChange={e => setDeliveryContact(e.target.value.replace(/[^0-9]/g, ''))}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3.5 text-gray-900 font-bold placeholder-gray-400 focus:border-primary focus:ring-0 outline-none transition-all"
                                            placeholder="Contact for Delivery"
                                            maxLength={10}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Summary Card */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                <div className="flex justify-between text-gray-600 text-sm font-medium">
                                    <span>Meal Total</span>
                                    <span>GHS {subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 text-sm font-medium">
                                    <span>Delivery Fee</span>
                                    <span>GHS {deliveryFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 text-sm font-medium">
                                    <span>Service Charge</span>
                                    <span>GHS {serviceCharge.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                    <span className="font-bold text-gray-900">Total Amount</span>
                                    <span className="text-2xl font-extrabold text-primary">GHS {grandTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Info Confirmation */}
                            <div className="text-xs text-gray-500 space-y-1 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <p className="flex gap-2"><span className="font-bold text-blue-800 w-16">Deliver to:</span> {deliveryAddress}</p>
                                <p className="flex gap-2"><span className="font-bold text-blue-800 w-16">Contact:</span> {deliveryContact}</p>
                                <p className="flex gap-2"><span className="font-bold text-blue-800 w-16">Payer:</span> {networkName} ({momoNumber})</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-gray-100 bg-white shrink-0">
                    {step === 1 ? (
                        <button 
                            onClick={handleContinue}
                            disabled={!isStep1Valid()}
                            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-black active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            Continue <ArrowRight size={18} />
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setStep(1)}
                                disabled={loading}
                                className="px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handlePayment}
                                disabled={loading}
                                className="flex-1 bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <Lock size={18} />
                                        Make Payment
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;