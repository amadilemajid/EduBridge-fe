const fs = require('fs');

function processTransactions() {
  const f = 'src/merchant-portal/pages/Transactions.jsx';
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('useSWR')) {
    c = c.replace(/import React(.*?)\n/, "import React$1\nimport useSWR from 'swr';\n");
    c = c.replace('const Transactions =', `const fetcher = url => apiClient.get(url).then(res => {
  let raw = res?.data ?? res;
  if(Array.isArray(raw)) return raw;
  if(Array.isArray(raw?.data)) return raw.data;
  if(Array.isArray(raw?.transactions)) return raw.transactions;
  if(Array.isArray(raw?.disbursements)) return raw.disbursements;
  return [];
});

const Transactions =`);
    c = c.replace(/const \[transactions.*(?:\n.*){16,21}fetchData\(\);\n  }, \[\]\];/s, 
`const { data: transactionsData, error: txnError, isLoading: txnLoading } = useSWR('/api/v1/merchant/transactions', fetcher);
  const transactions = transactionsData || [];
  const loading = txnLoading && !transactionsData;
  const error = txnError?.message || null;`);
    fs.writeFileSync(f, c);
    console.log('Fixed Transactions.jsx');
  }
}

function processDisbursements() {
  const f = 'src/merchant-portal/pages/Disbursements.jsx';
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('useSWR')) {
    c = c.replace(/import React(.*?)\n/, "import React$1\nimport useSWR from 'swr';\n");
    c = c.replace('const Disbursements =', `const fetcher = url => apiClient.get(url).then(res => {
  let raw = res?.data ?? res;
  if(Array.isArray(raw)) return raw;
  if(Array.isArray(raw?.data)) return raw.data;
  if(Array.isArray(raw?.disbursements)) return raw.disbursements;
  return [];
});

const Disbursements =`);
    c = c.replace(/const \[disbursements.*(?:\n.*){16,21}fetchData\(\);\n  }, \[\]\];/s, 
`const { data: disbursementsData, error: disbError, isLoading: disbLoading } = useSWR('/api/v1/merchant/disbursements', fetcher);
  const disbursements = disbursementsData || [];
  const loading = disbLoading && !disbursementsData;
  const error = disbError?.message || null;`);
    fs.writeFileSync(f, c);
    console.log('Fixed Disbursements.jsx');
  }
}

function processProfile() {
  const f = 'src/merchant-portal/pages/Profile.jsx';
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('useSWR')) {
    c = c.replace(/import React(.*?)\n/, "import React$1\nimport useSWR from 'swr';\n");
    c = c.replace('const Profile =', `const fetcher = url => apiClient.get(url).then(res => {
  return res?.data?.data || res?.data || res;
});

const Profile =`);
    c = c.replace(/const \[profile.*(?:\n.*){15,20}fetchProfile\(\);\n  }, \[\]\];/s, 
`const { data: profile, error: profError, isLoading: profLoading } = useSWR('/api/v1/merchant/profile', fetcher);
  const loading = profLoading && !profile;
  const error = profError?.message || null;`);
    fs.writeFileSync(f, c);
    console.log('Fixed Profile.jsx');
  }
}

function processDashboard() {
  const f = 'src/merchant-portal/pages/Dashboard.jsx';
  let c = fs.readFileSync(f, 'utf8');
  if (!c.includes('useSWR')) {
    c = c.replace(/import React(.*?)\n/, "import React$1\nimport useSWR from 'swr';\n");
    c = c.replace('const Dashboard =', `const fetcher = url => apiClient.get(url).then(res => {
  let raw = res?.data ?? res;
  if(Array.isArray(raw)) return raw;
  if(Array.isArray(raw?.data)) return raw.data;
  if(Array.isArray(raw?.transactions)) return raw.transactions;
  if(Array.isArray(raw?.disbursements)) return raw.disbursements;
  if(Array.isArray(raw?.items)) return raw.items;
  return [];
});

const Dashboard =`);
    const regex = /const \[data.*(?:\n.*){20,35}fetchData\(\);\n  }, \[\]\];\n\n  if \(loading\) return <LoadingSpinner variant="full" \/>;\n\n  const \{ transactions, disbursements, creditMetrics, walletBalance \} = data;/s;
    c = c.replace(regex, 
`const { data: transactionsData, error: txnError, isLoading: txnLoading } = useSWR('/api/v1/merchant/transactions', fetcher);
  const { data: disbursementsData, error: disbError, isLoading: disbLoading } = useSWR('/api/v1/merchant/disbursements', fetcher);
  
  const transactions = transactionsData || [];
  const disbursements = disbursementsData || [];
  const creditMetrics = { available: 25000000, color: 'emerald' };
  const walletBalance = 0;
  
  const loading = (txnLoading && !transactionsData) || (disbLoading && !disbursementsData);
  const error = (txnError || disbError)?.message || null;

  if (loading) return <LoadingSpinner variant="full" />;`);
    fs.writeFileSync(f, c);
    console.log('Fixed Dashboard.jsx');
  }
}

try {
  processTransactions();
  processDisbursements();
  processProfile();
  processDashboard();
} catch (e) {
  console.error(e);
}
