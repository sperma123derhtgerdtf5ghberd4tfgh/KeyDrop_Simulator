/* eslint-disable indent */
import type { CaseWithDrops, ItemWithGlobal } from '$lib/types';
import { PrismaClient, type Case, type User } from '@prisma/client';

// Używamy twardego adresu, aby uniknąć problemów z plikiem .env
const connectionString = "postgresql://postgres:kutas@localhost:5432/keydrop";

const prisma = new PrismaClient({
  datasources: {
    db: { url: connectionString }
  }
});

export const db = prisma;

export async function userFromSessionID(sessionID: string, includeInventory = false) {
  const session = await db.session.findUnique({
    where: { id: sessionID }
  });
  if (!session) return null;
  const user = await db.user.findUnique({
    where: { id: session?.userId },
    include: {
      inventory: includeInventory ? { include: { globalInvItem: true } } : false
    }
  });
  return user as User & { inventory?: ItemWithGlobal[] };
}

export async function getCaseData(caseName: string) {
  // Jeśli żądamy sekcji, pobieramy wszystko w jednej grupie
  if (caseName === 'sections') {
    const allCases = await db.case.findMany({
      orderBy: { price: 'asc' } // Skrzynki posortowane od najtańszej
    });

    // Zwracamy strukturę, której oczekuje front-end, z jedną sekcją
    return [{ 
      id: 'all-cases', 
      name: 'Wszystkie skrzynki', 
      position: 1, 
      colSpan: 6, 
      rowSpan: null, 
      ratio: 1, 
      cases: allCases 
    }];
  }

  // Obsługa pojedynczej skrzynki
  const caseObj = await db.case.findFirst({
    where: {
      OR: [{ urlName: caseName }, { websiteName: caseName }]
    },
    include: {
      drops: true
    }
  });
  
  return caseObj as CaseWithDrops | null;
}