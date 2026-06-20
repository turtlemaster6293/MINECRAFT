// world.js
function noise(x, y) {
  return Math.sin(x * 0.1) * Math.cos(y * 0.1) + Math.sin(x * 0.05) * Math.cos(y * 0.05);
}

function getHeight(x, y) {
  const base = noise(x, y);
  return Math.floor(10 + base * 5);
}

// world.js
// ... (keep noise and getHeight same) ...

export const WORLD = {
  chunkSize: 16, height: 32, chunks: new Map(),
  blockTypes: [
    { id: 'grass', color: '#6A8A3F' }, { id: 'dirt', color: '#7F5A38' },
    { id: 'stone', color: '#7B7B7B' }, { id: 'sand', color: '#D4C08B' },
    { id: 'bedrock', color: '#222222' }
  ],
  getChunk(cx, cz) {
    const key = `${cx | 0},${cz | 0}`;
    if (this.chunks.has(key)) return this.chunks.get(key);
    const blocks = Array.from({ length: 16 }, (_, x) => 
      Array.from({ length: 16 }, (_, z) => {
        const h = getHeight((cx | 0) * 16 + x, (cz | 0) * 16 + z);
        return Array.from({ length: 32 }, (_, y) => 
           y === 0 ? 'bedrock' : y < h - 3 ? 'stone' : y < h - 1 ? 'dirt' : y < h ? 'grass' : null
        );
      })
    );
    this.chunks.set(key, blocks);
    return blocks;
  },

  getBlock(gx, gy, gz) {
    // Standardize how we find the block coordinate
    const ix = Math.round(gx) | 0;
    const iy = Math.round(gy) | 0;
    const iz = Math.round(gz) | 0;

    if (iy < 0 || iy >= 32) return null;

    const cx = Math.floor(ix / 16) | 0;
    const cz = Math.floor(iz / 16) | 0;
    const key = `${cx},${cz}`;
    
    if (!this.chunks.has(key)) return null;

    const lx = ((ix % 16) + 16) % 16 | 0;
    const lz = ((iz % 16) + 16) % 16 | 0;
    
    return this.chunks.get(key)[lx][lz][iy];
  },

  setBlock(gx, gy, gz, id) {
    const ix = Math.round(gx) | 0;
    const iy = Math.round(gy) | 0;
    const iz = Math.round(gz) | 0;

    if (this.getBlock(ix, iy, iz) === 'bedrock') return false;
    if (iy < 0 || iy >= 32) return false;

    const cx = Math.floor(ix / 16) | 0;
    const cz = Math.floor(iz / 16) | 0;
    const lx = ((ix % 16) + 16) % 16 | 0;
    const lz = ((iz % 16) + 16) % 16 | 0;
    
    const chunk = this.getChunk(cx, cz);
    chunk[lx][lz][iy] = id;
    return true;
  }
};