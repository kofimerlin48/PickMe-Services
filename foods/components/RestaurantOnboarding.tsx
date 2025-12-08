
import React, { useState, useRef, useEffect } from 'react';
import { X, ChefHat, Upload, Store, Plus, Trash2, ArrowLeft, Loader2, Lock, CheckCircle, RefreshCw, Wallet, Edit2 } from 'lucide-react';
import { saveRestaurantRequest } from '../services/firebaseService';

interface RestaurantOnboardingProps {
    isOpen: boolean;
    onClose: () => void;
}

type PlanType = '1_MONTH' | '3_MONTHS' | '6_MONTHS' | '1_YEAR';

interface MenuItemDraft {
    id: string;
    name: string;
    price: string;
    image: string;
}

const SUBSCRIPTION_PLANS = [
    { id: '1_MONTH', label: '1 Month', price: 50, desc: 'Starter Plan' },
    { id: '3_MONTHS', label: '3 Months', price: 100, desc: 'Save 33%' },
    { id: '6_MONTHS', label: '6 Months', price: 150, desc: 'Most Popular' },
    { id: '1_YEAR', label: '1 Year', price: 200, desc: 'Best Value' },
];

const RestaurantOnboarding: React.FC<RestaurantOnboardingProps> = ({ isOpen, onClose }) => {
    const [mode, setMode] = useState<'SELECT' | 'REGISTER' | 'RENEW' | 'SUCCESS'>('SELECT');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [isRenewalEdit, setIsRenewalEdit] = useState(false);
    
    // Form States
    const [restaurantName, setRestaurantName] = useState('');
    const [ownerPhone, setOwnerPhone] = useState(''); 
    const [restaurantImage, setRestaurantImage] = useState(''); 
    const [restaurantId, setRestaurantId] = useState(''); 
    
    // Network Detect
    const [networkName, setNetworkName] = useState('');

    const [menuItems, setMenuItems] = useState<MenuItemDraft[]>([]);
    const [newItem, setNewItem] = useState<MenuItemDraft>({ id: '', name: '', price: '', image: '' });
    const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

    const restImageInputRef = useRef<HTMLInputElement>(null);
    const menuImageInputRef = useRef<HTMLInputElement>(null);

    // Auto Detect Network
    useEffect(() => {
        const clean = ownerPhone.replace(/\D/g, '');
        if (clean.length >= 3) {
            const prefix = clean.substring(0, 3);
            if (['024', '054', '055', '059', '025', '053'].includes(prefix)) setNetworkName('MTN MoMo');
            else if (['020', '050'].includes(prefix)) setNetworkName('Telecel Cash');
            else if (['027', '057', '026', '056'].includes(prefix)) setNetworkName('AT Money');
            else setNetworkName('');
        } else {
            setNetworkName('');
        }
    }, [ownerPhone]);

    const resetForm = () => {
        setMode('SELECT');
        setStep(1);
        setLoading(false);
        setIsRenewalEdit(false);
        setRestaurantName('');
        setOwnerPhone('');
        setRestaurantImage('');
        setRestaurantId('');
        setNetworkName('');
        setMenuItems([]);
        resetNewItem();
        setSelectedPlan(null);
    };

    const resetNewItem = () => {
        setNewItem({ id: '', name: '', price: '', image: '' });
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Compress Image Logic to fit Firestore 1MB limit
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 600; 
                    const scaleSize = MAX_WIDTH / img.width;
                    canvas.width = MAX_WIDTH;
                    canvas.height = img.height * scaleSize;

                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                    // Compress to JPEG at 0.7 quality
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
            };
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            const compressed = await compressImage(file);
            setter(compressed);
        }
    };

    const handleAddMenuItem = () => {
        if (!newItem.name || !newItem.price) return;
        if (newItem.id) {
            // Update existing
            setMenuItems(prev => prev.map(item => item.id === newItem.id ? newItem : item));
        } else {
            // Add new
            setMenuItems([...menuItems, { ...newItem, id: Date.now().toString() }]);
        }
        resetNewItem();
        if (menuImageInputRef.current) menuImageInputRef.current.value = '';
    };

    const handleEditMenuItem = (item: MenuItemDraft) => {
        setNewItem(item);
    };

    const handleRemoveMenuItem = (id: string) => {
        setMenuItems(prev => prev.filter(i => i.id !== id));
    };

    const handleSimulateFetch = () => {
        if (!restaurantId) return;
        setLoading(true);
        setTimeout(() => {
            // Simulated fetch data with menu
            setRestaurantName("Mama's Pot");
            setOwnerPhone("0551234567");
            setRestaurantImage("https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80");
            setMenuItems([
                { id: 'm1', name: 'Jollof Rice', price: '45', image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f1a?auto=format&fit=crop&w=800&q=80' },
                { id: 'm2', name: 'Fried Rice', price: '40', image: '' }
            ]);
            setLoading(false);
            setStep(2); // Go to edit details step
        }, 1000);
    };

    const startFullEdit = () => {
        setIsRenewalEdit(true);
        setMode('REGISTER'); // Reuse register UI
        setStep(1); // Start from beginning
    };

    const detectNetworkCode = (phone: string) => {
        const clean = phone.replace(/\D/g, '');
        const prefix = clean.substring(0, 3);
        if (['024', '054', '055', '059', '025', '053'].includes(prefix)) return 'mtn-gh';
        if (['020', '050'].includes(prefix)) return 'vodafone-gh';
        if (['027', '057', '026', '056'].includes(prefix)) return 'tigo-gh';
        return 'mtn-gh'; 
    };

    const handlePaymentAndSubmit = async () => {
        if (!selectedPlan) return;
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan);
        if (!plan) return;

        setLoading(true);
        const amount = plan.price;
        const channel = detectNetworkCode(ownerPhone);
        const orderId = `SUB-${Date.now()}`;
        
        let formattedPhone = ownerPhone.trim().replace(/\s/g, '');
        if (formattedPhone.startsWith('0')) formattedPhone = '+233' + formattedPhone.substring(1);
        else if (!formattedPhone.startsWith('+')) formattedPhone = '+233' + formattedPhone;

        try {
            const res = await fetch("https://us-central1-pickmeservicesonline.cloudfunctions.net/startPayment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: amount,
                    customerName: restaurantName,
                    customerPhone: formattedPhone,
                    shopName: "PickMe Services Partner",
                    description: `Subscription: ${plan.label} for ${restaurantName}`,
                    clientReference: orderId,
                    channel: channel
                })
            });

            const json = await res.json();

            if (json.ok || res.ok) {
                // Save to Firestore on success
                await saveRestaurantRequest({
                    restaurantName,
                    ownerPhone: formattedPhone,
                    restaurantImage, // Base64 compressed string
                    menuItems,
                    planId: selectedPlan,
                    planAmount: amount,
                    isRenewal: mode === 'RENEW' && !isRenewalEdit, // approximate logic
                    restaurantId: restaurantId || null
                });

                alert(`Payment prompt sent to ${formattedPhone}. Please authorize the transaction.`);
                setTimeout(async () => {
                    setLoading(false);
                    setMode('SUCCESS');
                }, 4000);
            } else {
                alert("Payment failed to initiate: " + (json.message || "Unknown error"));
                setLoading(false);
            }
        } catch (error) {
            console.error("Payment error", error);
            alert("Connection error. Please try again.");
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const renderSelection = () => (
        <div className="space-y-6 text-center py-8">
            <h3 className="text-2xl font-extrabold text-gray-900">Add your Restaurant</h3>
            <p className="text-gray-500">Partner with PickMe Services today.</p>
            
            <div className="grid grid-cols-1 gap-4">
                <button 
                    onClick={() => setMode('REGISTER')}
                    className="p-6 border-2 border-gray-100 rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all group text-left shadow-sm"
                >
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Store className="text-primary" size={24} />
                    </div>
                    <h4 className="font-bold text-lg text-gray-900">Add New Restaurant</h4>
                    <p className="text-sm text-gray-500 mt-1">Join us to reach more customers.</p>
                </button>

                <button 
                    onClick={() => setMode('RENEW')}
                    className="p-6 border-2 border-gray-100 rounded-2xl hover:border-blue-500/50 hover:bg-blue-50 transition-all group text-left shadow-sm"
                >
                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <RefreshCw className="text-blue-600" size={24} />
                    </div>
                    <h4 className="font-bold text-lg text-gray-900">Renew Subscription</h4>
                    <p className="text-sm text-gray-500 mt-1">Extend your partner plan.</p>
                </button>
            </div>
        </div>
    );

    const renderRegistration = () => (
        <div className="space-y-6">
            {step === 1 && (
                <div className="space-y-5 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => {
                            if(isRenewalEdit) { setMode('RENEW'); setStep(2); setIsRenewalEdit(false); }
                            else { setMode('SELECT'); }
                        }} className="p-2 hover:bg-gray-100 rounded-full">
                            <ArrowLeft size={20} className="text-gray-600"/>
                        </button>
                        <h3 className="font-bold text-lg">{isRenewalEdit ? 'Edit Basic Details' : 'Basic Details'}</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Restaurant Name</label>
                            <input className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 font-bold text-gray-900 outline-none focus:border-primary focus:bg-white transition-all" placeholder="e.g. Tasty Pot" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Owner Mobile Money Number</label>
                            <div className="relative">
                                <input className={`w-full bg-gray-50 border rounded-xl p-3.5 font-bold text-gray-900 outline-none transition-all ${networkName ? 'border-green-500 ring-1 ring-green-100' : 'border-gray-200 focus:border-primary'}`} placeholder="e.g. 0554..." type="tel" maxLength={10} value={ownerPhone} onChange={e => setOwnerPhone(e.target.value.replace(/\D/g,''))} />
                                {networkName && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">
                                        <Wallet size={12} className="text-green-600"/>
                                        <span className="text-xs font-bold text-green-700">{networkName}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Cover Image</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary hover:bg-primary/5 cursor-pointer transition-all" onClick={() => restImageInputRef.current?.click()}>
                                {restaurantImage ? (
                                    <div className="relative h-32 w-full shadow-md rounded-lg overflow-hidden">
                                        <img src={restaurantImage} alt="Cover" className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity font-bold text-white">Change</div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                        <Upload size={24}/> <span className="text-sm font-medium">Tap to upload image</span>
                                    </div>
                                )}
                                <input type="file" ref={restImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setRestaurantImage)} />
                            </div>
                        </div>
                    </div>
                    
                    <button onClick={() => setStep(2)} disabled={!restaurantName || !ownerPhone || ownerPhone.length < 10} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold mt-2 shadow-lg disabled:opacity-50 hover:bg-black transition-colors">Next: {isRenewalEdit ? 'Edit Menu' : 'Quick Menu'}</button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setStep(1)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={18}/></button>
                        <h3 className="font-bold text-lg">{isRenewalEdit ? 'Edit Menu Items' : 'Add a few items'}</h3>
                    </div>
                    <p className="text-xs text-gray-500 -mt-2 ml-1">List some of your popular meals with prices.</p>

                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                        <div className="flex gap-3">
                             <input className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium outline-none focus:border-primary" placeholder="Meal Name (e.g. Jollof)" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                             <input className="w-24 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-medium outline-none focus:border-primary" placeholder="Price" type="number" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                        </div>
                        
                        <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2 text-gray-400 cursor-pointer hover:text-primary transition-colors" onClick={() => menuImageInputRef.current?.click()}>
                                {newItem.image ? <span className="text-primary font-bold text-xs flex items-center gap-1"><CheckCircle size={12}/> Image Added</span> : <div className="flex items-center gap-1"><Upload size={14}/> <span className="text-xs font-bold">Add Image (Optional)</span></div>}
                                <input type="file" ref={menuImageInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (val) => setNewItem({...newItem, image: val}))} />
                             </div>
                             <button onClick={handleAddMenuItem} disabled={!newItem.name || !newItem.price} className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-black disabled:opacity-50 flex items-center gap-1">
                                <Plus size={14}/> {newItem.id ? 'Update' : 'Add'}
                             </button>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {menuItems.map(item => (
                            <div key={item.id} onClick={() => handleEditMenuItem(item)} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 cursor-pointer hover:border-primary/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                                        {item.image ? <img src={item.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-400"><ChefHat size={16}/></div>}
                                    </div>
                                    <div>
                                        <span className="font-bold text-sm block text-gray-900">{item.name}</span>
                                        <span className="text-xs font-bold text-gray-500">GHS {item.price}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Edit2 size={14} className="text-gray-400"/>
                                    <button onClick={(e) => { e.stopPropagation(); handleRemoveMenuItem(item.id); }} className="text-red-400 p-2 hover:bg-red-50 rounded-full"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={() => setStep(3)} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold mt-2 shadow-lg hover:bg-black transition-colors">Next: {isRenewalEdit ? 'Update Plan' : 'Choose Plan'}</button>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setStep(2)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={18}/></button>
                        <h3 className="font-bold text-lg">Subscription Plan</h3>
                    </div>
                    
                    {/* Grid Layout Restored */}
                    <div className="grid grid-cols-2 gap-3">
                        {SUBSCRIPTION_PLANS.map(plan => (
                            <div key={plan.id} onClick={() => setSelectedPlan(plan.id as PlanType)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between items-start h-28 ${selectedPlan === plan.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-100 hover:border-gray-300'}`}>
                                <div>
                                    <h4 className="font-bold text-gray-900">{plan.label}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{plan.desc}</p>
                                </div>
                                <p className="text-lg font-extrabold text-primary">GHS {plan.price}</p>
                            </div>
                        ))}
                    </div>

                    <button onClick={handlePaymentAndSubmit} disabled={!selectedPlan || loading} className="w-full bg-primary text-white py-4 rounded-xl font-bold mt-4 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:bg-red-600 transition-all disabled:opacity-50">
                        {loading ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : <><Lock size={18}/> {isRenewalEdit ? 'Update & Pay' : 'Pay & Submit'}</>}
                    </button>
                </div>
            )}
        </div>
    );

    const renderRenew = () => (
        <div className="space-y-6">
             {step === 1 && (
                 <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => setMode('SELECT')} className="p-2 hover:bg-gray-100 rounded-full">
                            <ArrowLeft size={20} className="text-gray-600"/>
                        </button>
                        <h3 className="font-bold text-lg">Find Account</h3>
                    </div>
                     <p className="text-sm text-gray-500">Enter your Restaurant ID to renew.</p>
                     <input className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 font-bold outline-none focus:border-primary" placeholder="Restaurant ID" value={restaurantId} onChange={e => setRestaurantId(e.target.value)} />
                    <button onClick={handleSimulateFetch} disabled={!restaurantId || loading} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2">
                         {loading ? <Loader2 className="animate-spin" size={18} /> : 'Continue'}
                    </button>
                 </div>
             )}

             {/* NEW EDIT STEP FOR RENEW */}
             {step === 2 && (
                 <div className="space-y-5 animate-fade-in">
                     <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => setStep(1)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20}/></button>
                        <h3 className="font-bold text-lg">Verify Details</h3>
                     </div>
                     <div className="space-y-4">
                         <div>
                             <label className="block text-xs font-bold text-gray-500 mb-1">Restaurant Name</label>
                             <input className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold text-gray-900" disabled value={restaurantName} />
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Owner Mobile Money Number</label>
                            <div className="relative">
                                <input disabled className={`w-full bg-gray-50 border rounded-xl p-3.5 font-bold text-gray-900 outline-none transition-all ${networkName ? 'border-green-500 ring-1 ring-green-100' : 'border-gray-200 focus:border-primary'}`} placeholder="e.g. 0554..." type="tel" maxLength={10} value={ownerPhone} onChange={e => setOwnerPhone(e.target.value.replace(/\D/g,''))} />
                                {networkName && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">
                                        <Wallet size={12} className="text-green-600"/>
                                        <span className="text-xs font-bold text-green-700">{networkName}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                         
                         <div className="flex gap-3">
                             <button onClick={startFullEdit} className="flex-1 border border-gray-300 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                <Edit2 size={16} /> Edit Full Info
                             </button>
                             <button onClick={() => setStep(3)} className="flex-1 bg-gray-900 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-black">
                                Proceed to Payment
                             </button>
                         </div>
                     </div>
                 </div>
             )}

             {step === 3 && (
                 <div className="space-y-5 animate-fade-in">
                     <div className="flex items-center gap-2 mb-2">
                        <button onClick={() => setStep(2)} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20}/></button>
                        <h3 className="font-bold text-lg">Select Renewal Plan</h3>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3">
                        {SUBSCRIPTION_PLANS.map(plan => (
                            <div key={plan.id} onClick={() => setSelectedPlan(plan.id as PlanType)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between items-start h-28 ${selectedPlan === plan.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-100 hover:border-gray-300'}`}>
                                <div>
                                    <h4 className="font-bold text-gray-900">{plan.label}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{plan.desc}</p>
                                </div>
                                <p className="text-lg font-extrabold text-primary">GHS {plan.price}</p>
                            </div>
                        ))}
                    </div>

                    <button onClick={handlePaymentAndSubmit} disabled={!selectedPlan || loading} className="w-full bg-primary text-white py-4 rounded-xl font-bold mt-2 shadow-xl shadow-primary/20 flex justify-center items-center gap-2 hover:bg-red-600 transition-all disabled:opacity-50">
                         {loading ? <Loader2 className="animate-spin" size={18} /> : <>Pay & Renew <Lock size={18}/></>}
                    </button>
                 </div>
             )}
        </div>
    );

    const renderSuccess = () => (
        <div className="text-center py-10 animate-fade-in px-4">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle size={48} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900 mb-2">You're all set!</h3>
            <p className="text-gray-500 mb-8 font-medium">We've received your payment. Our team will contact you shortly on <strong>{ownerPhone}</strong> to finalize your restaurant setup.</p>
            <button onClick={handleClose} className="w-full px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors shadow-lg">Back to Home</button>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 z-[10010] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10 shrink-0">
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <ChefHat size={20} />
                        <span>Partner Portal</span>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    {mode === 'SELECT' && renderSelection()}
                    {mode === 'REGISTER' && renderRegistration()}
                    {mode === 'RENEW' && renderRenew()}
                    {mode === 'SUCCESS' && renderSuccess()}
                </div>
            </div>
        </div>
    );
};

export default RestaurantOnboarding;
