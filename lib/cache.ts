import NodeCache from 'node-cache';

// stdTTL: time-to-live in seconds for every new entry (15 minutes)
// checkperiod: period in seconds to check for expiring entries (20 minutes)
export const cache = new NodeCache({ stdTTL: 900, checkperiod: 1200 }); 