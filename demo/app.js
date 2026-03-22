/**
 * Tempus Engine Demo Application
 * Interactive demonstration of the pricing engine
 */

// Global state
let currentScenario = 'marketplace';
let lastResult = null;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initializeDatePicker();
    setupEventListeners();
    loadScenario('marketplace');
});

// Initialize date picker with current date/time
function initializeDatePicker() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('executionDate').value = now.toISOString().slice(0, 16);
}

// Setup all event listeners
function setupEventListeners() {
    // Scenario cards
    document.querySelectorAll('.scenario-card').forEach(card => {
        card.addEventListener('click', () => {
            const scenario = card.dataset.scenario;
            setActiveScenario(scenario);
        });
    });

    // Calculate button
    document.getElementById('calculateBtn').addEventListener('click', handleCalculate);

    // Batch button
    document.getElementById('batchBtn').addEventListener('click', handleBatchSimulation);

    // Code tabs
    document.querySelectorAll('.code-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            setActiveCodeTab(tab.dataset.lang);
        });
    });

    // Copy code button
    document.getElementById('copyCodeBtn').addEventListener('click', copyCodeToClipboard);
}

// Set active scenario
function setActiveScenario(scenario) {
    currentScenario = scenario;

    // Update UI
    document.querySelectorAll('.scenario-card').forEach(card => {
        card.classList.toggle('active', card.dataset.scenario === scenario);
    });

    // Load scenario data
    loadScenario(scenario);
}

// Load scenario configuration
function loadScenario(scenarioKey) {
    const scenario = SCENARIOS[scenarioKey];
    if (!scenario) return;

    // Update scenario indicator
    document.getElementById('currentScenario').textContent = scenario.name;

    // Update currency
    document.getElementById('currency').value = scenario.currency;

    // Render dynamic fields
    renderDynamicFields(scenario.fields);

    // Render rules
    renderRules(scenario.rules, scenario.description);

    // Clear previous results
    clearResults();
}

// Render dynamic configuration fields
function renderDynamicFields(fields) {
    const container = document.getElementById('dynamicFields');
    container.innerHTML = '';

    fields.forEach(field => {
        const section = document.createElement('div');
        section.className = 'config-section';

        const label = document.createElement('label');
        label.className = 'config-label';
        label.innerHTML = `${field.label}${field.help ? `\n                \u003cspan class="help-text"\u003e${field.help}\u003c/span\u003e` : ''}`;

        let input;
        if (field.type === 'select') {
            input = document.createElement('select');
            input.className = 'input';
            field.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                input.appendChild(option);
            });
        } else if (field.type === 'number') {
            input = document.createElement('input');
            input.type = 'number';
            input.className = 'input';
            input.min = field.min || 0;
            input.step = field.step || 1;
        } else if (field.type === 'checkbox') {
            input = document.createElement('input');
            input.type = 'checkbox';
            input.style.marginRight = '0.5rem';
            const labelWrapper = document.createElement('label');
            labelWrapper.style.display = 'flex';
            labelWrapper.style.alignItems = 'center';
            labelWrapper.appendChild(input);
            labelWrapper.appendChild(document.createTextNode(field.label));
            section.appendChild(labelWrapper);
            container.appendChild(section);
            return;
        } else if (field.type === 'multiselect') {
            input = document.createElement('div');
            input.style.display = 'flex';
            input.style.flexDirection = 'column';
            input.style.gap = '0.5rem';
            field.options.forEach(opt => {
                const wrapper = document.createElement('label');
                wrapper.style.display = 'flex';
                wrapper.style.alignItems = 'center';
                wrapper.style.gap = '0.5rem';
                wrapper.style.cursor = 'pointer';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = field.name;
                checkbox.value = opt.value;

                const text = document.createElement('span');
                text.textContent = opt.label;

                wrapper.appendChild(checkbox);
                wrapper.appendChild(text);
                input.appendChild(wrapper);
            });
        }

        input.id = field.name;
        if (field.default !== undefined) {
            input.value = field.default;
        }

        section.appendChild(label);
        section.appendChild(input);
        container.appendChild(section);
    });
}

// Render pricing rules
function renderRules(rules, explanation) {
    const container = document.getElementById('rulesContainer');
    container.innerHTML = '';

    rules.forEach(rule => {
        const ruleEl = document.createElement('div');
        ruleEl.className = 'rule-item';

        const header = document.createElement('div');
        header.className = 'rule-header';

        const name = document.createElement('span');
        name.className = 'rule-name';
        name.textContent = rule.name;

        const type = document.createElement('span');
        type.className = 'rule-type';
        type.textContent = rule.type;

        header.appendChild(name);
        header.appendChild(type);

        const logic = document.createElement('pre');
        logic.className = 'rule-logic';
        logic.textContent = JSON.stringify(rule.logic, null, 2);

        const expl = document.createElement('div');
        expl.style.marginTop = '0.5rem';
        expl.style.fontSize = '0.75rem';
        expl.style.color = 'var(--gray-500)';
        expl.textContent = rule.explanation;

        ruleEl.appendChild(header);
        ruleEl.appendChild(logic);
        ruleEl.appendChild(expl);
        container.appendChild(ruleEl);
    });

    // Update explanation
    document.getElementById('rulesExplanation').textContent = explanation;
}

// Handle calculate button
function handleCalculate() {
    const scenario = SCENARIOS[currentScenario];
    const data = collectFormData(scenario.fields);

    // Calculate fees
    const result = scenario.calculate(data);
    lastResult = { ...result, scenario: currentScenario, data };

    // Display results
    displayResults(result, data, scenario.currency);

    // Show code export
    showCodeExport(data, result);
}

// Collect form data
function collectFormData(fields) {
    const data = {
        amount: document.getElementById('amount').value,
        currency: document.getElementById('currency').value
    };

    fields.forEach(field => {
        const el = document.getElementById(field.name);
        if (field.type === 'checkbox') {
            data[field.name] = el ? el.checked : false;
        } else if (field.type === 'multiselect') {
            const checkboxes = el.querySelectorAll('input:checked');
            data[field.name] = Array.from(checkboxes).map(cb => cb.value);
        } else {
            data[field.name] = el ? el.value : field.default;
        }
    });

    return data;
}

// Display calculation results
function displayResults(result, data, currency) {
    // Hide empty state
    document.getElementById('emptyState').style.display = 'none';

    // Show result sections
    document.getElementById('resultSummary').style.display = 'block';
    document.getElementById('feeBreakdown').style.display = 'block';
    document.getElementById('auditSection').style.display = 'block';

    // Update status
    document.getElementById('resultStatus').textContent = 'Calculated';

    // Format currency
    const fmt = (num) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(num);

    // Update summary
    document.getElementById('baseAmount').textContent = fmt(data.amount);
    document.getElementById('totalFees').textContent = fmt(result.totalFees);
    document.getElementById('netSettlement').textContent = fmt(result.netSettlement);

    const effectiveRate = (result.totalFees / parseFloat(data.amount) * 100).toFixed(2);
    document.getElementById('effectiveRate').textContent = `${effectiveRate}%`;

    // Update fee breakdown
    const feeList = document.getElementById('feeList');
    feeList.innerHTML = '';

    result.fees.forEach(fee => {
        const item = document.createElement('div');
        item.className = 'fee-item';

        const name = document.createElement('span');
        name.className = 'fee-name';
        name.textContent = fee.name;

        const amount = document.createElement('span');
        amount.className = 'fee-amount';
        amount.textContent = fmt(fee.amount);

        item.appendChild(name);
        item.appendChild(amount);
        feeList.appendChild(item);
    });

    // Generate audit hash
    const auditData = {
        scenario: currentScenario,
        amount: data.amount,
        fees: result.fees.map(f => ({ name: f.name, amount: f.amount })),
        timestamp: new Date().toISOString()
    };
    const hash = generateHash(JSON.stringify(auditData));
    document.getElementById('auditHash').textContent = `sha256:${hash}`;
}

// Generate simple hash (for demo purposes)
function generateHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
}

// Clear results
function clearResults() {
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('resultSummary').style.display = 'none';
    document.getElementById('feeBreakdown').style.display = 'none';
    document.getElementById('auditSection').style.display = 'none';
    document.getElementById('codeExport').style.display = 'none';
    document.getElementById('batchResults').style.display = 'none';
    document.getElementById('resultStatus').textContent = 'Ready';
}

// Handle batch simulation
function handleBatchSimulation() {
    const scenario = SCENARIOS[currentScenario];
    const currency = document.getElementById('currency').value;

    // Generate 1000 sample transactions
    const batchSize = 1000;
    let totalVolume = 0;
    let totalFees = 0;

    const transactions = [];
    for (let i = 0; i < batchSize; i++) {
        const amount = Math.random() * 9000 + 100; // $100-$10,000
        const data = generateRandomTransactionData(scenario);
        data.amount = amount;

        const result = scenario.calculate(data);
        totalVolume += amount;
        totalFees += result.totalFees;

        transactions.push({
            amount: amount,
            fees: result.totalFees
        });
    }

    // Display batch results
    displayBatchResults(totalVolume, totalFees, batchSize, currency, transactions);
}

// Generate random transaction data based on scenario
function generateRandomTransactionData(scenario) {
    const data = {};

    if (scenario.fields) {
        scenario.fields.forEach(field => {
            if (field.type === 'select') {
                const randomIndex = Math.floor(Math.random() * field.options.length);
                data[field.name] = field.options[randomIndex].value;
            } else if (field.type === 'number') {
                data[field.name] = Math.floor(Math.random() * 100000) + 1000;
            } else if (field.type === 'checkbox') {
                data[field.name] = Math.random() > 0.5;
            }
        });
    }

    return data;
}

// Display batch simulation results
function displayBatchResults(volume, fees, count, currency, transactions) {
    const net = volume - fees;

    document.getElementById('batchResults').style.display = 'block';

    const fmt = (num) => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0
    }).format(num);

    document.getElementById('batchVolume').textContent = fmt(volume);
    document.getElementById('batchFees').textContent = fmt(fees);
    document.getElementById('batchNet').textContent = fmt(net);
    document.getElementById('batchCount').textContent = count.toLocaleString();

    // Create distribution chart
    createDistributionChart(transactions, currency);
}

// Create fee distribution chart
function createDistributionChart(transactions, currency) {
    const ctx = document.getElementById('distributionChart').getContext('2d');

    // Create buckets
    const buckets = [0, 0, 0, 0, 0]; // 0-1%, 1-2%, 2-3%, 3-5%, 5%+
    transactions.forEach(tx => {
        const rate = (tx.fees / tx.amount) * 100;
        if (rate < 1) buckets[0]++;
        else if (rate < 2) buckets[1]++;
        else if (rate < 3) buckets[2]++;
        else if (rate < 5) buckets[3]++;
        else buckets[4]++;
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['0-1%', '1-2%', '2-3%', '3-5%', '5%+'],
            datasets: [{
                label: 'Transaction Count',
                data: buckets,
                backgroundColor: [
                    '#10b981',
                    '#34d399',
                    '#fbbf24',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Fee Rate Distribution'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Show code export section
function showCodeExport(data, result) {
    document.getElementById('codeExport').style.display = 'block';
    updateCodeBlock('python');
}

// Set active code tab
function setActiveCodeTab(lang) {
    document.querySelectorAll('.code-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.lang === lang);
    });
    updateCodeBlock(lang);
}

// Update code block content
function updateCodeBlock(lang) {
    const data = lastResult ? lastResult.data : null;
    const scenario = SCENARIOS[currentScenario];
    const codeBlock = document.getElementById('codeBlock');

    let code = '';
    const executionDate = document.getElementById('executionDate').value || new Date().toISOString();

    switch(lang) {
        case 'python':
            code = `from tempus import TempusClient
from datetime import datetime

# Initialize client
client = TempusClient(
    api_key="your-api-key",
    base_url="http://localhost:8000/api/v1"
)

# Calculate fee
result = client.calculate(
    scheme_urn="urn:pricing:${currentScenario}:standard",
    execution_date="${executionDate}",
    transaction={
        "amount": ${data ? data.amount : 1000},
        "currency": "${data ? data.currency : 'MXN'}"${Object.keys(data || {}).filter(k => !['amount', 'currency'].includes(k)).map(k => `,\n        "${k}": "${data[k]}"`).join('')}
    }
)

print(f"Total fees: {result.total_fees}")
print(f"Net settlement: {result.net_settlement}")
print(f"Audit hash: {result.cryptographic_hash}")`;
            break;

        case 'nodejs':
            code = `import { TempusClient } from "tempus-node";

const client = new TempusClient({
  apiKey: "your-api-key",
  baseURL: "http://localhost:8000/api/v1"
});

const result = await client.calculate({
  scheme_urn: "urn:pricing:${currentScenario}:standard",
  execution_date: new Date("${executionDate}"),
  transaction: {
    amount: ${data ? data.amount : 1000},
    currency: "${data ? data.currency : 'MXN'}"${Object.keys(data || {}).filter(k => !['amount', 'currency'].includes(k)).map(k => `,\n    ${k}: "${data[k]}"`).join('')}
  }
});

console.log(\`Total fees: \${result.total_fees}\`);
console.log(\`Net settlement: \${result.net_settlement}\`);
console.log(\`Audit hash: \${result.cryptographic_hash}\`);`;
            break;

        case 'curl':
            code = `curl -X POST http://localhost:8000/api/v1/billing/calculate \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: your-api-key" \\
  -d '{
    "scheme_urn": "urn:pricing:${currentScenario}:standard",
    "execution_date": "${executionDate}",
    "transaction": {
      "amount": ${data ? data.amount : 1000},
      "currency": "${data ? data.currency : 'MXN'}"${Object.keys(data || {}).filter(k => !['amount', 'currency'].includes(k)).map(k => `,\n      "${k}": "${data[k]}"`).join('')}
    }
  }'`;
            break;
    }

    codeBlock.textContent = code;
}

// Copy code to clipboard
function copyCodeToClipboard() {
    const codeBlock = document.getElementById('codeBlock');
    navigator.clipboard.writeText(codeBlock.textContent).then(() => {
        const btn = document.getElementById('copyCodeBtn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}
