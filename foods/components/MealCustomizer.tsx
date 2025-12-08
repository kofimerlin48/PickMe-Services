
import React, { useState } from 'react';
import { X, Minus, Plus, Check, ChevronRight, ArrowLeft, Info, ChefHat } from 'lucide-react';
import { Meal, Option, MealPackage, CustomBuilderOption } from '../types';

interface MealCustomizerProps {
  meal: Meal;
  onClose: () => void;
  onConfirm: (meal: Meal, data: any, quantity: number, isUpdate: boolean, type: 'STANDARD' | 'PACKAGE' | 'BUILD') => void;
  initialData?: any;
  initialQuantity?: number;
  isEditing?: boolean;
}

type ViewMode = 'SELECTION' | 'PACKAGE_CONFIG' | 'BUILDER';

const COLORS = [
    'from-blue-600 to-cyan-500',
    'from-violet-600 to-fuchsia-500',
    'from-emerald-600 to-teal-500',
    'from-orange-500 to-amber-500'
];

const MealCustomizer: React.FC<MealCustomizerProps> = ({ 
  meal, onClose, onConfirm, initialData, initialQuantity = 1, isEditing = false 
}) => {
  const isComplex = (meal.packages && meal.packages.length > 0) || !!meal.customBuilder;

  const [view, setView] = useState<ViewMode>(isComplex && !isEditing ? 'SELECTION' : 'PACKAGE_CONFIG');
  
  const [stdOptions, setStdOptions] = useState<Record<string, Option[]>>(isEditing && !isComplex ? initialData : {});
  const [quantity, setQuantity] = useState(initialQuantity);

  const [activePackage, setActivePackage] = useState<MealPackage | null>(null);
  const [pkgOptions, setPkgOptions] = useState<Record<string, Option[]>>({});

  const [buildBaseQty, setBuildBaseQty] = useState(1);
  const [buildAddons, setBuildAddons] = useState<Record<string, CustomBuilderOption[]>>({});

  React.useEffect(() => {
      if (isEditing) {
          if (initialData.selectedPackageId) {
              const pkg = meal.packages?.find(p => p.id === initialData.selectedPackageId);
              if (pkg) {
                  setActivePackage(pkg);
                  setPkgOptions(initialData.selectedOptions);
                  setView('PACKAGE_CONFIG');
              }
          } else if (initialData.baseQuantity) {
              setBuildBaseQty(initialData.baseQuantity);
              setBuildAddons(initialData.selectedAddons);
              setView('BUILDER');
          } else {
              setView('PACKAGE_CONFIG');
          }
      } else if (isComplex) {
          setView('SELECTION');
      } else {
          setView('PACKAGE_CONFIG');
      }
  }, [isEditing, meal, initialData]);

  const handleOptionToggle = (optionsState: any, setOptionsState: any, groupId: string, option: Option, maxSelection: number) => {
    setOptionsState((prev: any) => {
      const current = prev[groupId] || [];
      const exists = current.find((o: any) => o.id === option.id);
      let newGroup: Option[] = [];

      if (maxSelection === 1) {
        newGroup = [option];
      } else {
        if (exists) newGroup = current.filter((o: any) => o.id !== option.id);
        else newGroup = current.length < maxSelection ? [...current, option] : current;
      }
      return { ...prev, [groupId]: newGroup };
    });
  };

  const handleAddonToggle = (groupId: string, option: CustomBuilderOption) => {
      setBuildAddons(prev => {
          const current = prev[groupId] || [];
          const exists = current.find(o => o.id === option.id);
          if (exists) return { ...prev, [groupId]: current.filter(o => o.id !== option.id) };
          return { ...prev, [groupId]: [...current, option] };
      });
  };
  
  const handleAddonIncrement = (groupId: string, option: CustomBuilderOption) => {
      setBuildAddons(prev => {
          const current = prev[groupId] || [];
          return { ...prev, [groupId]: [...current, option] };
      });
  };
  
  const handleAddonDecrement = (groupId: string, optionId: string) => {
      setBuildAddons(prev => {
          const current = prev[groupId] || [];
          const idx = current.findIndex(o => o.id === optionId);
          if (idx === -1) return prev;
          const newArr = [...current];
          newArr.splice(idx, 1);
          return { ...prev, [groupId]: newArr };
      });
  };

  const calculateTotal = () => {
      if (view === 'BUILDER' && meal.customBuilder) {
          let total = meal.customBuilder.basePrice * buildBaseQty;
          // Explicit typing for Object.values iteration
          Object.values(buildAddons).forEach((group: CustomBuilderOption[]) => {
               group.forEach(opt => total += opt.price);
          });
          return total; 
      } else if (activePackage) {
          return activePackage.price * quantity;
      } else {
          let total = meal.price;
          // Explicit typing for Object.values iteration
          Object.values(stdOptions).forEach((group: Option[]) => {
               group.forEach(opt => total += opt.price);
          });
          return total * quantity;
      }
  };

  const confirmSelection = () => {
      if (view === 'BUILDER') {
          onConfirm(meal, { baseQuantity: buildBaseQty, selectedAddons: buildAddons }, 1, isEditing, 'BUILD');
      } else if (activePackage) {
          onConfirm(meal, { options: pkgOptions, packageId: activePackage.id }, quantity, isEditing, 'PACKAGE');
      } else {
          onConfirm(meal, stdOptions, quantity, isEditing, 'STANDARD');
      }
  };

  const renderSelectionView = () => (
      <div className="flex flex-col h-full bg-gray-50">
          <div className="p-4 text-center">
              <h3 className="text-lg font-extrabold text-gray-900">Choose Option</h3>
          </div>
          
          <div className="flex-1 overflow-x-auto custom-scrollbar px-6 pt-2 pb-6 flex gap-4 items-center">
              {meal.packages?.map((pkg, idx) => {
                  const colorClass = COLORS[idx % COLORS.length];
                  return (
                      <div 
                        key={pkg.id} 
                        onClick={() => { setActivePackage(pkg); setView('PACKAGE_CONFIG'); }}
                        className={`min-w-[160px] w-[160px] h-[240px] rounded-2xl p-4 flex flex-col cursor-pointer shadow-md hover:scale-[1.02] transition-transform relative overflow-hidden group bg-gradient-to-br ${colorClass}`}
                      >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-8 -mt-8 blur-xl"></div>
                          <div className="relative z-10 flex-1 flex flex-col items-center text-center">
                              <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center mb-4 text-white backdrop-blur-sm">
                                  <ChefHat size={16} />
                              </div>
                              <h4 className="font-extrabold text-white text-base mb-2 leading-tight">{pkg.name}</h4>
                              <p className="text-white/90 text-[10px] leading-relaxed mb-4 flex-1 line-clamp-4">{pkg.description}</p>
                              
                              <div className="mt-auto">
                                  <span className="block text-white/80 text-[10px] font-bold uppercase mb-0.5">Price</span>
                                  <span className="text-lg font-extrabold text-white">GHS {pkg.price}</span>
                              </div>
                          </div>
                      </div>
                  );
              })}

              {meal.customBuilder && (
                  <div 
                    onClick={() => setView('BUILDER')}
                    className="min-w-[160px] w-[160px] h-[240px] bg-gray-900 text-white rounded-2xl p-4 flex flex-col cursor-pointer shadow-md hover:scale-[1.02] transition-transform relative overflow-hidden group text-center"
                  >
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20"></div>
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/30 rounded-full blur-3xl -mr-10 -mb-10"></div>
                      
                      <div className="relative z-10 flex flex-col h-full items-center">
                           <div className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center mb-4 text-white backdrop-blur-sm border border-white/10">
                                  <Plus size={16} />
                           </div>
                          <h4 className="font-extrabold text-base mb-2 leading-tight">Build Your Own</h4>
                          <p className="text-gray-400 text-[10px] leading-relaxed mb-4 flex-1">Customize everything. Choose base & sides.</p>
                          <button className="w-full py-2 bg-white text-gray-900 font-bold rounded-lg text-[10px] hover:bg-gray-100 transition-colors uppercase tracking-wide">Start</button>
                      </div>
                  </div>
              )}
          </div>
      </div>
  );

  const renderConfigView = () => {
      const targetOptionGroups = activePackage ? activePackage.optionGroups : meal.optionGroups;
      const currentOptions = activePackage ? pkgOptions : stdOptions;
      const setOptions = activePackage ? setPkgOptions : setStdOptions;
      const title = activePackage ? activePackage.name : meal.name;
      const priceDisplay = activePackage ? activePackage.price : meal.price;

      return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                <div className="flex items-center justify-between">
                     <h3 className="font-bold text-xl text-gray-900">{title}</h3>
                     {!activePackage && <div className="text-xl font-extrabold text-primary">GHS {priceDisplay.toFixed(2)}</div>}
                </div>
                {activePackage && <p className="text-gray-500 text-sm -mt-4">{activePackage.description}</p>}
                
                {targetOptionGroups.map(group => (
                    <div key={group.id}>
                        <div className="flex justify-between mb-3 items-center">
                            <h4 className="font-bold text-gray-900 text-base">{group.name}</h4>
                            <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase tracking-wide">{group.required ? 'Required' : 'Optional'}</span>
                        </div>
                        <div className="space-y-2">
                            {group.options.map(opt => {
                                const isSelected = currentOptions[group.id]?.some((o: any) => o.id === opt.id);
                                return (
                                    <button 
                                        key={opt.id}
                                        type="button"
                                        onClick={() => handleOptionToggle(currentOptions, setOptions, group.id, opt, group.maxSelection)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.98] text-left ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-300'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                                                {isSelected && <Check size={12} className="text-white"/>}
                                            </div>
                                            <span className="font-bold text-gray-800 text-sm">{opt.name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-500">{!activePackage && opt.price > 0 ? `+ ${opt.price}` : ''}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-gray-100 shadow-[0_-5px_30px_rgba(0,0,0,0.05)] z-30 bg-white">
                <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-800 text-sm">Quantity</span>
                    <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-xl">
                        <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-9 h-9 bg-white rounded-lg shadow-sm flex items-center justify-center font-bold hover:bg-gray-50 active:scale-95 transition-all"><Minus size={16}/></button>
                        <span className="font-extrabold text-lg w-6 text-center">{quantity}</span>
                        <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-9 h-9 bg-white rounded-lg shadow-sm flex items-center justify-center font-bold hover:bg-gray-50 active:scale-95 transition-all"><Plus size={16}/></button>
                    </div>
                </div>
                <button onClick={confirmSelection} className="w-full bg-primary text-white py-3.5 rounded-xl font-extrabold text-base shadow-lg hover:bg-red-600 transition-all flex justify-between px-6">
                    <span>{isEditing ? 'Update' : 'Add to Order'}</span>
                    <span>GHS {calculateTotal().toFixed(2)}</span>
                </button>
            </div>
        </div>
      );
  };

  const renderBuilderView = () => {
      const config = meal.customBuilder!;
      return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-gray-900 text-base">{config.unitName}</h4>
                        <span className="font-bold text-primary text-sm">GHS {config.basePrice} / unit</span>
                    </div>
                    <div className="flex items-center gap-4 mt-4">
                        <button type="button" onClick={() => setBuildBaseQty(Math.max(1, buildBaseQty - 1))} className="w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-center hover:bg-gray-50"><Minus size={18}/></button>
                        <span className="font-extrabold text-xl flex-1 text-center">{buildBaseQty}</span>
                        <button type="button" onClick={() => setBuildBaseQty(buildBaseQty + 1)} className="w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-center hover:bg-gray-50"><Plus size={18}/></button>
                    </div>
                </div>

                {config.addonGroups.map(group => (
                    <div key={group.id}>
                        <h4 className="font-bold text-gray-900 text-base mb-3">{group.name}</h4>
                        <div className="space-y-3">
                            {group.options.map(opt => {
                                const count = buildAddons[group.id]?.filter(o => o.id === opt.id).length || 0;
                                return (
                                    <div key={opt.id} className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${count > 0 ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}>
                                        <div>
                                            <span className="font-bold text-gray-900 block text-sm">{opt.name}</span>
                                            <span className="text-xs font-bold text-gray-500">GHS {opt.price}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {count > 0 && (
                                                <button type="button" onClick={() => handleAddonDecrement(group.id, opt.id)} className="w-7 h-7 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm"><Minus size={14}/></button>
                                            )}
                                            {count > 0 && <span className="font-bold text-gray-900 w-4 text-center text-sm">{count}</span>}
                                            <button type="button" onClick={() => handleAddonIncrement(group.id, opt)} className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-sm ${count > 0 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}><Plus size={14}/></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-gray-100 shadow-[0_-5px_30px_rgba(0,0,0,0.05)] z-30 bg-white">
                <button onClick={confirmSelection} className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-extrabold text-base shadow-xl hover:bg-black transition-all flex justify-between px-6">
                    <span>{isEditing ? 'Update Build' : 'Complete Build'}</span>
                    <span>GHS {calculateTotal().toFixed(2)}</span>
                </button>
            </div>
        </div>
      );
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[20000] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-lg sm:rounded-3xl rounded-t-3xl h-[85vh] sm:h-[750px] flex flex-col shadow-2xl animate-slide-up overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* TOP IMAGE - ALWAYS VISIBLE */}
        <div className="relative h-40 shrink-0">
            <img src={meal.image} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/>
            
            {/* Top Navigation Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
                 {/* Back Button Logic */}
                 {view !== 'SELECTION' && isComplex ? (
                     <button onClick={() => { setView('SELECTION'); setActivePackage(null); }} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors">
                        <ArrowLeft size={20}/>
                     </button>
                 ) : (
                     <div className="w-10"></div> // Spacer
                 )}

                 <button onClick={onClose} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors">
                    <X size={20}/>
                 </button>
            </div>
            
            <div className="absolute bottom-4 left-6 text-white">
                <h2 className="text-2xl font-extrabold shadow-sm">{meal.name}</h2>
            </div>
        </div>
        
        <div className="flex-1 overflow-hidden h-full">
            {view === 'SELECTION' && renderSelectionView()}
            {view === 'PACKAGE_CONFIG' && renderConfigView()}
            {view === 'BUILDER' && renderBuilderView()}
        </div>
      </div>
    </div>
  );
};

export default MealCustomizer;
