import NodeCache from 'node-cache';

// stdTTL: time-to-live in seconds for every new entry
// checkperiod: period in seconds to check for expiring entries
export const cache = new NodeCache({ stdTTL: 300, checkperiod: 600 }); 