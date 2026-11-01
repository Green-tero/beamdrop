const ADJECTIVES = [
  'Amber', 'Azure', 'Bold', 'Brave', 'Bright', 'Calm', 'Cedar', 'Clever',
  'Cobalt', 'Copper', 'Coral', 'Cosmic', 'Crimson', 'Cyan', 'Dawn', 'Dune',
  'Ember', 'Emerald', 'Fierce', 'Frost', 'Golden', 'Granite', 'Hazel', 'Indigo',
  'Jade', 'Lunar', 'Maple', 'Mist', 'Neon', 'Noble', 'Nova', 'Onyx',
  'Opal', 'Pine', 'Polar', 'Quiet', 'Rapid', 'Ruby', 'Rust', 'Sage',
  'Shadow', 'Silent', 'Silver', 'Solar', 'Spruce', 'Steel', 'Storm', 'Swift',
  'Teal', 'Tidal', 'Topaz', 'Vivid', 'Wild', 'Zenith'
];

const NOUNS = [
  'Badger', 'Bear', 'Beaver', 'Bison', 'Cheetah', 'Condor', 'Coyote', 'Crane',
  'Dolphin', 'Eagle', 'Falcon', 'Finch', 'Fox', 'Hawk', 'Heron', 'Ibex',
  'Jaguar', 'Koala', 'Leopard', 'Lynx', 'Marten', 'Moose', 'Orangutan', 'Orca',
  'Osprey', 'Otter', 'Owl', 'Panda', 'Panther', 'Pelican', 'Penguin', 'Puma',
  'Raven', 'Seal', 'Shark', 'Sloth', 'Sparrow', 'Stork', 'Swan', 'Tiger',
  'Walrus', 'Weasel', 'Whale', 'Wolf', 'Wolverine', 'Wombat'
];

export function generateAlias(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adj} ${noun}`;
}
