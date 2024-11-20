import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const filePath = path.join('/tmp', 'script.lua');
        const dylibPath = path.join('/tmp', 'script.dylib');

        // Save uploaded Lua file
        const luaFile = req.body.file;
        await fs.writeFile(filePath, luaFile);

        // Convert Lua to .dylib using _CodeSign
        const command = `_CodeSign compile -o ${dylibPath} ${filePath}`;
        await execAsync(command);

        // Send the .dylib file back
        const dylibFile = await fs.readFile(dylibPath);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', 'attachment; filename=script.dylib');
        res.send(dylibFile);

        // Clean up temporary files
        await fs.unlink(filePath);
        await fs.unlink(dylibPath);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Conversion failed.' });
    }
}
