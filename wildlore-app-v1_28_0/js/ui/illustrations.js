const SIL = {
  songbird: 'M62 34c6 0 10 5 10 11 0 2 0 3-1 5l10 3-10 3c-2 8-10 14-19 14-12 0-22-8-22-19 0-10 8-18 18-19 2-3 5-5 9-5 2 0 4 1 5 2zM30 56l-16 8 16 1z',
  raptor: 'M50 36c-5 0-9 4-9 9 0 3 1 5 3 7-10-1-22-7-32-1 9 4 16 7 24 7-3 4-5 8-5 13 5-3 9-6 13-10 2 2 4 3 6 3s4-1 6-3c4 4 8 7 13 10 0-5-2-9-5-13 8 0 15-3 24-7-10-6-22 0-32 1 2-2 3-4 3-7 0-5-4-9-9-9z',
  owl: 'M50 28c13 0 23 10 23 24 0 15-10 26-23 26S27 67 27 52c0-14 10-24 23-24zM33 30c-3-6-2-12 1-15 3 4 5 6 8 7m16 0c3-1 5-3 8-7 3 3 4 9 1 15M41 48a5 5 0 100 10 5 5 0 000-10zm18 0a5 5 0 100 10 5 5 0 000-10zM50 60l-4 5h8z',
  duck: 'M22 60c0-7 10-12 26-12 10 0 18 2 24 2 0 5-5 8-12 8 4 3 4 9-1 12-6 4-18 6-28 4-9-2-9-9-9-14zM70 44c5-2 11-2 14 1-2 3-6 4-10 4-2 0-3-1-4-2zM84 47l8 1-7 3z',
  heron: 'M52 22c4 0 7 3 7 7 0 2-1 4-3 5l9-2-6 5c0 8-3 14-8 18 5 1 9 4 12 8-5-1-9-2-13-2l-1 16h-2l-1-16c-4 0-8 1-13 2 3-4 7-7 12-8-5-4-8-10-8-18 0-1 0-2 1-3-2-1-3-3-3-5 0-4 3-7 7-7zM47 74h2v18h-2zM51 74h2v18h-2z',
  hummingbird: 'M40 50c-8-4-20-6-32-4 10 6 18 8 26 8-6 4-10 10-10 18 6-4 11-8 16-12 4 6 10 10 18 10 10 0 16-6 16-14 0-6-4-10-10-10-4 0-7 2-7 6l-17-8zM74 46l14 4',
  fox: 'M50 30c-6-8-14-14-22-16 2 8 4 14 8 18-8 5-14 14-14 26 0 16 12 26 28 26s28-10 28-26c0-12-6-21-14-26 4-4 6-10 8-18-8 2-16 8-22 16z',
  deer: 'M50 92c-8 0-14-6-14-16 0-8 3-13 6-18-2-4-3-9-3-14l8 5c2-3 5-5 9-5s7 2 9 5l8-5c0 5-1 10-3 14 3 5 6 10 6 18 0 10-6 16-14 16zM40 36c-3-6-8-10-12-22 4 2 8 4 10 8m22 14c3-6 8-10 12-22-4 2-8 4-10 8',
  rodent: 'M46 52c0-9 6-15 14-15 7 0 13 6 13 14 0 4-2 8-5 10 2 2 4 5 4 9 0 6-5 11-13 11s-13-5-13-11c0-3 1-6 3-8-3-2-5-6-5-10zM30 70c-8-4-12-14-9-23 3-9 11-14 18-13-6 3-10 9-11 16-1 8 1 15 2 20z',
  bigcat: 'M44 34c0-3 2-5 5-5 1 0 2 0 3 1 1-1 2-1 3-1 3 0 5 2 5 5 3 2 5 6 5 10 0 3-1 5-3 7 6 4 10 12 10 21 0 2-2 4-5 4H40c-3 0-5-2-5-5 0-9 3-16 8-21-2-2-3-5-3-8 0-4 3-8 7-9-1-1-2-3-2-5z',
  bear: 'M32 36c0-4 3-7 7-7 2 0 4 1 5 3 3-2 7-3 12-3s9 1 12 3c1-2 3-3 5-3 4 0 7 3 7 7 0 2-1 4-2 5 4 5 7 12 7 19 0 6-4 10-10 10H38c-6 0-10-4-10-10 0-7 3-14 7-19-1-1-2-3-2-5z',
  rabbit: 'M38 60c0-10 8-18 18-18 7 0 13 5 16 12 5 2 8 6 8 11 0 5-5 9-12 9H38c-7 0-12-4-12-9 0-5 3-9 8-11zM44 44c-3-8-2-18 2-23 4 5 5 14 3 22zM58 44c2-8 5-17 9-21 1 6-1 15-6 22z',
  bat: 'M50 38c4 0 7 3 7 7 0 2-1 4-2 5 8-2 14-8 24-6-6 4-9 9-9 15 8-3 13-2 18 2-7 0-12 3-15 8-3-4-8-6-14-6h-18c-6 0-11 2-14 6-3-5-8-8-15-8 5-4 10-5 18-2 0-6-3-11-9-15 10-2 16 4 24 6-1-1-2-3-2-5 0-4 3-7 7-7z',
  seal: 'M22 70c0-4 4-6 8-6 2-10 10-18 22-18 6 0 10 2 14 6 4-2 8-2 12 0-2 4-6 5-10 5 4 4 6 10 6 16 0 4-2 7-6 7-2 0-4-1-5-3-3 2-7 3-11 3-12 0-22-4-26-10-2 0-4 1-6 1-2 0-4-2-4-1z',
  whale: 'M16 58c2-12 16-20 34-20 14 0 24 6 33 6 6 0 11-3 15-8-1 10-6 16-13 19 4 3 6 7 8 12-7 1-14-1-19-6-8 6-19 9-32 7-6 6-14 9-24 8 4-4 7-9 7-15-9-1-16-6-19-13z',
  lizard: 'M52 14c4 0 7 3 7 8 0 2-1 4-2 5 3 2 5 5 5 9 6-3 13-2 18 3-5 1-9 3-11 8-1-1-2-1-3-1 2 4 1 9-2 13 4 4 4 11 1 16-3-5-6-7-11-8 0 3-2 6-5 7-3-1-5-4-5-7-5 1-8 3-11 8-3-5-3-12 1-16-3 0-6-1-8-2 1-5-2-9-7-9-1 0-2 0-3 1-2-5-6-7-11-8 5-5 12-6 18-3 0-4 2-7 5-9-1-1-2-3-2-5 0-5 3-8 7-8z',
  snake: 'M70 30c-12-4-26 2-30 14-3 9 1 18 10 21 7 2 14-1 17-7 2-5 0-10-4-13-3-2-7-2-10 0 4-1 8 0 10 3 2 4 1 8-3 11-5 4-13 4-18-1-7-6-7-17 1-23 8-7 21-7 29 0 1 1 2 2 3 4l-5 2c-2-2-4-4-6-5zM62 28a3 3 0 100 6 3 3 0 000-6z',
  turtle: 'M50 26c15 0 27 10 27 24 0 13-12 22-27 22S23 63 23 50c0-14 12-24 27-24zM78 44c5 0 9 3 9 7s-4 7-9 7c-2 0-4-1-5-2 2-3 2-7 0-10 1-1 3-2 5-2z',
  croc: 'M10 52c10-2 18-3 24-7 4-3 10-5 18-5 12 0 22 5 28 5l8-2-6 5 6 4-8-1c-3 4-9 7-16 8-5 4-12 6-22 6-7 0-13-2-18-5l-14 2 7-5-7-4 14-2zM22 46l-3-6 6 3zM30 64l-3 6 6-3z',
  frog: 'M30 40c0-6 4-10 9-10 3 0 5 1 7 3 2-2 4-3 7-3 5 0 9 4 9 10 7 2 12 8 12 16 0 9-9 16-22 16s-22-7-22-16c0-8 5-14 12-16z',
  salamander: 'M16 56c0-5 5-9 12-9 4 0 7 1 11 1s7-1 11-1c4 0 7 1 11 1s8-2 14-2c6 0 11 3 13 8-2 5-7 7-13 7-6 0-9-2-14-2-4 0-7 1-11 1s-7-1-11-1-7 1-11 1c-7 0-12-4-12-4zM26 50l-3-6 5 4zM26 62l-3 6 5-4zM58 50l-3-6 5 4zM58 62l-3 6 5-4z',
  butterfly: 'M48 30h4v40h-4zM50 50c-3-16-14-24-28-22-5 1-7 7-5 14 3 11 17 16 30 12m6 0c3-16 14-24 28-22 5 1 7 7 5 14-3 11-17 16-30 12m-6 0c-2 12-10 18-22 20 6 4 16 2 22-6m6 0c2 12 10 18 22 20-6 4-16 2-22-6',
  beetle: 'M50 20c5 0 9 4 9 9 0 2-1 4-2 6 6 4 10 11 10 19 0 13-8 22-17 22s-17-9-17-22c0-8 4-15 10-19-1-2-2-4-2-6 0-5 4-9 9-9zM50 36v36',
  bee: 'M50 22c4 0 7 3 7 7h-14c0-4 3-7 7-7zM50 32c12 0 20 10 20 23s-8 23-20 23-20-10-20-23 8-23 20-23z',
  dragonfly: 'M48 14h4v60h-4zM50 30c-3 0-26-6-30-10 8-2 27 2 30 6m0 0c3 0 26-6 30-10-8-2-27 2-30 6m0 10c-3 0-22-5-26-9 7-2 23 2 26 5m0 0c3 0 22-5 26-9-7-2-23 2-26 5zM50 14a4 4 0 100 8 4 4 0 000-8z',
  fish: 'M8 50c12-14 30-21 47-21 9 0 17 2 24 7l13-13-4 18 6 16-15-12c-7 6-16 9-24 9-17 0-35-7-47-20z',
  shark: 'M6 56c16-13 36-20 56-20 7 0 13 1 19 3l7-18 3 18 14 5-15 6c-6 7-15 11-25 12l-4 13-4-13c-18-1-37-7-50-19z',
  ray: 'M50 30c14 0 40 8 44 18-4 10-30 18-44 18S10 58 6 48c4-10 30-18 44-18zM50 64l-3 24 6-24z',
  seahorse: 'M46 16c7 0 12 5 12 12 0 4-3 7-6 7-2 0-4-2-4-4 0-1 1-2 2-2-2-2-5-1-6 1-2 3-2 7 0 11 3 6 4 11 4 17 0 7-5 12-12 13 3-3 5-7 5-12-5 1-9-2-10-7-3 4-3 10 0 15-7-2-11-9-9-17 1-6 5-10 9-13-2-2-3-5-3-8 0-7 5-13 12-13zM40 70c-3 1-5 4-5 8 3 0 6-2 7-5z',
  octopus: 'M50 16c17 0 28 13 28 29 0 7-2 12-6 17 5 2 8 6 8 11 0 4-3 7-7 7-3 0-6-2-7-6-2 5-6 8-11 8-3 0-6-1-8-4-2 5-6 8-11 8s-9-3-11-8c-1 4-4 6-7 6-4 0-7-3-7-7 0-5 3-9 8-11-4-5-6-10-6-17 0-16 11-29 28-29z',
  crab: 'M50 40c14 0 24 8 24 17 0 9-11 15-24 15s-24-6-24-15c0-9 10-17 24-17zM26 42c-6-3-9-9-9-15 3 5 7 8 11 9 1 2 0 5-2 6zM74 42c6-3 9-9 9-15-3 5-7 8-11 9-1 2 0 5 2 6zM26 58l-12 3 12 3zM74 58l12 3-12 3zM30 66l-10 7 11-2zM70 66l10 7-11-2z',
  jelly: 'M28 44c0-14 10-24 22-24s22 10 22 24c0 4-2 6-5 6-2 0-4-1-5-3-1 2-3 4-6 4l-1 16c0 2-1 3-3 3s-3-1-3-3l-1-12-2 14c0 2-1 3-3 3s-3-1-3-3l1-16c-3 0-5-2-6-4-1 2-3 3-5 3-3 0-5-2-5-6z',
  seastar: 'M50 14L58.8 37.9 84.2 38.9 64.3 54.6 71.2 79.1 50 65 28.8 79.1 35.7 54.6 15.8 38.9 41.2 37.9Z',
  urchin: 'M50 34a16 16 0 100 32 16 16 0 000-32zM50 14l3 12-6 0zM50 86l3-12-6 0zM14 50l12 3 0-6zM86 50l-12 3 0-6zM26 26l9 8-4 4zM74 26l-9 8 4 4zM26 74l9-8-4-4zM74 74l-9-8 4-4z',
  nudibranch: 'M14 70c0-11 12-20 30-20 4-6 13-6 17 0 16 0 27 6 27 14 0 5-5 9-11 9-3 0-6-1-8-3-2 4-7 7-12 7-3 0-6-1-8-3-3 3-7 4-12 4-8 0-15-4-18-10-3-2-5-4-5-5zM52 50c0-3 2-5 4-5s4 2 4 5-2 5-4 5-4-2-4-5zM62 49c0-3 2-5 4-5s4 2 4 5-2 5-4 5-4-2-4-5z',
  shell: 'M52 30c12 0 22 9 22 21 0 10-8 18-18 18-8 0-15-6-15-14 0-6 5-11 11-11 5 0 9 3 9 8 0 3-2 6-5 6-2 0-3-1-3-3 2 0 3-1 3-3 0-2-2-4-4-4-3 0-6 3-6 7 0 5 4 9 10 9 8 0 14-7 14-15 0-9-8-16-18-16-3 0-6 1-9 2l-6-6c4-3 9-5 15-5zM30 64c-4 2-8 2-12 0 2-4 6-6 10-6z',
  coral: 'M50 90c-2-14-2-22-6-30-3-6-9-9-9-17 0-5 3-9 7-9 3 0 5 2 6 5 1-4 4-7 8-7s7 3 8 7c1-3 3-5 6-5 4 0 7 4 7 9 0 8-6 11-9 17-4 8-4 16-6 30 0 2-3 3-6 3s-6-1-6-3z',
  tree: 'M50 14l16 26H34zM50 28l18 28H32zM50 42l20 26H30zM46 60h8v30h-8z',
  fern: 'M48 90c0-24 1-44 4-58 1-1 2-1 3 0 3 14 4 34 4 58zM50 36c-6-2-10-7-11-14 6 1 10 5 11 11zM50 36c6-2 10-7 11-14-6 1-10 5-11 11zM50 48c-6-2-11-7-12-15 6 1 11 5 12 12zM50 48c6-2 11-7 12-15-6 1-11 5-12 12zM50 60c-6-2-12-8-13-16 7 1 12 5 13 13zM50 60c6-2 12-8 13-16-7 1-12 5-13 13z',
  flower: 'M50 30c4 0 7 4 7 9 0 2-1 4-2 5 2-1 4-2 6-2 5 0 9 4 9 8 0 2-1 4-2 5 1 0 2 1 2 3 0 4-4 7-9 7-2 0-4-1-5-2 0 5-4 9-8 9s-8-4-8-9c-1 1-3 2-5 2-5 0-9-3-9-7 0-2 1-3 2-3-1-1-2-3-2-5 0-4 4-8 9-8 2 0 4 1 6 2-1-1-2-3-2-5 0-5 3-9 7-9zM50 50a7 7 0 100 14 7 7 0 000-14zM48 64h4v26h-4z',
  mushroom: 'M50 24c18 0 30 12 30 26H20c0-14 12-26 30-26zM42 50h16v26c0 4-3 6-8 6s-8-2-8-6z'
};
const GROUP_TO_CAT = { mammals: 'fox', birds: 'songbird', reptiles: 'lizard', amphibians: 'frog', insects: 'butterfly', fish: 'fish', sharks: 'shark', cetacea: 'whale', cephalopods: 'octopus', nudibranchs: 'nudibranch', corals: 'coral', jellyfish: 'jelly', echinoderms: 'seastar', crustaceans: 'crab', molluscs: 'shell', plants: 'fern', fungi: 'mushroom' };
const CAT_LABEL = { songbird: 'Bird', raptor: 'Bird of prey', owl: 'Owl', duck: 'Waterfowl', heron: 'Wading bird', hummingbird: 'Hummingbird', fox: 'Mammal', deer: 'Hoofed mammal', rodent: 'Rodent', bigcat: 'Cat', bear: 'Bear', rabbit: 'Rabbit or hare', bat: 'Bat', seal: 'Seal or sea lion', whale: 'Marine mammal', lizard: 'Lizard', snake: 'Snake', turtle: 'Turtle', croc: 'Crocodilian', frog: 'Frog or toad', salamander: 'Salamander', butterfly: 'Butterfly or moth', beetle: 'Beetle', bee: 'Bee or wasp', dragonfly: 'Dragonfly', fish: 'Fish', shark: 'Shark', ray: 'Ray', seahorse: 'Seahorse', octopus: 'Cephalopod', crab: 'Crustacean', jelly: 'Jelly', seastar: 'Sea star', urchin: 'Urchin', nudibranch: 'Sea slug', shell: 'Mollusc', coral: 'Coral', tree: 'Tree', fern: 'Plant', flower: 'Flowering plant', mushroom: 'Fungus' };
export function groupCategory(id) { return GROUP_TO_CAT[id] || 'fox'; }
export function categoryLabel(cat) { return CAT_LABEL[cat] || 'Specimen'; }
export function categoryOf(rec) {
  const cls = (rec.class || '').toLowerCase(); const ph = (rec.phylum || '').toLowerCase(); const ord = (rec.order || '').toLowerCase(); const fam = (rec.family || '').toLowerCase(); const king = (rec.kingdom || '').toLowerCase();
  if (cls === 'aves') { if (['accipitriformes', 'falconiformes', 'cathartiformes', 'strigiformes'].includes(ord)) return ord === 'strigiformes' ? 'owl' : 'raptor'; if (ord === 'anseriformes') return 'duck'; if (['pelecaniformes', 'ciconiiformes', 'gruiformes', 'phoenicopteriformes', 'suliformes'].includes(ord)) return 'heron'; if (ord === 'apodiformes' || ord === 'trochiliformes') return 'hummingbird'; return 'songbird'; }
  if (cls === 'mammalia') { if (ord === 'cetacea' || ord === 'sirenia') return 'whale'; if (ord === 'chiroptera') return 'bat'; if (ord === 'rodentia') return 'rodent'; if (ord === 'lagomorpha') return 'rabbit'; if (fam === 'felidae') return 'bigcat'; if (fam === 'ursidae') return 'bear'; if (['otariidae', 'phocidae', 'odobenidae'].includes(fam)) return 'seal'; if (fam === 'canidae') return 'fox'; if (['artiodactyla', 'cetartiodactyla', 'perissodactyla'].includes(ord) || ['cervidae', 'bovidae'].includes(fam)) return 'deer'; return 'fox'; }
  if (cls === 'chondrichthyes' || cls === 'elasmobranchii' || cls === 'holocephali') { if (['rajiformes', 'myliobatiformes', 'torpediniformes', 'rhinopristiformes'].includes(ord)) return 'ray'; return 'shark'; }
  if (['actinopterygii', 'actinopteri', 'teleostei', 'sarcopterygii', 'cephalaspidomorphi'].includes(cls)) { if (fam === 'syngnathidae') return 'seahorse'; return 'fish'; }
  if (cls === 'cephalopoda') return 'octopus';
  if (cls === 'gastropoda') return ord === 'nudibranchia' ? 'nudibranch' : 'shell';
  if (cls === 'bivalvia' || cls === 'polyplacophora') return 'shell';
  if (cls === 'insecta') { if (ord === 'lepidoptera') return 'butterfly'; if (ord === 'coleoptera') return 'beetle'; if (ord === 'hymenoptera') return 'bee'; if (ord === 'odonata') return 'dragonfly'; return 'beetle'; }
  if (cls === 'reptilia' || cls === 'squamata') { if (ord === 'testudines') return 'turtle'; if (ord === 'crocodylia') return 'croc'; if (ord === 'serpentes' || (rec.suborder || '').toLowerCase() === 'serpentes') return 'snake'; return 'lizard'; }
  if (cls === 'testudines') return 'turtle';
  if (cls === 'amphibia') return (['caudata', 'urodela'].includes(ord)) ? 'salamander' : 'frog';
  if (cls === 'malacostraca' || cls === 'maxillopoda' || cls === 'branchiopoda') return 'crab';
  if (cls === 'anthozoa') return 'coral';
  if (['scyphozoa', 'hydrozoa', 'cubozoa'].includes(cls)) return 'jelly';
  if (ph === 'echinodermata') return cls === 'echinoidea' ? 'urchin' : 'seastar';
  if (king === 'plantae') { if (cls === 'pinopsida' || ord === 'pinales') return 'tree'; if (cls === 'polypodiopsida') return 'fern'; return 'flower'; }
  if (king === 'fungi') return 'mushroom';
  if (ph === 'cnidaria') return 'coral'; if (ph === 'mollusca') return 'shell'; if (ph === 'arthropoda') return 'crab';
  return 'fox';
}
const PALETTE = {
  songbird: '#5b7fa6', raptor: '#6e5742', owl: '#8a7155', duck: '#3d6b5a', heron: '#8a96a2', hummingbird: '#2f8f78',
  fox: '#c4703a', deer: '#ad7c52', rodent: '#9c8060', bigcat: '#c89a54', bear: '#6f5640', rabbit: '#a99a86', bat: '#5d5048', seal: '#7f8b97', whale: '#4a6b86',
  lizard: '#7fa257', snake: '#849a54', turtle: '#5f7d54', croc: '#5d7150', frog: '#5fa257', salamander: '#b5603f',
  butterfly: '#d98a3d', beetle: '#4e6b54', bee: '#caa23a', dragonfly: '#2f9aa0',
  fish: '#5f93b0', shark: '#6f8696', ray: '#79808c', seahorse: '#c89a44', octopus: '#bd6a5e', crab: '#c25b46', jelly: '#9d8fc2', seastar: '#d0844f', urchin: '#5d5266', nudibranch: '#cf5e8e', shell: '#c9a166', coral: '#d4836f',
  tree: '#5a8a4a', fern: '#4f8a52', flower: '#cf6f97', mushroom: '#c06850', _default: '#7d8a78'
};
// eye placements (profile + front-facing) — [cx, cy, r]; rooted organisms get none
const EYE = {
  songbird: [[60, 40, 1.6]], duck: [[58, 50, 1.5]], heron: [[52, 28, 1.4]], hummingbird: [[66, 48, 1.4]],
  seal: [[34, 57, 1.6]], whale: [[30, 54, 1.7]], lizard: [[52, 20, 1.4]], fish: [[70, 46, 1.7]], shark: [[78, 52, 1.7]], seahorse: [[45, 24, 1.4]], snake: [[62, 28, 1.3]],
  owl: [[41, 52, 2.4], [59, 52, 2.4]], octopus: [[42, 47, 1.8], [58, 47, 1.8]], fox: [[44, 52, 1.5], [56, 52, 1.5]], bigcat: [[44, 52, 1.5], [56, 52, 1.5]], bear: [[45, 50, 1.5], [55, 50, 1.5]], frog: [[42, 46, 2], [58, 46, 2]], deer: [[45, 52, 1.4], [55, 52, 1.4]], rabbit: [[46, 58, 1.3], [54, 58, 1.3]]
};
function shade(hex, amt) { const m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return hex; const n = parseInt(m[1], 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; const f = 1 + amt; r = Math.max(0, Math.min(255, Math.round(r * f))); g = Math.max(0, Math.min(255, Math.round(g * f))); b = Math.max(0, Math.min(255, Math.round(b * f))); return 'rgb(' + r + ',' + g + ',' + b + ')'; }
let _uid = 0;
export function silSVG(cat, variant = 'specimen') {
  const d = SIL[cat] || SIL.fox;
  if (variant === 'shadow' || variant === 'emblem') return `<svg viewBox="0 0 100 100" class="sil sil-${variant}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="${d}"/></svg>`;
  const body = PALETTE[cat] || PALETTE._default; const line = shade(body, -0.42); const id = 'wlg' + (++_uid);
  const eyes = (EYE[cat] || []).map((e) => `<circle cx="${e[0]}" cy="${e[1]}" r="${e[2] + 1}" style="fill:#fbf6e9"/><circle cx="${e[0]}" cy="${e[1]}" r="${e[2]}" style="fill:#222d36"/>`).join('');
  return `<svg viewBox="0 0 100 100" class="sil sil-${variant}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">`
    + `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.36"/><stop offset="0.52" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity="0.2"/></linearGradient></defs>`
    + `<path d="${d}" style="fill:${body};stroke:${line};stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round"/>`
    + `<path d="${d}" style="fill:url(#${id})"/>`
    + eyes
    + `</svg>`;
}

export function plate(cat, { locked = false, plateNo = null } = {}) { const w = document.createElement('figure'); w.className = 'plate' + (locked ? ' locked' : ''); w.innerHTML = '<span class="tick tl"></span><span class="tick tr"></span><span class="tick bl"></span><span class="tick br"></span>' + silSVG(cat, locked ? 'shadow' : 'specimen') + (plateNo != null ? `<span class="plate-no">No.${String(plateNo).padStart(3, '0')}</span>` : ''); return w; }
