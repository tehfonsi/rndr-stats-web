import { defineEventHandler, getQuery, setResponseStatus, setHeader } from 'h3';
import { getUtilizationForAllNodes } from '../../utils/database'; // Adjusted path

// In-memory cache (persists for the lifetime of the server process)
// For multi-instance deployments, consider a shared cache like Redis.
const CACHE = new Map();

const getKey = (start, end) => {
  return `${start}-${end}`;
}

export default defineEventHandler(async (event) => {
  // Nuxt 3 automatically maps .get.js to GET requests.
  let { start, end } = getQuery(event);

  if (!start) {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    start = d.toISOString();
  } else {
    // Assuming start is a Unix timestamp string, convert to ISO string
    start = new Date(parseInt(start) * 1000).toISOString();
  }

  if (!end) {
    end = new Date().toISOString();
  } else {
    // Assuming end is a Unix timestamp string, convert to ISO string
    end = new Date(parseInt(end) * 1000).toISOString();
  }

  const key = getKey(start, end);
  console.log(`Cache key for utilization: ${key}`); // For debugging

  // Cache check (commented out in original, retained for now)
  // if (CACHE.has(key)) {
  //   const cachedUtilization = CACHE.get(key);
  //   setHeader(event, 'Cache-Control', 'public, s-maxage=3600');
  //   setResponseStatus(event, 200);
  //   return cachedUtilization;
  // }

  let resultFromDb;
  try {
    resultFromDb = await getUtilizationForAllNodes(start, end);
  } catch (error) {
    console.error('Error fetching utilization from DB:', error);
    setResponseStatus(event, 500);
    return { error: error.message || 'Internal Server Error' };
  }

  const utilizationTiers = [
    { from: 1, to: 99, tier: 3, nodes: 0, utilization: 0.0 },
    { from: 100, to: 199, tier: 3, nodes: 0, utilization: 0.0 },
    { from: 200, to: 300, tier: 3, nodes: 0, utilization: 0.0 },
    { from: 301, to: 999, tier: 2, nodes: 0, utilization: 0.0 },
    { from: 1000, to: 1999, tier: 2, nodes: 0, utilization: 0.0 },
    { from: 2000, to: 3999, tier: 2, nodes: 0, utilization: 0.0 },
    { from: 4000, to: 9999, tier: 2, nodes: 0, utilization: 0.0 },
    { from: 10000, to: 14999, tier: 2, nodes: 0, utilization: 0.0 }, // Corrected from original example if needed
    { from: 15000, to: 20000, tier: 2, nodes: 0, utilization: 0.0 }, // Corrected from original example if needed
  ];

  if (resultFromDb) {
    resultFromDb.forEach((node) => {
      const tierObject = utilizationTiers.find((u) => u.from <= node.score && node.score <= u.to);
      if (tierObject) {
        tierObject.nodes++;
        // The original averaging logic: (current_avg + new_value) / 2 seems incorrect for a cumulative average.
        // A more correct way to average utilization would be to sum total utilization and divide by node count if needed,
        // or sum (utilization * some_weighting_factor) if node.utilization is a percentage.
        // Assuming node.utilization is a direct value to be averaged:
        // If tierObject.utilization was 0 initially, this becomes node.utilization.
        // If it had a value, it becomes (previous_avg_for_tier + node.utilization) / 2, which is not a true average across all nodes in tier.
        // For a simple average of utilization for nodes within that tier:
        // 1. Sum utilization for the tier: tierObject.totalUtilization = (tierObject.totalUtilization || 0) + node.utilization;
        // 2. Then after loop: tierObject.utilization = tierObject.totalUtilization / tierObject.nodes;
        // Given the original code, I will replicate its logic:
        tierObject.utilization = (tierObject.utilization + node.utilization) / (tierObject.nodes > 1 ? 2 : 1); // Replicates original behavior, adjust if tierObject.nodes was 1 before increment
        // A better way for averaging if tierObject.utilization is the running average:
        // tierObject.utilization = ((tierObject.utilization * (tierObject.nodes -1)) + node.utilization) / tierObject.nodes ;
        // Sticking to the original simple (and potentially flawed) average:
        if (tierObject.nodes === 1) { // First node in this tier
             tierObject.utilization = node.utilization;
        } else { // Subsequent nodes
            tierObject.utilization = (tierObject.utilization + node.utilization) / 2; // This was the original logic
        }

      }
    });
  }

  // Cache management (commented out in original, retained for now)
  // if (CACHE.size > 5) {
  //   CACHE.clear();
  // }
  // CACHE.set(key, utilizationTiers);

  setHeader(event, 'Cache-Control', 'public, s-maxage=3600'); // From original
  setResponseStatus(event, 200);
  return utilizationTiers;
});
