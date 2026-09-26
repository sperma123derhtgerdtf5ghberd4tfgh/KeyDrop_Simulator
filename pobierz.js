import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://postgres:kutas@localhost:5432/keydrop" } } });
const outputDir = './static/cases';

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

async function downloadImages() {
    const cases = await prisma.case.findMany();
    console.log(`Znalazłem ${cases.length} skrzynek. Rozpoczynam pobieranie...`);

    for (const c of cases) {
        if (!c.imgName) continue;
        const filePath = path.join(outputDir, c.imgName);
        
        // Pomijamy jeśli plik już jest
        if (fs.existsSync(filePath)) continue;

        try {
            const url = `https://key-drop.com/storage/products/${c.imgName}`;
            const response = await axios({ url, responseType: 'stream' });
            response.data.pipe(fs.createWriteStream(filePath));
            console.log(`Pobrano: ${c.imgName}`);
        } catch (e) {
            console.log(`Błąd przy ${c.imgName}: Serwer zablokował połączenie.`);
        }
    }
}
downloadImages();