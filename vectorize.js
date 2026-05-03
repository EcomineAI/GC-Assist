import fs from 'fs';
import { pipeline } from '@xenova/transformers';

async function main() {
    console.log("Loading Xenova/all-MiniLM-L6-v2...");
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    console.log("Reading raw knowledge base...");
    const data = JSON.parse(fs.readFileSync('public/knowledge_base_raw.json', 'utf8'));

    console.log(`Vectorizing ${data.length} chunks...`);
    for (let i = 0; i < data.length; i++) {
        const output = await extractor(data[i].content, { pooling: 'mean', normalize: true });
        data[i].vector = Array.from(output.data);
    }

    fs.writeFileSync('public/knowledge_base.json', JSON.stringify(data));
    console.log("Wrote public/knowledge_base.json with vector embeddings!");
}
main().catch(console.error);
