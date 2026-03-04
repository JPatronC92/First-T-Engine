// Pricing Templates for the Public Simulator
// Each template represents a common B2B/Fintech pricing model

export interface PricingTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    rule: object;
    sampleTransactions: { amount: number }[];
}

export const TEMPLATES: PricingTemplate[] = [
    {
        id: "marketplace-3tier",
        name: "Marketplace 3-Tier",
        description: "Tiered commission: <$1K → 3.5%, $1K-$10K → 2.5%, >$10K → 1.5%",
        icon: "🏪",
        rule: {
            "if": [
                { ">": [{ "var": "amount" }, 10000] },
                { "*": [{ "var": "amount" }, 0.015] },
                {
                    "if": [
                        { ">": [{ "var": "amount" }, 1000] },
                        { "*": [{ "var": "amount" }, 0.025] },
                        { "*": [{ "var": "amount" }, 0.035] }
                    ]
                }
            ]
        },
        sampleTransactions: [
            { amount: 250 }, { amount: 500 }, { amount: 1500 },
            { amount: 3000 }, { amount: 7500 }, { amount: 15000 },
            { amount: 25000 }, { amount: 100 }, { amount: 50000 },
            { amount: 800 },
        ],
    },
    {
        id: "flat-percentage",
        name: "Flat Percentage",
        description: "Simple 2.9% fee on every transaction (Stripe-style)",
        icon: "💳",
        rule: { "*": [{ "var": "amount" }, 0.029] },
        sampleTransactions: [
            { amount: 100 }, { amount: 500 }, { amount: 1000 },
            { amount: 2500 }, { amount: 5000 }, { amount: 10000 },
            { amount: 25000 }, { amount: 50000 }, { amount: 100000 },
            { amount: 250000 },
        ],
    },
    {
        id: "saas-usage",
        name: "SaaS Usage-Based",
        description: "Per-unit pricing: $0.005 per API call, minimum $1",
        icon: "☁️",
        rule: {
            "max": [
                { "*": [{ "var": "amount" }, 0.005] },
                1
            ]
        },
        sampleTransactions: [
            { amount: 50 }, { amount: 100 }, { amount: 500 },
            { amount: 1000 }, { amount: 5000 }, { amount: 10000 },
            { amount: 50000 }, { amount: 100000 }, { amount: 500000 },
            { amount: 1000000 },
        ],
    },
    {
        id: "staircase-volume",
        name: "Staircase Volume",
        description: "4-level volume discount: >$50K → 1%, >$10K → 2%, >$5K → 2.5%, default → 3%",
        icon: "📊",
        rule: {
            "if": [
                { ">": [{ "var": "amount" }, 50000] },
                { "*": [{ "var": "amount" }, 0.01] },
                {
                    "if": [
                        { ">": [{ "var": "amount" }, 10000] },
                        { "*": [{ "var": "amount" }, 0.02] },
                        {
                            "if": [
                                { ">": [{ "var": "amount" }, 5000] },
                                { "*": [{ "var": "amount" }, 0.025] },
                                { "*": [{ "var": "amount" }, 0.03] }
                            ]
                        }
                    ]
                }
            ]
        },
        sampleTransactions: [
            { amount: 1000 }, { amount: 3000 }, { amount: 5500 },
            { amount: 8000 }, { amount: 12000 }, { amount: 25000 },
            { amount: 40000 }, { amount: 55000 }, { amount: 75000 },
            { amount: 100000 },
        ],
    },
];
