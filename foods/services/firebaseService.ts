
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { CartItem } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyB2L649fIs0CS-fGDC0ybFeAO5Im5BEP_c",
  authDomain: "pickmeservicesonline.firebaseapp.com",
  projectId: "pickmeservicesonline",
  storageBucket: "pickmeservicesonline.firebasestorage.app",
  messagingSenderId: "265031616239",
  appId: "1:265031616239:web:e2ef418704af5595aa7d1a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Dedicated collections for Food Service
const ordersCol = collection(db, "Food", "Orders", "items");
const partnersCol = collection(db, "Food", "Partners", "items");

export const saveOrderToFirestore = async (
  orderId: string,
  items: CartItem[],
  amountBreakdown: {
    subtotal: number;
    deliveryFee: number;
    serviceCharge: number;
    totalAmount: number;
  },
  customerDetails: {
    name: string;
    phone: string;
    deliveryAddress: string;
    deliveryContact: string;
    network: string;
  },
  isGeneralOrder: boolean
) => {
  try {
    const docRef = await addDoc(ordersCol, {
      orderId,
      items,
      amountBreakdown, 
      customerDetails,
      status: 'pending_payment',
      createdAt: serverTimestamp(),
      isGeneralOrder
    });
    console.log("Order Document written with ID: ", docRef.id);
    return true;
  } catch (e) {
    console.error("Error adding order: ", e);
    throw e;
  }
};

export const saveRestaurantRequest = async (data: any) => {
  try {
    const docRef = await addDoc(partnersCol, {
      ...data,
      status: 'pending_review',
      createdAt: serverTimestamp()
    });
    console.log("Partner request saved: ", docRef.id);
    return true;
  } catch (e) {
    console.error("Error saving partner request: ", e);
    throw e;
  }
};
