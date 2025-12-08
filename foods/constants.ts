
import { Restaurant } from "./types";

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: "r1",
    name: "Burger & Co.",
    cuisine: "American • Fast Food",
    rating: 4.8,
    reviewCount: 342,
    deliveryFee: 15,
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80",
    menu: [
      {
        id: "m1",
        name: "The Classic Cheeseburger",
        description: "Angus beef patty, cheddar cheese, lettuce, tomato, house sauce.",
        price: 45,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
        optionGroups: [],
        packages: [
            {
                id: "pkg_std_m1",
                name: "Standard",
                price: 45,
                description: "The classic burger experience.",
                optionGroups: [
                    {
                        id: "opt1",
                        name: "Choose a Side",
                        required: true,
                        maxSelection: 1,
                        options: [ { id: "o1", name: "Fries", price: 0 }, { id: "o2", name: "Onion Rings", price: 5 }, { id: "o3", name: "Salad", price: 0 } ]
                    },
                    {
                        id: "opt2",
                        name: "Add Extras",
                        required: false,
                        maxSelection: 3,
                        options: [ { id: "o4", name: "Extra Cheese", price: 5 }, { id: "o5", name: "Bacon", price: 10 } ]
                    }
                ]
            }
        ]
      },
      { 
        id: "m2", 
        name: "Crispy Chicken Sandwich", 
        description: "Fried chicken breast, pickles, mayo, brioche bun.", 
        price: 38, 
        image: "https://images.unsplash.com/photo-1619250907409-943e8b4cf179?auto=format&fit=crop&w=800&q=80", 
        optionGroups: [],
        packages: [
            {
                id: "pkg_std_m2",
                name: "Standard",
                price: 38,
                description: "Sandwich only.",
                optionGroups: []
            },
            {
                id: "pkg_combo_m2",
                name: "Meal Combo",
                price: 55,
                description: "Sandwich + Fries + Drink.",
                optionGroups: []
            }
        ]
      }
    ]
  },
  {
    id: "r2",
    name: "Sushi Zen",
    cuisine: "Japanese • Healthy",
    rating: 4.9,
    reviewCount: 520,
    deliveryFee: 25,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80",
    menu: [
      {
        id: "m3",
        name: "Dragon Roll",
        description: "Eel, cucumber, topped with avocado and unagi sauce.",
        price: 85,
        image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=800&q=80",
        optionGroups: [],
        packages: [
            {
                id: "pkg_std_m3",
                name: "Standard Roll",
                price: 85,
                description: "8 pieces of Dragon Roll.",
                optionGroups: [ { id: "opt3", name: "Spiciness Level", required: true, maxSelection: 1, options: [ { id: "o6", name: "Mild", price: 0 }, { id: "o7", name: "Spicy", price: 0 } ] } ]
            }
        ]
      },
      { 
        id: "m4", 
        name: "Salmon Nigiri Box", 
        description: "6 pieces of fresh salmon nigiri.", 
        price: 60, 
        image: "https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80", 
        optionGroups: [],
        packages: [
             {
                id: "pkg_std_m4",
                name: "Standard Box",
                price: 60,
                description: "6 pieces.",
                optionGroups: []
            },
            {
                id: "pkg_lrg_m4",
                name: "Large Box",
                price: 110,
                description: "12 pieces.",
                optionGroups: []
            }
        ]
      }
    ]
  },
  {
    id: "r3",
    name: "Mama's Pot",
    cuisine: "Local • Traditional",
    rating: 4.6,
    reviewCount: 128,
    deliveryFee: 10,
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
    menu: [
      {
        id: "m5",
        name: "Jollof Rice Special",
        description: "Choose a package or build your own bowl.",
        price: 50,
        image: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f1a?auto=format&fit=crop&w=800&q=80",
        optionGroups: [],
        packages: [
            {
                id: "pkg1",
                name: "Mini Lunch Pack",
                price: 65,
                description: "Standard portion with 1 protein choice.",
                optionGroups: [
                    {
                        id: "pg1",
                        name: "Choose Protein",
                        required: true,
                        maxSelection: 1,
                        options: [ { id: "p1", name: "Fried Fish", price: 0 }, { id: "p2", name: "Chicken", price: 0 } ]
                    }
                ]
            },
            {
                id: "pkg2",
                name: "Jumbo Feast",
                price: 85,
                description: "Large portion with 2 proteins and salad.",
                optionGroups: [
                    {
                        id: "pg2",
                        name: "Choose 2 Proteins",
                        required: true,
                        maxSelection: 2,
                        options: [ { id: "p3", name: "Fried Fish", price: 0 }, { id: "p4", name: "Grilled Chicken", price: 0 }, { id: "p5", name: "Beef", price: 0 } ]
                    },
                    {
                        id: "pg3",
                        name: "Add-ons",
                        required: false,
                        maxSelection: 1,
                        options: [ { id: "p6", name: "Coleslaw", price: 0 }, { id: "p7", name: "Spaghetti", price: 0 } ]
                    }
                ]
            }
        ],
        customBuilder: {
            basePrice: 20,
            unitName: "Bowl",
            addonGroups: [
                {
                    id: "ag1",
                    name: "Proteins",
                    options: [
                        { id: "ap1", name: "Fried Fish", price: 15 },
                        { id: "ap2", name: "Grilled Chicken", price: 20 },
                        { id: "ap3", name: "Goat Meat", price: 25 },
                        { id: "ap4", name: "Boiled Egg", price: 5 }
                    ]
                },
                {
                    id: "ag2",
                    name: "Extras",
                    options: [
                        { id: "ex1", name: "Kelewele", price: 10 },
                        { id: "ex2", name: "Salad", price: 5 }
                    ]
                }
            ]
        }
      }
    ]
  }
];
