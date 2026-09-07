// Node.js 18+ (uses built-in fetch)

const apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptaGRxdHdxdWl6bnNwbGNsd3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1OTk0MzYsImV4cCI6MjA1OTE3NTQzNn0.ypGAundMU_FojEJ-Rc68wYI-XAi_KgVDVWA2DBeDp6c";
const token = "eyJhbGciOiJIUzI1NiIsImtpZCI6ImJGQXBSSGhtbklKcHVCck8iLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3ptaGRxdHdxdWl6bnNwbGNsd3NlLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJiOTI2YzNjNy0wNjJlLTQ3ODYtYjAyMi05NTdlNzI1ZjFhOGEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzgzODgwMDM5LCJpYXQiOjE3ODM4NzY0MzksImVtYWlsIjoiamF5YW50aGJoYXJhZHdham1AZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3ODM2NjI4OTh9XSwic2Vzc2lvbl9pZCI6IjM1YzcyMWVkLTUwYzYtNDI3My04ZDM1LWRjMzE3Y2E0OGNjMiIsImlzX2Fub255bW91cyI6ZmFsc2V9.ZpUMb99rREtMDgVhiIcHUyOlZpyLLTFrWsGREkZ6CxE";

const url =
  "https://zmhdqtwquiznsplclwse.supabase.co/rest/v1/transactions" +
  "?columns=id,amount,description,transaction_timestamp,category_id,payee_id,group_id,type,user_id,product_link";

const transactions = [
  {
    id: crypto.randomUUID(),
    amount: 41.8,
    description: "Self-Adhesive Wall Hook (Qty: 10)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/7432-tan-wall-sticker-hook-m-used-for-hanging-various-types-of-items-and-stuffs?variant=45527194108214"
  },
  {
    id: crypto.randomUUID(),
    amount: 104.5,
    description: "Drain Cleaner Sachet 50g (Qty: 5)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/powerful-drain-cleaner-sachet-fast-acting-clog-remover-for-kitchen-sinks-50-gm?variant=53110127821110"
  },
  {
    id: crypto.randomUUID(),
    amount: 59.85,
    description: "Nylon Cable Ties 10-inch Pack (Qty: 1)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/3141-10inch-nylon-self-locking-cable-ties-heavy-duty-strong-zip-wire-tie-pack-of-100-black?variant=45513586016566"
  },
  {
    id: crypto.randomUUID(),
    amount: 38.0,
    description: "Nylon Cable Ties 6-inch Pack (Qty: 1)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/3139-6inch-nylon-self-locking-cable-ties-heavy-duty-strong-zip-wire-tie-pack-of-100-black-1?variant=45513588572470"
  },
  {
    id: crypto.randomUUID(),
    amount: 585.2,
    description: "Cloth Organizer (Qty: 11)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/6129-1-pc-cloth-organiser-used-in-all-household-and-ironing-shops-in-order-to-assemble-the-cloths-and-fabric-in-a-well-mannered-way-1?variant=45527315054902"
  },
  {
    id: crypto.randomUUID(),
    amount: 56.05,
    description: "Brown Cello Tape 60m (Qty: 1)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/brown-cello-tape-for-box-sealing-packing-and-shipping-use-60-mtr?variant=54123089199414"
  },
  {
    id: crypto.randomUUID(),
    amount: 88.35,
    description: "Double Sided Transparent Mesh Tape (Qty: 1)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/strong-adhesive-double-sided-tape-transparent-grid-mesh-5cm-x-10m-1-pc?variant=54147490283830"
  },
  {
    id: crypto.randomUUID(),
    amount: 45.6,
    description: "Baby Safety Corner Protector Set (Qty: 2)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/baby-safety-corner-protector-edge-guard-soft-silicone-for-furniture-4-pc-set?variant=54180146970934"
  },
  {
    id: crypto.randomUUID(),
    amount: 35.15,
    description: "Double Sided Foam Mounting Tape (Qty: 1)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/medium-strong-double-sided-tape-foam-mounting-tape-1-pc-medium?variant=51536614359350"
  },
  {
    id: crypto.randomUUID(),
    amount: 86.45,
    description: "Peacock Design Floor Mat (Qty: 1)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/peacock-design-round-floor-mat-58x58-cm-copy?variant=53956634444086"
  },
  {
    id: crypto.randomUUID(),
    amount: 19.0,
    description: "Anti-Snoring Nose Clip (Qty: 1)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/338-snore-free-nose-clip-anti-snoring-device-1pc?variant=45529726583094"
  },
  {
    id: crypto.randomUUID(),
    amount: 65.55,
    description: "Limescale Remover Liquid 300ml (Qty: 1)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/eyelet-tap-shower-limescale-remover-liquid-cleaner-for-bathroom-taps-shower-heads-fittings-300ml?variant=53581486326070"
  },
  {
    id: crypto.randomUUID(),
    amount: 39.9,
    description: "Drain Cleaner Powder 50g (Qty: 2)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/1383-all-pipe-safe-drain-cleaner-powder-clear-clogged-sinks-pipes-50-gram-pack?variant=45529400410422"
  },
  {
    id: crypto.randomUUID(),
    amount: 8.55,
    description: "Anti-Snore Magnetic Nose Clip (Qty: 1)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/anti-snore-device-for-men-and-woman-silicone-magnetic-nose-clip-for-heavy-snoring-sleeper-snore-stopper-anti-snoring-device-1-pc-1?variant=52167913472310"
  },
  {
    id: crypto.randomUUID(),
    amount: 19.95,
    description: "Silicone Noise Reduction Earplugs (Qty: 1)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/premium-layered-silicone-noise-reduction-earplugs-1-pair?variant=52949768241462"
  },
  {
    id: crypto.randomUUID(),
    amount: 35.15,
    description: "Microfiber Cleaning Cloth 40×30 cm (Qty: 1)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/premium-microfiber-cleaning-cloth-towel-40x30-cm-1-pc?variant=52899786752310"
  },
  {
    id: crypto.randomUUID(),
    amount: 39.9,
    description: "Mini Cloud Box Cutter (Qty: 2)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/mini-cloud-cutter-portable-safe-box-opener-multiple-uses-1-pc?variant=51670620242230"
  },
  {
    id: crypto.randomUUID(),
    amount: 57.0,
    description: "Small Card Holder Wallet (Qty: 2)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/small-card-holder-wallet-compact-slim-credit-card-case-money-organizer-1-pc?variant=54068603978038"
  },
  {
    id: crypto.randomUUID(),
    amount: 42.75,
    description: "Soft Foam Noise Cancelling Earplugs (3 Pairs) (Qty: 1)",
    transaction_timestamp: "2026-07-11T10:51:00",
    category_id: "02588500-b374-4796-920c-1a149423a5d2",
    payee_id: "ad15544f-ff9b-4b08-b59e-94da1645f5e3",
    group_id: null,
    type: "Expense",
    user_id: "b926c3c7-062e-4786-b022-957e725f1a8a",
    product_link: "https://deodap.in/products/soft-foam-noise-cancelling-earplugs-3-pairs?variant=49374473912630"
  }
];

async function bulkInsert() {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(transactions),
  });

  if (!res.ok) {
    console.error(await res.text());
    return;
  }

  const data = await res.json();
  console.log(`Inserted ${data.length} transactions`);
  console.log(data);
}

bulkInsert().catch(console.error);