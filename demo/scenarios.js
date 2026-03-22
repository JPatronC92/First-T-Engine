/**
 * Pre-configured pricing scenarios for the Tempus Engine demo
 * Each scenario includes rules, default values, and explanations
 */

const SCENARIOS = {
    marketplace: {
        name: "Marketplace",
        description: "Payment method fees for multi-vendor marketplaces",
        icon: "🏪",
        currency: "MXN",
        fields: [
            {
                name: "payment_method",
                label: "Payment Method",
                type: "select",
                options: [
                    { value: "credit_card", label: "Credit Card (3.5%)", help: "Visa/Mastercard with processing" },
                    { value: "debit_card", label: "Debit Card (1.5%)", help: "Immediate debit" },
                    { value: "spei", label: "SPEI Transfer (1.0%)", help: "Bank transfer" },
                    { value: "oxxo", label: "OXXO Pay (2.5%)", help: "Cash payment" },
                ],
                default: "credit_card"
            },
            {
                name: "installments",
                label: "Installments (Meses)",
                type: "select",
                options: [
                    { value: 1, label: "1 (Cash)", help: "No MSI" },
                    { value: 3, label: "3 MSI", help: "3 months interest-free" },
                    { value: 6, label: "6 MSI", help: "6 months + extra fee" },
                    { value: 12, label: "12 MSI", help: "12 months + higher fee" },
                ],
                default: 1
            }
        ],
        rules: [
            {
                name: "Base Commission",
                type: "percentage",
                logic: {
                    "if": [
                        { "==": [{ "var": "payment_method" }, "credit_card"] },
                        { "*": [{ "var": "amount" }, 0.035] },
                        { "if": [
                            { "==": [{ "var": "payment_method" }, "debit_card"] },
                            { "*": [{ "var": "amount" }, 0.015] },
                            { "if": [
                                { "==": [{ "var": "payment_method" }, "spei"] },
                                { "*": [{ "var": "amount" }, 0.010] },
                                { "*": [{ "var": "amount" }, 0.025] }
                            ]}
                        ]}
                    ]
                },
                explanation: "Different rates based on payment method risk and processing costs"
            },
            {
                name: "MSI Installment Fee",
                type: "fixed",
                logic: {
                    "if": [
                        { ">": [{ "var": "installments" }, 1] },
                        { "*": [{ "var": "installments" }, 0.5] },
                        0
                    ]
                },
                explanation: "Extra fee for monthly installments (MSI) to cover financing costs"
            }
        ],
        calculate: (data) => {
            const amount = parseFloat(data.amount);
            const method = data.payment_method;
            const installments = parseInt(data.installments) || 1;

            let baseRate;
            switch(method) {
                case "credit_card": baseRate = 0.035; break;
                case "debit_card": baseRate = 0.015; break;
                case "spei": baseRate = 0.010; break;
                case "oxxo": baseRate = 0.025; break;
                default: baseRate = 0.035;
            }

            const baseFee = amount * baseRate;
            const installmentFee = installments > 1 ? installments * 0.5 : 0;

            return {
                fees: [
                    { name: "Base Commission", amount: baseFee },
                    ...(installments > 1 ? [{ name: "MSI Installment Fee", amount: installmentFee }] : [])
                ],
                totalFees: baseFee + installmentFee,
                netSettlement: amount - (baseFee + installmentFee)
            };
        }
    },

    saas: {
        name: "SaaS Usage-Based",
        description: "API call pricing with tiered discounts",
        icon: "💻",
        currency: "USD",
        fields: [
            {
                name: "api_calls",
                label: "API Calls This Month",
                type: "number",
                default: 50000,
                min: 0,
                step: 1000,
                help: "Number of API requests"
            },
            {
                name: "plan",
                label: "Pricing Plan",
                type: "select",
                options: [
                    { value: "startup", label: "Startup (no discount)", help: "Pay as you go" },
                    { value: "growth", label: "Growth (20% discount)", help: "$500/month commitment" },
                    { value: "enterprise", label: "Enterprise (40% discount)", help: "$5000/month commitment" },
                ],
                default: "startup"
            }
        ],
        rules: [
            {
                name: "Tiered Pricing",
                type: "tiered",
                logic: {
                    "if": [
                        { "<=": [{ "var": "api_calls" }, 10000] },
                        { "*": [{ "var": "api_calls" }, 0.01] },
                        { "<=": [{ "var": "api_calls" }, 100000] },
                        {
                            "+": [
                                { "*": [10000, 0.01] },
                                { "*": [{ "-": [{ "var": "api_calls" }, 10000] }, 0.008] }
                            ]
                        },
                        {
                            "+": [
                                { "*": [10000, 0.01] },
                                { "*": [90000, 0.008] },
                                { "*": [{ "-": [{ "var": "api_calls" }, 100000] }, 0.005] }
                            ]
                        }
                    ]
                },
                explanation: "Tiered pricing: $0.01 for first 10k, $0.008 for next 90k, $0.005 beyond"
            },
            {
                name: "Plan Discount",
                type: "percentage",
                logic: {
                    "if": [
                        { "==": [{ "var": "plan" }, "enterprise"] },
                        { "*": [{ "var": "tiered_amount" }, -0.40] },
                        { "if": [
                            { "==": [{ "var": "plan" }, "growth"] },
                            { "*": [{ "var": "tiered_amount" }, -0.20] },
                            0
                        ]}
                    ]
                },
                explanation: "Volume discounts based on commitment level"
            }
        ],
        calculate: (data) => {
            const calls = parseInt(data.api_calls) || 0;
            const plan = data.plan;

            // Tiered calculation
            let baseAmount;
            if (calls <= 10000) {
                baseAmount = calls * 0.01;
            } else if (calls <= 100000) {
                baseAmount = (10000 * 0.01) + ((calls - 10000) * 0.008);
            } else {
                baseAmount = (10000 * 0.01) + (90000 * 0.008) + ((calls - 100000) * 0.005);
            }

            // Apply discount
            let discountRate = 0;
            if (plan === "enterprise") discountRate = 0.40;
            else if (plan === "growth") discountRate = 0.20;

            const discount = baseAmount * discountRate;
            const finalAmount = baseAmount - discount;

            return {
                fees: [
                    { name: "Base Usage", amount: baseAmount },
                    ...(discount > 0 ? [{ name: "Plan Discount", amount: -discount }] : [])
                ],
                totalFees: finalAmount,
                netSettlement: 0 // SaaS model: they pay us
            };
        }
    },

    fintech: {
        name: "Fintech Mexico",
        description: "SPEI transfers with ISR/IVA withholding",
        icon: "🏦",
        currency: "MXN",
        fields: [
            {
                name: "transfer_type",
                label: "Transfer Type",
                type: "select",
                options: [
                    { value: "spei", label: "SPEI (Same Day)", help: "$5 flat + 0.5%" },
                    { value: "sie",
                        "label": "SIE (Next Day)",
                        "help": "$3 flat + 0.3%"
                    },
                    { value: "international", label: "SWIFT", help: "$25 + 1.5%" },
                ],
                default: "spei"
            },
            {
                name: "is_business",
                label: "Business Account?",
                type: "checkbox",
                help: "Apply ISR withholding for businesses"
            }
        ],
        rules: [
            {
                name: "Transfer Fee",
                type: "mixed",
                logic: {
                    "if": [
                        { "==": [{ "var": "transfer_type" }, "spei"] },
                        { "+": [5, { "*": [{ "var": "amount" }, 0.005] }] },
                        { "if": [
                            { "==": [{ "var": "transfer_type" }, "sie"] },
                            { "+": [3, { "*": [{ "var": "amount" }, 0.003] }] },
                            { "+": [25, { "*": [{ "var": "amount" }, 0.015] }] }
                        ]}
                    ]
                },
                explanation: "Flat fee + percentage based on transfer urgency"
            },
            {
                name: "IVA (16%)",
                type: "tax",
                logic: {
                    "*": [{ "var": "transfer_fee" }, 0.16]
                },
                explanation: "Value Added Tax on financial services"
            },
            {
                name: "ISR Withholding",
                type: "tax",
                logic: {
                    "if": [
                        { "==": [{ "var": "is_business" }, true] },
                        { "*": [{ "var": "amount" }, 0.015] },
                        0
                    ]
                },
                explanation: "Income tax withholding for business accounts (1.5%)"
            }
        ],
        calculate: (data) => {
            const amount = parseFloat(data.amount);
            const type = data.transfer_type;
            const isBusiness = data.is_business === "on" || data.is_business === true;

            let flatFee, percentage;
            switch(type) {
                case "spei": flatFee = 5; percentage = 0.005; break;
                case "sie": flatFee = 3; percentage = 0.003; break;
                case "international": flatFee = 25; percentage = 0.015; break;
                default: flatFee = 5; percentage = 0.005;
            }

            const transferFee = flatFee + (amount * percentage);
            const iva = transferFee * 0.16;
            const isr = isBusiness ? amount * 0.015 : 0;

            const totalFees = transferFee + iva + isr;

            return {
                fees: [
                    { name: "Transfer Fee", amount: transferFee },
                    { name: "IVA (16%)", amount: iva },
                    ...(isr > 0 ? [{ name: "ISR Withholding (1.5%)", amount: isr }] : [])
                ],
                totalFees: totalFees,
                netSettlement: amount - totalFees
            };
        }
    },

    volume: {
        name: "Volume Pricing",
        description: "Enterprise discounts based on annual commitment",
        icon: "📊",
        currency: "USD",
        fields: [
            {
                name: "seats",
                label: "Number of Seats",
                type: "number",
                default: 100,
                min: 1,
                step: 1,
                help: "User seats required"
            },
            {
                name: "tier",
                label: "Commitment Tier",
                type: "select",
                options: [
                    { value: "monthly", label: "Monthly ($50/seat)", help: "No commitment" },
                    { value: "annual", label: "Annual ($40/seat)", help: "20% discount" },
                    { value: "enterprise", label: "Enterprise ($30/seat)", help: "40% discount, min 100 seats" },
                ],
                default: "monthly"
            },
            {
                name: "addons",
                label: "Add-ons",
                type: "multiselect",
                options: [
                    { value: "support", label: "Priority Support ($500)", help: "24/7 support" },
                    { value: "sla", label: "Enterprise SLA ($1000)", help: "99.99% uptime" },
                    { value: "training", label: "Training ($2000)", help: "On-site training" },
                ]
            }
        ],
        rules: [
            {
                name: "Seat Pricing",
                type: "tiered",
                logic: {
                    "*": [
                        { "var": "seats" },
                        { "if": [
                            { "==": [{ "var": "tier" }, "enterprise"] },
                            30,
                            { "if": [
                                { "==": [{ "var": "tier" }, "annual"] },
                                40,
                                50
                            ]}
                        ]}
                    ]
                },
                explanation: "Per-seat pricing based on commitment level"
            },
            {
                name: "Volume Bonus",
                type: "discount",
                logic: {
                    "if": [
                        { ">=": [{ "var": "seats" }, 500] },
                        { "*": [{ "var": "seat_total" }, -0.10] },
                        0
                    ]
                },
                explanation: "Additional 10% discount for 500+ seats"
            }
        ],
        calculate: (data) => {
            const seats = parseInt(data.seats) || 1;
            const tier = data.tier;
            const addons = data.addons || [];

            let seatPrice;
            switch(tier) {
                case "enterprise": seatPrice = 30; break;
                case "annual": seatPrice = 40; break;
                default: seatPrice = 50;
            }

            let seatTotal = seats * seatPrice;

            // Volume bonus
            let volumeDiscount = 0;
            if (seats >= 500) {
                volumeDiscount = seatTotal * 0.10;
                seatTotal -= volumeDiscount;
            }

            // Add-ons
            let addonTotal = 0;
            const addonPrices = { support: 500, sla: 1000, training: 2000 };
            const addonFees = [];

            if (Array.isArray(addons)) {
                addons.forEach(addon => {
                    if (addonPrices[addon]) {
                        addonTotal += addonPrices[addon];
                        addonFees.push({
                            name: addon.charAt(0).toUpperCase() + addon.slice(1),
                            amount: addonPrices[addon]
                        });
                    }
                });
            }

            const totalFees = seatTotal + addonTotal;

            return {
                fees: [
                    { name: "Seat License", amount: seats * seatPrice },
                    ...(volumeDiscount > 0 ? [{ name: "Volume Discount", amount: -volumeDiscount }] : []),
                    ...addonFees
                ],
                totalFees: totalFees,
                netSettlement: 0
            };
        }
    }
};

// Export for use in app.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SCENARIOS;
}
