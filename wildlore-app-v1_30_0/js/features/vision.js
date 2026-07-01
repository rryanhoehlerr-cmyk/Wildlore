/* On-device photo identification — free, no key. Center-crops to the subject, classifies with
   MobileNet, maps labels to real species, and STRONGLY prefers animals over plants/objects so a
   chicken in weeds reads as a chicken, not a weed. Returns candidates the user compares to refs. */
import * as catalog from '../data/catalog.js';
const TFJS = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
const MNET = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js';
let _model = null, _loading = null;
function loadScript(src) { return new Promise((res, rej) => { if ([...document.scripts].some((s) => s.src === src)) return res(); const el = document.createElement('script'); el.src = src; el.async = true; el.onload = res; el.onerror = () => rej(new Error('Could not load ' + src)); document.head.appendChild(el); }); }
async function model() { if (_model) return _model; if (_loading) return _loading; _loading = (async () => { await loadScript(TFJS); await loadScript(MNET); _model = await window.mobilenet.load({ version: 2, alpha: 1.0 }); return _model; })(); return _loading; }
export const available = () => true;

const ALIASES = {
  hen: 'Gallus gallus', cock: 'Gallus gallus', chicken: 'Gallus gallus', goose: 'Anser anser', drake: 'Anas platyrhynchos',
  'black swan': 'Cygnus atratus', peacock: 'Pavo cristatus', ostrich: 'Struthio camelus', flamingo: 'Phoenicopterus roseus',
  pelican: 'Pelecanus', 'king penguin': 'Aptenodytes patagonicus', toucan: 'Ramphastos toco', macaw: 'Ara macao',
  'sulphur-crested cockatoo': 'Cacatua galerita', hummingbird: 'Trochilidae', robin: 'Turdus migratorius',
  jay: 'Cyanocitta cristata', magpie: 'Pica pica', 'bald eagle': 'Haliaeetus leucocephalus', 'great grey owl': 'Strix nebulosa',
  goldfinch: 'Spinus tristis', 'house finch': 'Haemorhous mexicanus', 'indigo bunting': 'Passerina cyanea',
  'american egret': 'Ardea alba', 'american coot': 'Fulica americana', vulture: 'Cathartes aura',
  monarch: 'Danaus plexippus', 'cabbage butterfly': 'Pieris rapae', admiral: 'Vanessa atalanta', ladybug: 'Coccinella septempunctata',
  bee: 'Apis mellifera', ant: 'Formicidae', mantis: 'Mantis religiosa', dragonfly: 'Anisoptera', grasshopper: 'Caelifera',
  'dung beetle': 'Scarabaeidae', 'rhinoceros beetle': 'Dynastinae', 'leaf beetle': 'Chrysomelidae', weevil: 'Curculionidae',
  'sea turtle': 'Cheloniidae', loggerhead: 'Caretta caretta', 'leatherback turtle': 'Dermochelys coriacea', 'box turtle': 'Terrapene carolina',
  terrapin: 'Malaclemys terrapin', 'mud turtle': 'Kinosternon', 'common iguana': 'Iguana iguana', iguana: 'Iguana iguana',
  'american chameleon': 'Anolis carolinensis', 'green lizard': 'Lacerta viridis', 'komodo dragon': 'Varanus komodoensis',
  'gila monster': 'Heloderma suspectum', 'american alligator': 'Alligator mississippiensis', 'african crocodile': 'Crocodylus niloticus',
  'garter snake': 'Thamnophis', 'king snake': 'Lampropeltis', 'green snake': 'Opheodrys', 'boa constrictor': 'Boa constrictor',
  'indian cobra': 'Naja naja', 'rock python': 'Python sebae', diamondback: 'Crotalus adamanteus', sidewinder: 'Crotalus cerastes',
  bullfrog: 'Lithobates catesbeianus', 'tree frog': 'Hyla', 'tailed frog': 'Ascaphus truei', 'european fire salamander': 'Salamandra salamandra',
  'spotted salamander': 'Ambystoma maculatum', axolotl: 'Ambystoma mexicanum', eft: 'Notophthalmus viridescens', 'common newt': 'Lissotriton vulgaris',
  lion: 'Panthera leo', tiger: 'Panthera tigris', leopard: 'Panthera pardus', jaguar: 'Panthera onca', cheetah: 'Acinonyx jubatus',
  'snow leopard': 'Panthera uncia', cougar: 'Puma concolor', lynx: 'Lynx', 'brown bear': 'Ursus arctos', 'american black bear': 'Ursus americanus',
  'ice bear': 'Ursus maritimus', 'sloth bear': 'Melursus ursinus', 'giant panda': 'Ailuropoda melanoleuca', 'lesser panda': 'Ailurus fulgens',
  'red fox': 'Vulpes vulpes', 'arctic fox': 'Vulpes lagopus', 'grey fox': 'Urocyon cinereoargenteus', 'kit fox': 'Vulpes macrotis',
  'timber wolf': 'Canis lupus', 'grey wolf': 'Canis lupus', 'white wolf': 'Canis lupus', coyote: 'Canis latrans', dingo: 'Canis lupus dingo',
  'african elephant': 'Loxodonta africana', 'indian elephant': 'Elephas maximus', tusker: 'Loxodonta africana', zebra: 'Equus quagga',
  hippopotamus: 'Hippopotamus amphibius', bison: 'Bison bison', 'water buffalo': 'Bubalus bubalis', ox: 'Bos taurus', ram: 'Ovis aries',
  bighorn: 'Ovis canadensis', ibex: 'Capra ibex', hartebeest: 'Alcelaphus buselaphus', impala: 'Aepyceros melampus', gazelle: 'Gazella',
  'arabian camel': 'Camelus dromedarius', llama: 'Lama glama', 'wild boar': 'Sus scrofa', warthog: 'Phacochoerus africanus', hog: 'Sus scrofa',
  weasel: 'Mustela', mink: 'Neovison vison', otter: 'Lontra canadensis', skunk: 'Mephitis mephitis', badger: 'Taxidea taxus',
  armadillo: 'Dasypus novemcinctus', 'three-toed sloth': 'Bradypus', porcupine: 'Erethizon dorsatum', beaver: 'Castor canadensis',
  marmot: 'Marmota', 'guinea pig': 'Cavia porcellus', hamster: 'Mesocricetus auratus', 'fox squirrel': 'Sciurus niger',
  hare: 'Lepus europaeus', 'wood rabbit': 'Sylvilagus floridanus', koala: 'Phascolarctos cinereus', wombat: 'Vombatus ursinus',
  platypus: 'Ornithorhynchus anatinus', wallaby: 'Macropus', gorilla: 'Gorilla gorilla', chimpanzee: 'Pan troglodytes',
  orangutan: 'Pongo pygmaeus', gibbon: 'Hylobates', baboon: 'Papio', macaque: 'Macaca mulatta', 'madagascar cat': 'Lemur catta',
  'great white shark': 'Carcharodon carcharias', 'tiger shark': 'Galeocerdo cuvier', hammerhead: 'Sphyrna mokarran',
  'electric ray': 'Torpedo', stingray: 'Dasyatis', goldfish: 'Carassius auratus', 'anemone fish': 'Amphiprion ocellaris',
  clownfish: 'Amphiprion ocellaris', lionfish: 'Pterois volitans', puffer: 'Tetraodontidae', eel: 'Anguilla', sturgeon: 'Acipenser',
  starfish: 'Asterias rubens', 'sea urchin': 'Echinoidea', 'sea cucumber': 'Holothuroidea', jellyfish: 'Aurelia aurita',
  'sea anemone': 'Actiniaria', 'brain coral': 'Diploria', conch: 'Strombus', snail: 'Helix', slug: 'Limax',
  'chambered nautilus': 'Nautilus pompilius', 'hermit crab': 'Paguroidea', 'american lobster': 'Homarus americanus',
  'spiny lobster': 'Palinuridae', crayfish: 'Astacoidea', 'fiddler crab': 'Uca', 'dungeness crab': 'Metacarcinus magister',
  'rock crab': 'Cancer irroratus', 'king crab': 'Paralithodes camtschaticus', isopod: 'Isopoda'
};
function toScientific(label) {
  const l = label.toLowerCase();
  if (ALIASES[l]) return ALIASES[l];
  for (const p of l.split(',').map((s) => s.trim())) if (ALIASES[p]) return ALIASES[p];
  if (/\b(terrier|retriever|spaniel|hound|shepherd|poodle|setter|sheepdog|mastiff|bulldog|collie|husky|malamute|pinscher|schnauzer|corgi|great dane|pug|chihuahua|beagle|rottweiler|dalmatian|boxer|samoyed|pomeranian|dachshund|doberman|whippet|vizsla|dog)\b/.test(l)) return 'Canis lupus familiaris';
  if (/\bcat\b|tabby|persian|siamese|egyptian/.test(l)) return 'Felis catus';
  return null;
}
function centerCrop(img) {
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  const s = Math.min(w, h); const out = Math.min(s, 480);
  const c = document.createElement('canvas'); c.width = out; c.height = out;
  c.getContext('2d').drawImage(img, (w - s) / 2, (h - s) / 2, s, s, 0, 0, out, out);
  return c;
}
const isAnimal = (k) => { const x = (k || '').toLowerCase(); return x === 'animalia' || x === 'metazoa'; };
export async function identifyImage(dataUrl) {
  const m = await model();
  const img = new Image(); img.decoding = 'async'; img.src = dataUrl;
  await (img.decode ? img.decode() : new Promise((r) => { img.onload = r; }));
  let input = img; try { input = centerCrop(img); } catch (_) {}
  const preds = await m.classify(input, 10);
  const byKey = new Map();
  for (const p of preds) {
    if (p.probability < 0.02) continue;
    const sci = toScientific(p.className);
    const names = sci ? [sci] : p.className.split(',').map((s) => s.trim()).filter(Boolean);
    for (const name of names) {
      let c = []; try { c = await catalog.matchName(name); } catch (_) {}
      const cand = c[0]; if (!cand) continue;
      const prev = byKey.get(cand.taxonKey);
      byKey.set(cand.taxonKey, { ...cand, score: Math.max(prev?.score || 0, p.probability) });
      break;
    }
  }
  const list = [...byKey.values()];
  const animals = list.filter((x) => isAnimal(x.kingdom)).sort((a, b) => b.score - a.score);
  const others = list.filter((x) => !isAnimal(x.kingdom)).sort((a, b) => b.score - a.score);
  return [...animals, ...others].slice(0, 5);
}
