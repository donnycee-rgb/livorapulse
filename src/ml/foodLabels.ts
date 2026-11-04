// ---------------------------------------------------------------------------
// Maps each class the photo model can recognise to a food in the backend's
// Kenyan food database (by id) and to portion choices people actually use.
//
// The keys MUST match the class names used when training the model — they
// are the folder names in ml-dataset/kenyan-food/raw/.
// ---------------------------------------------------------------------------

export interface PortionOption {
  label: string   // what the user taps, e.g. "Medium piece"
  hint?: string   // hand-size guide, e.g. "about 1 fist"
  grams: number
}

export interface ScanFood {
  foodId: string          // id in backend KENYAN_FOODS
  name: string            // display name
  portions: PortionOption[]
}

// Hand-size guides (a fist is roughly 1 cup, a palm roughly 100 g of meat).
const CUP_PORTIONS = (cupGrams: number): PortionOption[] => [
  { label: 'Half cup', hint: 'half a fist', grams: Math.round(cupGrams / 2) },
  { label: '1 cup', hint: 'about 1 fist', grams: cupGrams },
  { label: '1½ cups', hint: '1½ fists', grams: Math.round(cupGrams * 1.5) },
  { label: '2 cups', hint: '2 fists', grams: cupGrams * 2 },
]

const MEAT_PORTIONS: PortionOption[] = [
  { label: 'Small', hint: 'half a palm', grams: 75 },
  { label: 'Medium', hint: '1 palm', grams: 150 },
  { label: 'Large', hint: '1½ palms', grams: 225 },
  { label: 'Extra large', hint: '2 palms', grams: 300 },
]

const PIECES = (gramsEach: number, unit: string): PortionOption[] =>
  [1, 2, 3, 4].map((n) => ({ label: `${n} ${unit}${n > 1 ? 's' : ''}`, grams: gramsEach * n }))

export const SCAN_FOODS: Record<string, ScanFood> = {
  ugali: {
    foodId: 'ugali-white', name: 'Ugali',
    portions: [
      { label: 'Small piece', hint: 'smaller than a fist', grams: 100 },
      { label: 'Medium piece', hint: 'about 1 fist', grams: 150 },
      { label: 'Large piece', hint: '1½ fists', grams: 250 },
      { label: 'Extra large', hint: '2 fists', grams: 350 },
    ],
  },
  sukuma_wiki: { foodId: 'sukuma-wiki', name: 'Sukuma Wiki', portions: CUP_PORTIONS(130) },
  chapati: { foodId: 'chapati', name: 'Chapati', portions: PIECES(60, 'chapati') },
  githeri: { foodId: 'githeri', name: 'Githeri', portions: CUP_PORTIONS(220) },
  pilau: { foodId: 'pilau', name: 'Pilau', portions: CUP_PORTIONS(200) },
  nyama_choma: { foodId: 'nyama-choma-beef', name: 'Nyama Choma', portions: MEAT_PORTIONS },
  mandazi: { foodId: 'mandazi', name: 'Mandazi', portions: PIECES(60, 'piece') },
  matoke: { foodId: 'matoke', name: 'Matoke', portions: CUP_PORTIONS(180) },
  mukimo: { foodId: 'mukimo', name: 'Mukimo', portions: CUP_PORTIONS(200) },
  kachumbari: {
    foodId: 'kachumbari', name: 'Kachumbari',
    portions: [
      { label: '2 tablespoons', hint: '2 thumbs', grams: 50 },
      { label: 'Half cup', hint: 'half a fist', grams: 80 },
      { label: '1 cup', hint: 'about 1 fist', grams: 160 },
    ],
  },
  samosa: { foodId: 'samosa', name: 'Samosa', portions: PIECES(50, 'samosa') },
  mutura: { foodId: 'mutura', name: 'Mutura', portions: PIECES(100, 'piece') },
  masala_chips: {
    foodId: 'chips', name: 'Chips',
    portions: [
      { label: 'Small portion', grams: 100 },
      { label: 'Regular portion', grams: 150 },
      { label: 'Large portion', grams: 250 },
    ],
  },
  omena: {
    foodId: 'dagaa', name: 'Omena (Dagaa)',
    portions: [
      { label: 'Small portion', hint: 'half a fist', grams: 40 },
      { label: 'Regular portion', hint: 'about 1 fist', grams: 80 },
      { label: 'Large portion', hint: '2 fists', grams: 160 },
    ],
  },
  fried_fish: {
    foodId: 'tilapia-fried', name: 'Fried Tilapia',
    portions: [
      { label: 'Small fish', grams: 100 },
      { label: 'Medium fish', grams: 150 },
      { label: 'Large fish', grams: 250 },
    ],
  },
  uji: { foodId: 'uji-mahindi', name: 'Uji', portions: CUP_PORTIONS(240) },
  beef_stew: { foodId: 'kenyan-beef-stew', name: 'Beef Stew', portions: CUP_PORTIONS(250) },
  chicken_stew: { foodId: 'kuku-paka', name: 'Chicken Stew', portions: CUP_PORTIONS(250) },
  beans_stew: { foodId: 'maharagwe', name: 'Maharagwe (Beans)', portions: CUP_PORTIONS(240) },
  chai: {
    foodId: 'chai-maziwa', name: 'Chai',
    portions: [
      { label: 'Small cup', grams: 150 },
      { label: '1 mug', grams: 240 },
      { label: 'Large mug', grams: 350 },
    ],
  },
}

export function scanFoodFor(label: string): ScanFood | undefined {
  return SCAN_FOODS[label.trim().toLowerCase().replace(/\s+/g, '_')]
}
