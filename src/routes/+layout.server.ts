import { db, userFromSessionID } from '$lib/server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
  const connectionCount = (
    (await db.$queryRaw`SELECT sum(numbackends) FROM pg_stat_database;`) as any
  )[0].sum as number;

  if (connectionCount > 100) await db.$disconnect();

  // Pobieramy pełne dane użytkownika wraz z ekwipunkiem za pomocą wbudowanej funkcji projektu
  let userInventory: any[] = [];
  const sessionId = cookies.get('session_id');
  
  if (sessionId) {
    const fullUser = await userFromSessionID(sessionId, true);
    if (fullUser && 'inventory' in fullUser) {
      userInventory = (fullUser as any).inventory;
    }
  }

  return {
    connectionCount: connectionCount,
    lang: locals.lang as 'pl' | 'en',
    user: locals.user,
    userInventory
  };
};