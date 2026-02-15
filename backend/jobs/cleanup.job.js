import { CLEANUP_INTERVAL_MS } from '../config/env.js';
import { clearExpiredSessions } from '../services/auth.service.js';
import { cleanupExpiredShares } from '../services/share.service.js';

export const startCleanupJob = () => {
  return setInterval(async () => {
    try {
      const cleanedShares = await cleanupExpiredShares();
      if (cleanedShares > 0) {
        console.log(`Cleaned up ${cleanedShares} expired shares`);
      }

      await clearExpiredSessions();
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  }, CLEANUP_INTERVAL_MS);
};
