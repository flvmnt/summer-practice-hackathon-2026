const isDemoSeedEnabled =
  process.env.ALLOW_DEMO_SEED === "true" &&
  process.env.DEMO_SEED_CONFIRM === "showup2move";

if (!isDemoSeedEnabled) {
  console.error("Demo seed is disabled. Set ALLOW_DEMO_SEED=true and DEMO_SEED_CONFIRM=showup2move.");
  process.exit(1);
}

console.log("Demo seed placeholder. Later phases add demo-owned rows only.");
