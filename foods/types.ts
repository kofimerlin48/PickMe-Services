
export interface Option {
    id: string;
    name: string;
    price: number;
}

export interface OptionGroup {
    id: string;
    name: string;
    required: boolean;
    maxSelection: number;
    options: Option[];
}

export interface MealPackage {
    id: string;
    name: string;
    price: number;
    description: string;
    optionGroups: OptionGroup[];
}

export interface CustomBuilderOption {
    id: string;
    name: string;
    price: number;
}

export interface CustomBuilderAddonGroup {
    id: string;
    name: string;
    options: CustomBuilderOption[];
}

export interface CustomBuilderConfig {
    basePrice: number;
    unitName: string; // e.g. "Bowl", "Scoop"
    addonGroups: CustomBuilderAddonGroup[];
}

export interface Meal {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    optionGroups: OptionGroup[]; // For standard simple meals
    packages?: MealPackage[];    // NEW: For package-based meals
    customBuilder?: CustomBuilderConfig; // NEW: For "Build Your Own"
}

export interface Restaurant {
    id: string;
    name: string;
    cuisine: string;
    rating: number;
    reviewCount: number;
    deliveryFee: number;
    image: string;
    menu: Meal[];
}

export interface CustomBuildSelection {
    baseQuantity: number;
    selectedAddons: Record<string, CustomBuilderOption[]>; // groupId -> options
}

export interface CartItem {
    cartItemId: string;
    restaurantId: string;
    restaurantName: string;
    meal: Meal;
    selectedOptions: Record<string, Option[]>; // For Standard & Package items
    quantity: number; // For Standard & Package items
    totalPrice: number;
    selectedPackageId?: string;
    customBuild?: CustomBuildSelection;
}

export interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
    recommendedMealId?: string;
    recommendedRestaurantId?: string;
}
