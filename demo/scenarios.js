/**
 * Pre-configured pricing scenarios for the Tempus Engine Demo
 * Universal examples applicable to any region/industry
 */

const SCENARIOS = {
    marketplace: {
        name: "Payment Gateway",
        description: "Payment processing fees for marketplaces and e-commerce",
        icon: "🏪",
        currency: "USD",
        fields: [
            {
                name: "payment_method",
                label: "Payment Method",
                type: "select",
                options: [
                    { value: "credit_card", label: "Credit Card (2.9% + $0.30)", help: "Standard card processing" },
                    { value: "debit_card", label: "Debit Card (1.5%)", help: "Lower risk, lower fee" },
                    { value: "bank_transfer", label: "Bank Transfer (1.0%)", help: "ACH or wire transfer" },
                    { value: "digital_wallet", label: "Digital Wallet (2.5%)", help: "Apple Pay, Google Pay, etc." },
                ],
                default: "credit_card"
            },
            {
                name: "risk_level",
                label: "Risk Assessment",
                type: "select",
                options: [
                    { value: "low", label: "Low Risk", help: "Verified merchant, history > 1 year" },
                    { value: "medium", label: "Medium Risk", help: "New merchant or international" },
                    { value: "high", label: "High Risk", help: "High chargeback industry" },
                ],
                default: "low"
            },
            {
                name: "installments",
                label: "Installments",
                type: "select",
                options: [
                    { value: 1, label: "Single Payment", help: "No installment fee" },
                    { value: 3, label: "3 Months", help: "Buy now pay later" },
                    { value: 6, label: "6 Months", help: "Extended financing" },
                ],
                default: 1
            }
        ],
        rules: [
            {
                name: "Base Processing Fee",
                type: "percentage",
                logic: {
                    "if": [
                        { "==": [{ "var": "payment_method" }, "credit_card"] },
                        { "+": [{ "*": [{ "var": "amount" }, 0.029] }, 0.30] },
                        { "if": [
                            { "==": [{ "var": "payment_method" }, "debit_card"] },
                            { "*": [{ "var": "amount" }, 0.015] },
                            { "if": [
                                { "==": [{ "var": "payment_method" }, "bank_transfer"] },
                                { "*": [{ "var": "amount" }, 0.010] },
                                { "*": [{ "var": "amount" }, 0.025] }
                            ]}
                        ]}
                    ]
                },
                explanation: "Base fee varies by payment method based on processing costs and risk"
            },
            {
                name: "Risk Adjustment",
                type: "percentage",
                logic: {
                    "if": [
                        { "==": [{ "var": "risk_level" }, "high"] },
                        { "*": [{ "var": "amount" }, 0.015] },
                        { "if": [
                            { "==": [{ "var": "risk_level" }, "medium"] },
                            { "*": [{ "var": "amount" }, 0.005] },
                            0
                        ]}
                    ]
                },
                explanation: "Additional fee for higher-risk merchants or transactions"
            },
            {
                name: "Installment Fee",
                type: "fixed",
                logic: {
                    "if": [
                        { ">": [{ "var": "installments" }, 1] },
                        { "*": [{ "var": "installments" }, 0.50] },
                        0
                    ]
                },
                explanation: "Per-installment fee for BNPL (Buy Now Pay Later) services"
            }
        ],
        calculate: (data) => {
            const amount = parseFloat(data.amount);
            const method = data.payment_method;
            const risk = data.risk_level;
            const installments = parseInt(data.installments) || 1;

            // Base fee calculation
            let baseFee;
            switch(method) {
                case "credit_card":
                    baseFee = (amount * 0.029) + 0.30;
                    break;
                case "debit_card":
                    baseFee = amount * 0.015;
                    break;
                case "bank_transfer":
                    baseFee = amount * 0.010;
                    break;
                case "digital_wallet":
                    baseFee = amount * 0.025;
                    break;
                default:
                    baseFee = amount * 0.029;
            }

            // Risk adjustment
            let riskFee = 0;
            if (risk === "high") riskFee = amount * 0.015;
            else if (risk === "medium") riskFee = amount * 0.005;

            // Installment fee
            const installmentFee = installments > 1 ? installments * 0.50 : 0;

            const totalFees = baseFee + riskFee + installmentFee;

            return {
                fees: [
                    { name: "Processing Fee", amount: baseFee },
                    ...(riskFee > 0 ? [{ name: "Risk Adjustment", amount: riskFee }] : []),
                    ...(installmentFee > 0 ? [{ name: "Installment Fee", amount: installmentFee }] : [])
                ],
                totalFees: totalFees,
                netSettlement: amount - totalFees
            };
        }
    },

    saas: {
        name: "SaaS Usage-Based",
        description: "API and usage-based pricing with tiered discounts",
        icon: "💻",
        currency: "USD",
        fields: [
            {
                name: "api_calls",
                label: "Monthly API Calls",
                type: "number",
                default: 50000,
                min: 0,
                step: 1000,
                help: "Number of API requests this month"
            },
            {
                name: "plan",
                label: "Pricing Plan",
                type: "select",
                options: [
                    { value: "startup", label: "Startup - Pay as you go", help: "No commitment, standard rates" },
                    { value: "growth", label: "Growth - 20% discount", help: "$500/month minimum" },
                    { value: "enterprise", label: "Enterprise - 40% discount", help: "$5000/month minimum" },
                ],
                default: "startup"
            }
        ],
        rules: [
            {
                name: "Tiered Usage",
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
                explanation: "Tiered pricing: $0.01 per call for first 10k, $0.008 for next 90k, $0.005 beyond"
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
                netSettlement: 0
            };
        }
    },

    fintech: {
        name: "Financial Services",
        description: "Cross-border transfers, FX fees, and compliance charges",
        icon: "🏦",
        currency: "USD",
        fields: [
            {
                name: "transfer_type",
                label: "Transfer Type",
                type: "select",
                options: [
                    { value: "domestic_same_day", label: "Domestic Same-Day", help: "$5 flat + 0.5%" },
                    { value: "domestic_standard", label: "Domestic Standard", help: "$3 flat + 0.3%" },
                    { value: "international", label: "International SWIFT", help: "$25 flat + 1.5%" },
                    { value: "fx_conversion", label: "FX Conversion", help: "0.5% spread" },
                ],
                default: "domestic_same_day"
            },
            {
                name: "is_business",
                label: "Business Account",
                type: "checkbox",
                help: "Apply withholding tax for business accounts"
            },
            {
                name: "compliance_level",
                label: "Compliance Level",
                type: "select",
                options: [
                    { value: "standard", label: "Standard", help: "Basic KYC verification" },
                    { value: "enhanced", label: "Enhanced", help: "Additional compliance checks + $10" },
                ],
                default: "standard"
            }
        ],
        rules: [
            {
                name: "Transfer Fee",
                type: "mixed",
                logic: {
                    "if": [
                        { "==": [{ "var": "transfer_type" }, "domestic_same_day"] },
                        { "+": [5, { "*": [{ "var": "amount" }, 0.005] }] },
                        { "if": [
                            { "==": [{ "var": "transfer_type" }, "domestic_standard"] },
                            { "+": [3, { "*": [{ "var": "amount" }, 0.003] }] },
                            { "if": [
                                { "==": [{ "var": "transfer_type" }, "international"] },
                                { "+": [25, { "*": [{ "var": "amount" }, 0.015] }] },
                                { "*": [{ "var": "amount" }, 0.005] }
                            ]}
                        ]}
                    ]
                },
                explanation: "Flat fee + percentage based on transfer urgency and destination"
            },
            {
                name: "FX Spread",
                type: "percentage",
                logic: {
                    "if": [
                        { "==": [{ "var": "transfer_type" }, "fx_conversion"] },
                        { "*": [{ "var": "amount" }, 0.005] },
                        0
                    ]
                },
                explanation: "Currency conversion spread for international transfers"
            },
            {
                name: "Compliance Fee",
                type: "fixed",
                logic: {
                    "if": [
                        { "==": [{ "var": "compliance_level" }, "enhanced"] },
                        10,
                        0
                    ]
                },
                explanation: "Additional fee for enhanced due diligence and compliance screening"
            },
            {
                name: "Business Tax Withholding",
                type: "percentage",
                logic: {
                    "if": [
                        { "==": [{ "var": "is_business" }, true] },
                        { "*": [{ "var": "amount" }, 0.015] },
                        0
                    ]
                },
                explanation: "Withholding tax for business account transfers"
            }
        ],
        calculate: (data) => {
            const amount = parseFloat(data.amount);
            const type = data.transfer_type;
            const isBusiness = data.is_business === "on" || data.is_business === true;
            const compliance = data.compliance_level;

            // Transfer fee
            let flatFee, percentage;
            switch(type) {
                case "domestic_same_day": flatFee = 5; percentage = 0.005; break;
                case "domestic_standard": flatFee = 3; percentage = 0.003; break;
                case "international": flatFee = 25; percentage = 0.015; break;
                case "fx_conversion": flatFee = 0; percentage = 0.005; break;
                default: flatFee = 5; percentage = 0.005;
            }

            const transferFee = flatFee + (amount * percentage);

            // FX spread (if applicable)
            const fxSpread = type === "fx_conversion" ? amount * 0.005 : 0;

            // Compliance fee
            const complianceFee = compliance === "enhanced" ? 10 : 0;

            // Business withholding
            const withholding = isBusiness ? amount * 0.015 : 0;

            const totalFees = transferFee + fxSpread + complianceFee + withholding;

            return {
                fees: [
                    { name: "Transfer Fee", amount: transferFee },
                    ...(fxSpread > 0 ? [{ name: "FX Spread", amount: fxSpread }] : []),
                    ...(complianceFee > 0 ? [{ name: "Compliance Check", amount: complianceFee }] : []),
                    ...(withholding > 0 ? [{ name: "Tax Withholding", amount: withholding }] : [])
                ],
                totalFees: totalFees,
                netSettlement: amount - totalFees
            };
        }
    },

    volume: {
        name: "Enterprise Volume",
        description: "Tiered enterprise pricing with volume commitments",
        icon: "📊",
        currency: "USD",
        fields: [
            {
                name: "seats",
                label: "User Seats",
                type: "number",
                default: 100,
                min: 1,
                step: 1,
                help: "Number of seats required"
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
