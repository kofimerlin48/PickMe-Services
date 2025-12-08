
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ShoppingBag, Star, Plus, Minus, ArrowRight, Trash2, Wine, ChevronLeft, MapPin, ChefHat, ArrowUp, ArrowDown } from 'lucide-react';
import { MOCK_RESTAURANTS } from './constants';
import { Meal, CartItem, Option, Restaurant, MealPackage, CustomBuildSelection } from './types';
import MealCustomizer from './components/MealCustomizer';
import CheckoutModal, { CheckoutDetails } from './components/CheckoutModal';
import ClearCartModal from './components/ClearCartModal';
import AIAssistant from './components/AIAssistant';
import RestaurantOnboarding from './components/RestaurantOnboarding';
import { saveOrderToFirestore } from './services/firebaseService';

// Service Charge Constant
const SERVICE_CHARGE = 2.00;

// Rectangular Cart Bar (Replaces circular button when items exist)
const CartBar = ({ count, total, onClick }: { count: number, total: number, onClick: () => void }) => (
    <div 
        onClick={onClick}
        className="fixed bottom-[85px] left-4 right-4 z-[10001] bg-gray-900 text-white rounded-2xl shadow-2xl p-4 flex items-center justify-between cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all animate-slide-up border border-white/10"
    >
        <span className="font-bold text-base pl-2">{count} items.</span>
        <span className="font-extrabold text-lg pr-2">GHS {total.toFixed(2)}</span>
    </div>
);

// Floating Circular Button (Always visible)
const FloatingCartButton = ({ count, onClick }: { count: number, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="fixed top-24 right-4 z-[10001] bg-white text-gray-900 p-3 rounded-full shadow-xl border-2 border-primary/20 hover:scale-105 active:scale-95 transition-all group flex items-center gap-2"
        style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
    >
        <div className="relative">
            <ShoppingBag size={24} className="text-gray-900 group-hover:text-primary transition-colors"/>
            {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-fade-in shadow-sm">
                    {count}
                </span>
            )}
        </div>
        <span className="font-bold text-sm hidden sm:block group-hover:text-primary text-gray-900">Cart</span>
    </button>
);

// Smart Scroll Button (Centered Bottom - Raised to 24)
const ScrollButtons = () => {
    const [visible, setVisible] = useState(false);
    const [direction, setDirection] = useState<'UP' | 'DOWN'>('DOWN');
    const prevScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const maxScroll = document.body.scrollHeight - window.innerHeight;
            
            // Show only if scrolled past 100px AND NOT at the very bottom (10px buffer) AND NOT if total page is small
            const isVisible = currentScrollY > 100 && currentScrollY < (maxScroll - 10) && maxScroll > 100;
            
            let newDirection: 'UP' | 'DOWN' = 'DOWN';
            if (currentScrollY > prevScrollY.current) {
                newDirection = 'DOWN';
            } else {
                newDirection = 'UP';
            }

            setVisible(isVisible);
            setDirection(newDirection);
            prevScrollY.current = currentScrollY;
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleClick = () => {
        if (direction === 'UP') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }
    };

    return (
        <button 
            onClick={handleClick}
            className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-[10000] p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg text-gray-700 hover:text-primary hover:bg-white transition-all duration-500 transform border border-gray-100 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
        >
            {direction === 'UP' ? <ArrowUp size={24} strokeWidth={2.5}/> : <ArrowDown size={24} strokeWidth={2.5}/>}
        </button>
    );
};

function App() {
  const [view, setView] = useState<'HOME' | 'RESTAURANT' | 'CART'>('HOME');
  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  
  // Customizer State
  const [activeMeal, setActiveMeal] = useState<Meal | null>(null);
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);

  // Checkout State
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [isGeneralCheckout, setIsGeneralCheckout] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [calculatedDeliveryFee, setCalculatedDeliveryFee] = useState(0);

  // Clear Cart Modal State
  const [showClearCartModal, setShowClearCartModal] = useState(false);

  // Partner Modal State
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  
  // Refs
  const partnerSectionRef = useRef<HTMLDivElement>(null);

  const activeRestaurant = useMemo(() => MOCK_RESTAURANTS.find(r => r.id === activeRestaurantId), [activeRestaurantId]);
  
  // Handlers
  const handleAddToCart = (meal: Meal, data: any, quantity: number, isUpdate: boolean, type: 'STANDARD' | 'PACKAGE' | 'BUILD') => {
    
    // Calculate Total Price
    let totalPrice = 0;
    
    if (type === 'BUILD') {
        let buildTotal = meal.customBuilder!.basePrice * data.baseQuantity;
        // Flatten addons correctly
        Object.values(data.selectedAddons as Record<string, any[]>).forEach(group => {
            group.forEach(opt => buildTotal += opt.price);
        });
        totalPrice = buildTotal; 
    } else if (type === 'PACKAGE') {
        // data contains { options, packageId }
        const pkg = meal.packages?.find(p => p.id === data.packageId);
        totalPrice = (pkg ? pkg.price : meal.price) * quantity;
    } else {
        // STANDARD
        let optionsTotal = 0;
        // Flatten standard options correctly
        Object.values(data as Record<string, any[]>).forEach(group => {
             group.forEach(opt => optionsTotal += opt.price);
        });
        totalPrice = (meal.price + optionsTotal) * quantity;
    }

    if (isUpdate && editingCartItem) {
        setCart(prev => prev.map(item => item.cartItemId === editingCartItem.cartItemId ? {
            ...item,
            selectedOptions: type === 'PACKAGE' ? data.options : (type === 'BUILD' ? {} : data),
            quantity: type === 'BUILD' ? 1 : quantity,
            totalPrice,
            selectedPackageId: type === 'PACKAGE' ? data.packageId : undefined,
            customBuild: type === 'BUILD' ? { baseQuantity: data.baseQuantity, selectedAddons: data.selectedAddons } : undefined
        } : item));
        showNotification("Cart updated");
    } else {
        const rest = activeRestaurant || MOCK_RESTAURANTS.find(r => r.menu.some(m => m.id === meal.id));
        if (!rest) return;

        const newItem: CartItem = {
            cartItemId: Math.random().toString(36).substr(2, 9),
            restaurantId: rest.id,
            restaurantName: rest.name,
            meal,
            selectedOptions: type === 'PACKAGE' ? data.options : (type === 'BUILD' ? {} : data),
            quantity: type === 'BUILD' ? 1 : quantity,
            totalPrice,
            selectedPackageId: type === 'PACKAGE' ? data.packageId : undefined,
            customBuild: type === 'BUILD' ? { baseQuantity: data.baseQuantity, selectedAddons: data.selectedAddons } : undefined
        };
        setCart(prev => [...prev, newItem]);
        showNotification(`${quantity}x ${meal.name} added`);
    }
    setActiveMeal(null);
    setEditingCartItem(null);
  };

  const handleEditCartItem = (item: CartItem) => {
    setActiveMeal(item.meal);
    setEditingCartItem(item);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.cartItemId !== id));
  
  const promptClearCart = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setShowClearCartModal(true);
  };

  const performClearCart = () => {
      setCart([]);
      showNotification("Cart cleared");
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const initiateCheckout = (items: CartItem[], isGeneral: boolean) => {
      setCheckoutItems(items);
      setIsGeneralCheckout(isGeneral);
      
      const uniqueRestaurantIds = new Set(items.map(i => i.restaurantId));
      let totalDelivery = 0;
      uniqueRestaurantIds.forEach(id => {
          const r = MOCK_RESTAURANTS.find(rest => rest.id === id);
          if (r) totalDelivery += r.deliveryFee;
      });
      
      setCalculatedDeliveryFee(totalDelivery);
      setShowCheckout(true);
  };

  const processPayment = async (details: CheckoutDetails) => {
    setPaymentLoading(true);
    
    const subtotal = checkoutItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const grandTotal = subtotal + calculatedDeliveryFee + SERVICE_CHARGE;
    const orderId = `FOOD-${Date.now()}`;

    const BACKEND_URL = "https://us-central1-pickmeservicesonline.cloudfunctions.net/startPayment";
    
    const channel = details.network; 

    let formattedMoMo = details.momoNumber.trim().replace(/\s/g, '');
    if (formattedMoMo.startsWith('0')) formattedMoMo = '+233' + formattedMoMo.substring(1);
    else if (!formattedMoMo.startsWith('+')) formattedMoMo = '+233' + formattedMoMo;

    try {
        const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount: grandTotal,
                customerName: details.name,
                customerPhone: formattedMoMo,
                shopName: "PickMe Services",
                description: isGeneralCheckout ? `Order (${checkoutItems.length} items)` : `Order from ${checkoutItems[0].restaurantName}`,
                clientReference: orderId,
                channel: channel
            })
        });
        const json = await res.json();

        if (json.ok || res.ok) { 
            await saveOrderToFirestore(
                orderId, 
                checkoutItems, 
                {
                    subtotal,
                    deliveryFee: calculatedDeliveryFee,
                    serviceCharge: SERVICE_CHARGE,
                    totalAmount: grandTotal
                },
                {
                    name: details.name,
                    phone: formattedMoMo,
                    deliveryAddress: details.deliveryAddress,
                    deliveryContact: details.deliveryContact,
                    network: details.network
                },
                isGeneralCheckout
            );
            
            const checkoutIds = new Set(checkoutItems.map(i => i.cartItemId));
            setCart(prev => prev.filter(i => !checkoutIds.has(i.cartItemId)));
            
            alert(`Payment prompt sent to ${formattedMoMo}! Please approve transaction.`);
            setShowCheckout(false);
            setView('HOME');
        } else {
            alert("Payment initiation failed: " + (json.message || "Unknown error"));
        }
    } catch (err) {
        console.error("Payment Error", err);
        alert("Network error processing payment. Please try again.");
    } finally {
        setPaymentLoading(false);
    }
  };

  const handleAIRecommendation = (restaurantId: string, mealId?: string) => {
      setActiveRestaurantId(restaurantId);
      setView('RESTAURANT');
      if (mealId) {
          const rest = MOCK_RESTAURANTS.find(r => r.id === restaurantId);
          const meal = rest?.menu.find(m => m.id === mealId);
          if (meal) setActiveMeal(meal);
      }
  };

  const getOptionNames = (item: CartItem) => {
      // Handle different types
      if (item.selectedPackageId && item.meal.packages) {
          const pkg = item.meal.packages.find(p => p.id === item.selectedPackageId);
          const opts = getOptionNamesFromMap(item.selectedOptions);
          return `${pkg?.name || 'Package'} ${opts ? `(${opts})` : ''}`;
      } else if (item.customBuild) {
          const unit = item.meal.customBuilder?.unitName || 'Unit';
          const addons = Object.values(item.customBuild.selectedAddons).flat().map(a => a.name).join(', ');
          return `${item.customBuild.baseQuantity} ${unit}${addons ? ` + ${addons}` : ''}`;
      } else {
          return getOptionNamesFromMap(item.selectedOptions);
      }
  };

  const getOptionNamesFromMap = (options: Record<string, Option[]>) => {
      const names: string[] = [];
      Object.keys(options).forEach(key => {
          options[key].forEach(opt => names.push(opt.name));
      });
      return names.join(', ');
  };

  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good morning";
      if (hour < 18) return "Good afternoon";
      return "Good evening";
  };

  const scrollToPartnerSection = () => {
      partnerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const cartMealTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const renderHome = () => (
    <div className="pt-6 pb-24 px-4 lg:px-8 max-w-7xl mx-auto animate-fade-in relative">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{getGreeting()} 👋</h2>
                <p className="text-gray-600 font-medium">Ready to explore some delicious options?</p>
            </div>
            <button 
                onClick={scrollToPartnerSection}
                className="text-xs font-bold text-gray-500 hover:text-primary border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
                Add your Restaurant <ArrowRight size={12}/>
            </button>
        </div>

        <div className="mb-10 relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 p-8 text-white shadow-xl cursor-pointer transition-transform hover:scale-[1.01] group">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
            <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10"><Wine size={32} className="text-white" /></div>
                <div><h3 className="text-2xl font-bold">Thirsty? Order Drinks 🍹</h3><p className="text-cyan-100 mt-1 font-medium">Premium beverages delivered ice cold.</p></div>
                </div>
                <div className="bg-white/20 p-3 rounded-full group-hover:bg-white group-hover:text-blue-600 transition-all"><ArrowRight size={24} /></div>
            </div>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><MapPin size={22} className="text-primary"/> Nearby Restaurants</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {MOCK_RESTAURANTS.map(restaurant => (
                <div key={restaurant.id} onClick={() => { setActiveRestaurantId(restaurant.id); setView('RESTAURANT'); }} className="group bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 flex flex-col h-full hover:-translate-y-1">
                <div className="relative h-60 overflow-hidden">
                    <img src={restaurant.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={restaurant.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                         <div className="font-bold bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm border border-white/30 inline-flex items-center gap-1.5 shadow-sm">
                             <Star size={14} className="text-amber-300 fill-amber-300" /> {restaurant.rating}
                         </div>
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-primary transition-colors">{restaurant.name}</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-6 font-medium bg-gray-100 inline-block px-3 py-1 rounded-lg self-start border border-gray-200">{restaurant.cuisine}</p>
                    <div className="mt-auto border-t border-gray-100 pt-4 flex justify-between items-center text-sm text-gray-600 font-medium">
                         <span>{restaurant.reviewCount} reviews</span>
                         <span className="font-bold text-gray-900">Delivery: GHS {restaurant.deliveryFee}</span>
                    </div>
                </div>
                </div>
            ))}
        </div>

        <div ref={partnerSectionRef} className="mt-12 bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden text-center sm:text-left scroll-mt-24">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-2xl font-extrabold mb-2">Own a Restaurant?</h3>
                    <p className="text-gray-400 font-medium max-w-md">Join PickMe Services to reach more customers. Register your business or renew your subscription today.</p>
                </div>
                <button 
                    onClick={() => setShowPartnerModal(true)}
                    className="bg-white text-gray-900 px-8 py-3.5 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-2 whitespace-nowrap"
                >
                    <ChefHat size={20} className="text-primary"/>
                    Add your Restaurant
                </button>
            </div>
        </div>
    </div>
  );

  const renderRestaurant = () => {
    if (!activeRestaurant) return null;
    return (
      <div className="min-h-screen bg-gray-50 animate-fade-in pb-24">
        {/* FIXED HEADER WITH HIGHER Z-INDEX */}
        <div className="bg-white shadow-sm border-b border-gray-200 fixed top-[80px] left-0 right-0 z-[50] px-4 py-3 lg:px-8 flex items-center">
             <button onClick={() => setView('HOME')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-bold text-sm bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl">
                <ChevronLeft size={20} /> Back to Restaurants
             </button>
             <span className="ml-4 font-bold text-gray-800 line-clamp-1">{activeRestaurant.name}</span>
        </div>
        
        {/* PADDING FOR FIXED HEADER */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 mt-16">
           <div className="bg-white rounded-3xl p-8 mb-8 shadow-md border border-gray-100 flex flex-col md:flex-row gap-8 items-center">
              <img src={activeRestaurant.image} className="w-full md:w-56 h-56 object-cover rounded-2xl shadow-sm" alt={activeRestaurant.name}/>
              <div>
                 <h1 className="text-4xl font-extrabold text-gray-900 mb-3">{activeRestaurant.name}</h1>
                 <p className="text-lg text-gray-600 mb-6 font-medium">{activeRestaurant.cuisine}</p>
                 <div className="flex gap-4">
                    <div className="bg-green-50 text-green-700 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 border border-green-100"><Star size={16} fill="currentColor" /> {activeRestaurant.rating} Excellent</div>
                    <div className="bg-gray-100 text-gray-800 px-4 py-2.5 rounded-xl text-sm font-bold border border-gray-200">Delivery: GHS {activeRestaurant.deliveryFee}</div>
                 </div>
              </div>
           </div>

           <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Menu</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeRestaurant.menu.map(meal => (
                  <div key={meal.id} onClick={() => setActiveMeal(meal)} className="bg-white p-4 rounded-2xl border border-gray-200 hover:border-primary/50 hover:shadow-xl transition-all cursor-pointer group flex gap-5 items-stretch relative overflow-hidden h-40">
                      <div className="w-32 h-32 rounded-xl bg-gray-100 overflow-hidden shrink-0 shadow-inner self-center">
                          <img src={meal.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={meal.name} />
                      </div>
                      
                      <div className="flex-1 flex flex-col py-1">
                          <h3 className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors line-clamp-1 mb-1">{meal.name}</h3>
                          <p className="text-gray-500 text-sm line-clamp-2 font-medium mb-auto leading-relaxed">{meal.description}</p>
                          
                          <div className="self-end mt-2">
                             <span className="font-extrabold bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-lg shadow-sm">GHS {meal.price}</span>
                          </div>
                      </div>
                  </div>
              ))}
           </div>
        </div>
      </div>
    );
  };

  const renderCart = () => {
    const grouped = cart.reduce((acc, item) => {
        if(!acc[item.restaurantId]) acc[item.restaurantId] = [];
        acc[item.restaurantId].push(item);
        return acc;
    }, {} as Record<string, CartItem[]>);
    
    return (
      <div className="pt-6 pb-32 px-4 max-w-3xl mx-auto min-h-screen animate-fade-in">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <button onClick={() => setView(activeRestaurantId ? 'RESTAURANT' : 'HOME')} className="p-3 hover:bg-white hover:shadow-md rounded-full transition-all border border-transparent hover:border-gray-200"><ChevronLeft size={24} className="text-gray-700"/></button>
                <h2 className="text-3xl font-extrabold text-gray-900">Your Cart</h2>
            </div>
            {cart.length > 0 && (
                <button 
                    onClick={promptClearCart} 
                    className="relative z-50 text-red-500 font-bold text-sm hover:bg-red-50 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                    Clear Cart
                </button>
            )}
        </div>

        {cart.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-200">
                <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag size={40} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Your cart is empty</h3>
                <p className="text-gray-500 mt-2 mb-8 font-medium">Looks like you haven't made your choice yet.</p>
                <button onClick={() => setView('HOME')} className="bg-primary text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-red-600 transition-colors">Start Ordering</button>
            </div>
        ) : (
            <div className="space-y-8">
                {Object.keys(grouped).map(rid => (
                    <div key={rid} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900 text-lg">{grouped[rid][0].restaurantName}</h3>
                            <button 
                                onClick={() => initiateCheckout(grouped[rid], false)}
                                className="text-primary font-bold text-sm bg-white border border-primary/20 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-white transition-colors shadow-sm"
                            >
                                Pay this restaurant
                            </button>
                        </div>
                        <div className="p-2">
                            {grouped[rid].map(item => (
                                <div key={item.cartItemId} onClick={() => handleEditCartItem(item)} className="flex gap-4 p-4 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors group border border-transparent hover:border-gray-100 relative">
                                    <img src={item.meal.image} className="w-20 h-20 rounded-xl object-cover bg-gray-200 shadow-sm" alt={item.meal.name}/>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-gray-900 truncate pr-2 text-base">{item.quantity}x {item.meal.name}</h4>
                                            <span className="font-bold text-gray-900">GHS {item.totalPrice.toFixed(2)}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-1 mb-3 font-medium">
                                            {getOptionNames(item)}
                                        </p>
                                        <div className="flex justify-end items-center">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); removeFromCart(item.cartItemId); }}
                                                className="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {cart.length > 0 && (
            <div className="fixed bottom-[60px] left-0 right-0 p-5 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[10002]">
                <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total</p>
                        <p className="text-3xl font-extrabold text-gray-900">GHS {cartMealTotal.toFixed(2)}</p>
                    </div>
                    <button onClick={() => initiateCheckout(cart, true)} className="bg-gray-900 text-white px-10 py-4 rounded-xl font-bold shadow-xl hover:bg-black transition-transform active:scale-95">Pay for all meals</button>
                </div>
            </div>
        )}
      </div>
    );
  };

  return (
    <>
      {view !== 'CART' && (
        <FloatingCartButton count={cart.length} onClick={() => setView('CART')} />
      )}
      
      {cart.length > 0 && view !== 'CART' && (
        <CartBar count={cart.length} total={cartMealTotal} onClick={() => setView('CART')} />
      )}
      
      {view === 'HOME' && renderHome()}
      {view === 'RESTAURANT' && renderRestaurant()}
      {view === 'CART' && renderCart()}
      
      <AIAssistant onOpenRestaurant={handleAIRecommendation} />
      
      <ScrollButtons />

      {(activeMeal || editingCartItem) && (
        <MealCustomizer 
            meal={activeMeal!}
            onClose={() => { setActiveMeal(null); setEditingCartItem(null); }}
            onConfirm={handleAddToCart}
            initialData={editingCartItem ? 
                (editingCartItem.selectedPackageId ? { selectedPackageId: editingCartItem.selectedPackageId, selectedOptions: editingCartItem.selectedOptions } : 
                 editingCartItem.customBuild ? { baseQuantity: editingCartItem.customBuild.baseQuantity, selectedAddons: editingCartItem.customBuild.selectedAddons } : 
                 editingCartItem.selectedOptions) : undefined}
            initialQuantity={editingCartItem?.quantity}
            isEditing={!!editingCartItem}
        />
      )}
      
      <CheckoutModal 
         isOpen={showCheckout}
         onClose={() => setShowCheckout(false)}
         subtotal={checkoutItems.reduce((s,i) => s + i.totalPrice, 0)}
         deliveryFee={calculatedDeliveryFee}
         serviceCharge={SERVICE_CHARGE}
         onConfirm={processPayment}
         loading={paymentLoading}
      />

      <ClearCartModal 
          isOpen={showClearCartModal}
          onClose={() => setShowClearCartModal(false)}
          onConfirm={performClearCart}
      />

      <RestaurantOnboarding
          isOpen={showPartnerModal}
          onClose={() => setShowPartnerModal(false)}
      />
      
      {notification && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl z-[80] animate-slide-up flex items-center gap-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-bold text-sm tracking-wide">{notification}</span>
        </div>
      )}
    </>
  );
}

export default App;
