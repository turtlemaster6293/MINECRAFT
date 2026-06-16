const WORLD = {
  width: 32,
  depth: 32,
  height: 14,
  blocks: [],
  blockTypes: [
    { id: 'grass', label: 'Grass Block', type: 'block', emoji: '🌿', color: '#6A8A3F' },
    { id: 'dirt', label: 'Dirt', type: 'block', emoji: '🟫', color: '#7F5A38' },
    { id: 'stone', label: 'Stone', type: 'block', emoji: '🪨', color: '#7B7B7B' },
    { id: 'wood', label: 'Oak Wood', type: 'block', emoji: '🪵', color: '#A16A3E' },
    { id: 'water', label: 'Water', type: 'block', emoji: '💧', color: '#3C81C3' },
    { id: 'sand', label: 'Sand', type: 'block', emoji: '🏖️', color: '#D4C08B' },
    { id: 'glass', label: 'Glass', type: 'block', emoji: '🪟', color: '#DDEBF4' },
    { id: 'torch', label: 'Torch', type: 'tool', emoji: '🪔', color: '#F6D37A' },
    { id: 'pickaxe', label: 'Pickaxe', type: 'tool', emoji: '⛏️', color: '#C8C8C8' },
    { id: 'sword', label: 'Sword', type: 'weapon', emoji: '⚔️', color: '#D9D9D9' },
    { id: 'bow', label: 'Bow', type: 'weapon', emoji: '🏹', color: '#C47A3A' }
  ],
  create() {
    const blocks = [];
    for (let x = 0; x < this.width; x++) {
      blocks[x] = [];
      for (let y = 0; y < this.depth; y++) {
        blocks[x][y] = [];
        for (let z = 0; z < this.height; z++) {
          if (z === 0) {
            blocks[x][y][z] = 'bedrock';
          } else if (z < 3) {
            blocks[x][y][z] = 'dirt';
          } else if (z === 3) {
            blocks[x][y][z] = 'grass';
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

function sampleBlockType(id) {
  const block = getBlockType(id);
  return block ? block.emoji : '▢';
}

export { WORLD, getBlockType, sampleBlockType };
