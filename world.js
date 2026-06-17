// Simple Perlin-like noise using sine functions for terrain generation
function noise(x, y) {
  return Math.sin(x * 0.1) * Math.cos(y * 0.1) + Math.sin(x * 0.05) * Math.cos(y * 0.05);
}

function getHeight(x, y) {
  const base = noise(x, y);
  const octave1 = noise(x * 2, y * 2) * 0.5;
  const octave2 = noise(x * 4, y * 4) * 0.25;
  const combined = (base + octave1 + octave2) / 1.75;
  return Math.floor(3 + combined * 3);
}

const WORLD = {
  width: 64,
  depth: 64,
  height: 16,
  blocks: [],
  blockTypes: [
    { id: 'grass', label: 'Grass Block', type: 'block', emoji: '🟩', color: '#6A8A3F' },
    { id: 'dirt', label: 'Dirt', type: 'block', emoji: '🟫', color: '#7F5A38' },
    { id: 'stone', label: 'Stone', type: 'block', emoji: '⬜', color: '#7B7B7B' },
    { id: 'sand', label: 'Sand', type: 'block', emoji: '🟨', color: '#D4C08B' },
    { id: 'water', label: 'Water', type: 'block', emoji: '🌊', color: '#3C81C3' },
    { id: 'oak_log', label: 'Oak Log', type: 'block', emoji: '🪵', color: '#A16A3E' },
    { id: 'oak_leaves', label: 'Oak Leaves', type: 'block', emoji: '🟢', color: '#5FA63F' },
    { id: 'glass', label: 'Glass', type: 'block', emoji: '🪟', color: '#DDEBF4' },
    { id: 'crafting_table', label: 'Crafting Table', type: 'block', emoji: '⚒️', color: '#8B6F47' },
    { id: 'torch', label: 'Torch', type: 'item', emoji: '🪔', color: '#F6D37A' },
    { id: 'wooden_pickaxe', label: 'Wooden Pickaxe', type: 'tool', emoji: '⛏️', color: '#C8A882' },
    { id: 'stone_pickaxe', label: 'Stone Pickaxe', type: 'tool', emoji: '⛏️', color: '#8B8B8B' },
    { id: 'wooden_sword', label: 'Wooden Sword', type: 'weapon', emoji: '🗡️', color: '#D9C18E' },
    { id: 'stone_sword', label: 'Stone Sword', type: 'weapon', emoji: '🗡️', color: '#8B8B8B' },
    { id: 'bow', label: 'Bow', type: 'weapon', emoji: '🏹', color: '#C47A3A' },
    { id: 'apple', label: 'Apple', type: 'food', emoji: '🍎', color: '#E53935' },
    { id: 'coal', label: 'Coal', type: 'item', emoji: '⬛', color: '#2A2A2A' },
    { id: 'iron_ore', label: 'Iron Ore', type: 'block', emoji: '🟦', color: '#8B7355' },
  ],
  create() {
    const blocks = [];
    for (let x = 0; x < this.width; x++) {
      blocks[x] = [];
      for (let y = 0; y < this.depth; y++) {
        blocks[x][y] = [];
        const surfaceHeight = getHeight(x, y);
        for (let z = 0; z < this.height; z++) {
          if (z === 0) {
            blocks[x][y][z] = 'stone';
          } else if (z < surfaceHeight - 3) {
            blocks[x][y][z] = 'stone';
          } else if (z < surfaceHeight - 1) {
            blocks[x][y][z] = 'dirt';
          } else if (z === surfaceHeight - 1) {
            blocks[x][y][z] = Math.random() > 0.8 ? 'sand' : 'grass';
          } else {
            blocks[x][y][z] = null;
          }
        }
      }
    }
    this.blocks = blocks;
  }
};

WORLD.create();

function getBlockType(id) {
  return WORLD.blockTypes.find((block) => block.id === id) || null;
}

function getRandomSpawnPoint() {
  const x = Math.floor(WORLD.width / 2);
  const yIndex = Math.floor(WORLD.depth / 2); // world.js uses [x][y][z] where z is height
  
  let zHeight = WORLD.height - 1;
  while (zHeight > 0 && !WORLD.blocks[x][yIndex][zHeight]) {
    zHeight--;
  }

  return {
    x: x,
    z: yIndex, // This will be mapped to Three.js Z
    y: zHeight + 2 // This will be mapped to Three.js Y (vertical)
  };
}

export { WORLD, getBlockType, getRandomSpawnPoint };
