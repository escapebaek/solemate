import { SneakerSearchResult } from './types'

// Curated dataset of popular running shoes — no API key needed
// Physical specs (weight/drop/stack) are approximate reference values for men's size 10-10.5
const RUNNING_SHOES: SneakerSearchResult[] = [
  // Nike
  { id: 'n-peg41', brand: 'Nike', model: 'Pegasus 41', name: 'Nike Air Zoom Pegasus 41', colorway: 'White/Black', gender: 'Unisex', retailPrice: 130, description: '데일리 트레이닝의 클래식. React 폼과 Zoom Air로 부드럽고 반응성 있는 쿠셔닝.', weight: '280g', drop: '10mm', stack_height: '40mm', cushioning: 'Medium' },
  { id: 'n-peg40', brand: 'Nike', model: 'Pegasus 40', name: 'Nike Air Zoom Pegasus 40', colorway: 'Black/White', gender: 'Unisex', retailPrice: 130, weight: '283g', drop: '10mm', stack_height: '36mm', cushioning: 'Medium' },
  { id: 'n-str11', brand: 'Nike', model: 'Structure 25', name: 'Nike Air Zoom Structure 25', colorway: 'Blue/Silver', gender: 'Unisex', retailPrice: 140, description: '안정성이 필요한 러너를 위한 지지형 데일리 트레이너.', weight: '303g', drop: '10mm', stack_height: '36mm', cushioning: 'Medium' },
  { id: 'n-inv4', brand: 'Nike', model: 'Invincible 3', name: 'Nike ZoomX Invincible Run 3', colorway: 'White/Volt', gender: 'Unisex', retailPrice: 180, description: 'ZoomX 폼 최대 적용. 극강의 쿠셔닝으로 장거리 러닝에 최적.', weight: '275g', drop: '9mm', stack_height: '39mm', cushioning: 'Maximum' },
  { id: 'n-vap', brand: 'Nike', model: 'Vaporfly 3', name: 'Nike ZoomX Vaporfly 3', colorway: 'Pink/Yellow', gender: 'Unisex', retailPrice: 250, description: '카본 플레이트 + ZoomX. 마라톤 레이스화의 기준.', weight: '194g', drop: '8mm', stack_height: '40mm', cushioning: 'Race' },
  { id: 'n-alpha', brand: 'Nike', model: 'Alphafly 3', name: 'Nike Air ZoomX Alphafly 3', colorway: 'White/Orange', gender: 'Unisex', retailPrice: 285, description: '두 개의 Zoom Air 포드 + ZoomX 폼 + 카본 플레이트. 엘리트 마라톤화.', weight: '224g', drop: '8mm', stack_height: '40mm', cushioning: 'Race' },
  { id: 'n-react', brand: 'Nike', model: 'React Infinity Run 4', name: 'Nike React Infinity Run Flyknit 4', colorway: 'Black/White', gender: 'Unisex', retailPrice: 160, weight: '270g', drop: '9mm', stack_height: '39mm', cushioning: 'Medium' },
  { id: 'n-free5', brand: 'Nike', model: 'Free RN 5.0', name: 'Nike Free RN 5.0', colorway: 'Gray/Black', gender: 'Unisex', retailPrice: 100, description: '유연한 밑창으로 발의 자연스러운 움직임을 지원.', weight: '200g', drop: '4mm', stack_height: '25mm', cushioning: 'Minimal' },

  // Adidas
  { id: 'a-ultra', brand: 'Adidas', model: 'Ultraboost 24', name: 'Adidas Ultraboost 24', colorway: 'Core Black', gender: 'Unisex', retailPrice: 190, description: 'Boost 폼 + Primeknit 어퍼. 에너지 리턴이 뛰어난 데일리 트레이너.', weight: '323g', drop: '10mm', stack_height: '32mm', cushioning: 'Medium' },
  { id: 'a-solar', brand: 'Adidas', model: 'Solar Glide 6', name: 'Adidas Solar Glide 6', colorway: 'White/Silver', gender: 'Unisex', retailPrice: 130, weight: '330g', drop: '10mm', stack_height: '32mm', cushioning: 'Medium' },
  { id: 'a-ad4', brand: 'Adidas', model: 'Adizero Adios Pro 3', name: 'Adidas Adizero Adios Pro 3', colorway: 'White/Gold', gender: 'Unisex', retailPrice: 250, description: '5개의 Energyrods + Lightstrike Pro 폼. 서브-2시간 마라톤을 위한 화.', weight: '225g', drop: '6mm', stack_height: '39.5mm', cushioning: 'Race' },
  { id: 'a-boston', brand: 'Adidas', model: 'Adizero Boston 12', name: 'Adidas Adizero Boston 12', colorway: 'Black/White', gender: 'Unisex', retailPrice: 140, description: '템포 및 레이스 겸용. Lightstrike Pro 폼과 Energyrods.', weight: '232g', drop: '6mm', stack_height: '37mm', cushioning: 'Light' },
  { id: 'a-sl20', brand: 'Adidas', model: 'SL20.3', name: 'Adidas SL20.3', colorway: 'White/Blue', gender: 'Unisex', retailPrice: 100, weight: '210g', drop: '10mm', stack_height: '28mm', cushioning: 'Light' },
  { id: 'a-supe', brand: 'Adidas', model: 'Supernova Rise 2', name: 'Adidas Supernova Rise 2', colorway: 'Gray/Orange', gender: 'Unisex', retailPrice: 120, weight: '295g', drop: '10mm', stack_height: '32mm', cushioning: 'Medium' },

  // ASICS
  { id: 'as-gel9', brand: 'ASICS', model: 'Gel-Nimbus 26', name: 'ASICS Gel-Nimbus 26', colorway: 'White/Blue', gender: 'Unisex', retailPrice: 160, description: 'ASICS 최고급 쿠셔닝. FF BLAST+ 폼 + GEL 기술로 장거리에 최적.', weight: '283g', drop: '10mm', stack_height: '42mm', cushioning: 'Maximum' },
  { id: 'as-kay', brand: 'ASICS', model: 'Gel-Kayano 31', name: 'ASICS Gel-Kayano 31', colorway: 'Blue/Silver', gender: 'Unisex', retailPrice: 160, description: '30년 역사의 안정성 대명사. Kayano는 과내전 러너에게 최적.', weight: '299g', drop: '10mm', stack_height: '40mm', cushioning: 'Maximum' },
  { id: 'as-cum', brand: 'ASICS', model: 'Gel-Cumulus 26', name: 'ASICS Gel-Cumulus 26', colorway: 'White/Gray', gender: 'Unisex', retailPrice: 130, description: '다목적 데일리 트레이너. FF BLAST+ 폼으로 부드러운 착지감.', weight: '275g', drop: '10mm', stack_height: '37mm', cushioning: 'Medium' },
  { id: 'as-ds', brand: 'ASICS', model: 'DS Trainer 29', name: 'ASICS DS Trainer 29', colorway: 'Black/Red', gender: 'Unisex', retailPrice: 120, weight: '250g', drop: '8mm', stack_height: '32mm', cushioning: 'Light' },
  { id: 'as-sup', brand: 'ASICS', model: 'Superblast 2', name: 'ASICS Superblast 2', colorway: 'White/Coral', gender: 'Unisex', retailPrice: 180, description: 'FF BLAST TURBO 폼 최대 적용. 카본 플레이트 없는 맥시멀 레이스화.', weight: '239g', drop: '10mm', stack_height: '49.5mm', cushioning: 'Maximum' },
  { id: 'as-mtc', brand: 'ASICS', model: 'Metaspeed Sky+', name: 'ASICS Metaspeed Sky+ Paris', colorway: 'Blue/Pink', gender: 'Unisex', retailPrice: 250, description: '카본 플레이트 레이스화. 스트라이드형 러너에 최적화.', weight: '215g', drop: '5mm', stack_height: '40mm', cushioning: 'Race' },

  // New Balance
  { id: 'nb-1080', brand: 'New Balance', model: '1080v13', name: 'New Balance Fresh Foam X 1080v13', colorway: 'White/Blue', gender: 'Unisex', retailPrice: 165, description: 'Fresh Foam X 최대 적용. 부드럽고 호화로운 데일리 러닝화.', weight: '287g', drop: '6mm', stack_height: '36mm', cushioning: 'Maximum' },
  { id: 'nb-880', brand: 'New Balance', model: '880v14', name: 'New Balance Fresh Foam X 880v14', colorway: 'Gray/Black', gender: 'Unisex', retailPrice: 140, weight: '270g', drop: '8mm', stack_height: '30mm', cushioning: 'Medium' },
  { id: 'nb-1080v12', brand: 'New Balance', model: '1080v12', name: 'New Balance Fresh Foam X 1080v12', colorway: 'Black/White', gender: 'Unisex', retailPrice: 155, weight: '290g', drop: '6mm', stack_height: '36mm', cushioning: 'Maximum' },
  { id: 'nb-sc', brand: 'New Balance', model: 'SC Elite v4', name: 'New Balance FuelCell SC Elite v4', colorway: 'White/Gold', gender: 'Unisex', retailPrice: 250, description: 'FuelCell 폼 + 카본 파이버 플레이트. 뉴발란스의 마라톤 레이스화.', weight: '195g', drop: '6mm', stack_height: '42mm', cushioning: 'Race' },
  { id: 'nb-rebel', brand: 'New Balance', model: 'Rebel v4', name: 'New Balance FuelCell Rebel v4', colorway: 'White/Cyan', gender: 'Unisex', retailPrice: 140, description: '가볍고 탄성 있는 FuelCell 폼. 템포런 & 스피드 트레이닝용.', weight: '200g', drop: '6mm', stack_height: '30mm', cushioning: 'Light' },

  // Brooks
  { id: 'br-gho', brand: 'Brooks', model: 'Ghost 16', name: 'Brooks Ghost 16', colorway: 'White/Gray', gender: 'Unisex', retailPrice: 130, description: '중립 데일리 트레이너의 베스트셀러. DNA LOFT v2 폼으로 부드러운 쿠셔닝.', weight: '280g', drop: '12mm', stack_height: '36mm', cushioning: 'Medium' },
  { id: 'br-gly', brand: 'Brooks', model: 'Glycerin 21', name: 'Brooks Glycerin 21', colorway: 'Black/Silver', gender: 'Unisex', retailPrice: 160, description: 'Brooks 최고급 쿠셔닝. 부드럽고 에너지 리턴이 좋은 DNA LOFT v3.', weight: '295g', drop: '10mm', stack_height: '38mm', cushioning: 'Maximum' },
  { id: 'br-adi', brand: 'Brooks', model: 'Adrenaline GTS 23', name: 'Brooks Adrenaline GTS 23', colorway: 'Blue/White', gender: 'Unisex', retailPrice: 130, description: 'GuideRails 기술로 과도한 무릎 움직임 방지. 안정형 데일리화.', weight: '293g', drop: '12mm', stack_height: '35mm', cushioning: 'Medium' },
  { id: 'br-lev', brand: 'Brooks', model: 'Levitate 6', name: 'Brooks Levitate 6', colorway: 'White/Red', gender: 'Unisex', retailPrice: 150, weight: '292g', drop: '8mm', stack_height: '32mm', cushioning: 'Medium' },
  { id: 'br-hype', brand: 'Brooks', model: 'Hyperion Max 2', name: 'Brooks Hyperion Max 2', colorway: 'Black/Yellow', gender: 'Unisex', retailPrice: 200, description: 'DNA Flash 폼 + 카본 플레이트. 브룩스 최초의 슈퍼화.', weight: '220g', drop: '6mm', stack_height: '39mm', cushioning: 'Race' },

  // Saucony
  { id: 'sc-ride', brand: 'Saucony', model: 'Ride 17', name: 'Saucony Ride 17', colorway: 'White/Blue', gender: 'Unisex', retailPrice: 135, description: 'PWRRUN 폼. 반응성과 쿠셔닝의 균형이 잡힌 데일리 트레이너.', weight: '269g', drop: '8mm', stack_height: '33mm', cushioning: 'Medium' },
  { id: 'sc-tri', brand: 'Saucony', model: 'Triumph 22', name: 'Saucony Triumph 22', colorway: 'Black/White', gender: 'Unisex', retailPrice: 165, description: 'PWRRUN+ 폼으로 호화로운 쿠셔닝. 장거리 훈련에 최적.', weight: '280g', drop: '10mm', stack_height: '38mm', cushioning: 'Maximum' },
  { id: 'sc-endo', brand: 'Saucony', model: 'Endorphin Speed 4', name: 'Saucony Endorphin Speed 4', colorway: 'White/Vizired', gender: 'Unisex', retailPrice: 170, description: 'PWRRUN PB 폼 + 나일론 플레이트. 일상 훈련부터 레이스까지.', weight: '215g', drop: '8mm', stack_height: '36mm', cushioning: 'Light' },
  { id: 'sc-pro', brand: 'Saucony', model: 'Endorphin Pro 4', name: 'Saucony Endorphin Pro 4', colorway: 'White/Gold', gender: 'Unisex', retailPrice: 225, description: 'PWRRUN HG 폼 + 카본 파이버 플레이트. 레이스 전용 슈퍼화.', weight: '220g', drop: '8mm', stack_height: '39.5mm', cushioning: 'Race' },
  { id: 'sc-kin', brand: 'Saucony', model: 'Kinvara 15', name: 'Saucony Kinvara 15', colorway: 'Black/White', gender: 'Unisex', retailPrice: 110, description: '가볍고 유연한 빠른 데일리화. 자연스러운 발 움직임 촉진.', weight: '213g', drop: '4mm', stack_height: '26mm', cushioning: 'Light' },

  // Hoka
  { id: 'hk-clif', brand: 'Hoka', model: 'Clifton 9', name: 'Hoka Clifton 9', colorway: 'White/Sky', gender: 'Unisex', retailPrice: 145, description: '부드럽고 가벼운 맥시멀 쿠셔닝. 호카의 베스트셀러 데일리화.', weight: '252g', drop: '5mm', stack_height: '34mm', cushioning: 'Maximum' },
  { id: 'hk-bon', brand: 'Hoka', model: 'Bondi 8', name: 'Hoka Bondi 8', colorway: 'Black/White', gender: 'Unisex', retailPrice: 165, description: '호카 최대 쿠셔닝. 부드럽고 넉넉한 착용감으로 장거리에 최적.', weight: '298g', drop: '4mm', stack_height: '40mm', cushioning: 'Maximum' },
  { id: 'hk-rio', brand: 'Hoka', model: 'Rincon 3', name: 'Hoka Rincon 3', colorway: 'White/Cyan', gender: 'Unisex', retailPrice: 125, description: '가볍고 빠른 훈련화. 250g 미만의 무게로 스피드 훈련에 적합.', weight: '222g', drop: '5mm', stack_height: '28mm', cushioning: 'Light' },
  { id: 'hk-mach', brand: 'Hoka', model: 'Mach 6', name: 'Hoka Mach 6', colorway: 'Blue/Orange', gender: 'Unisex', retailPrice: 145, description: '빠른 템포용 훈련화. PEBA 폼 + 메탈릭 플레이트.', weight: '222g', drop: '5mm', stack_height: '36mm', cushioning: 'Light' },
  { id: 'hk-rocket', brand: 'Hoka', model: 'Rocket X 2', name: 'Hoka Rocket X 2', colorway: 'White/Black', gender: 'Unisex', retailPrice: 225, description: '카본 플레이트 레이스화. PEBA 폼 + 풀 레ング스 카본.', weight: '201g', drop: '5mm', stack_height: '40mm', cushioning: 'Race' },
  { id: 'hk-aro', brand: 'Hoka', model: 'Arahi 7', name: 'Hoka Arahi 7', colorway: 'White/Blue', gender: 'Unisex', retailPrice: 140, description: 'J-Frame 안정 기술. 맥시멀 쿠셔닝 + 오버프로네이션 제어.', weight: '275g', drop: '5mm', stack_height: '34mm', cushioning: 'Medium' },

  // On Running
  { id: 'on-cld', brand: 'On', model: 'Cloudmonster 2', name: 'On Cloudmonster 2', colorway: 'White/Frost', gender: 'Unisex', retailPrice: 170, description: '과장된 CloudTec 폼. 뛰어난 에너지 리턴과 쿠셔닝.', weight: '290g', drop: '6mm', stack_height: '37mm', cushioning: 'Maximum' },
  { id: 'on-surfer', brand: 'On', model: 'Cloudsurfer 7', name: 'On Cloudsurfer 7', colorway: 'White/Black', gender: 'Unisex', retailPrice: 150, description: 'CloudTec 기술로 부드러운 착지와 반응성 있는 toe-off.', weight: '259g', drop: '8mm', stack_height: '30mm', cushioning: 'Medium' },
  { id: 'on-5', brand: 'On', model: 'Cloud 5', name: 'On Cloud 5', colorway: 'White/Glacier', gender: 'Unisex', retailPrice: 140, weight: '260g', drop: '11mm', stack_height: '28mm', cushioning: 'Light' },
  { id: 'on-x3', brand: 'On', model: 'Cloudstratus 3', name: 'On Cloudstratus 3', colorway: 'Black/White', gender: 'Unisex', retailPrice: 160, weight: '289g', drop: '7mm', stack_height: '35mm', cushioning: 'Medium' },

  // Mizuno
  { id: 'mz-wav', brand: 'Mizuno', model: 'Wave Rider 27', name: 'Mizuno Wave Rider 27', colorway: 'White/Silver', gender: 'Unisex', retailPrice: 130, description: 'Mizuno Wave 기술. 반응성과 쿠셔닝의 균형 잡힌 데일리화.', weight: '253g', drop: '12mm', stack_height: '36mm', cushioning: 'Medium' },
  { id: 'mz-sky', brand: 'Mizuno', model: 'Wave Sky 7', name: 'Mizuno Wave Sky 7', colorway: 'White/Blue', gender: 'Unisex', retailPrice: 150, description: 'ENERZY NXT 폼 + Wave 플레이트. 호화로운 쿠셔닝.', weight: '285g', drop: '10mm', stack_height: '38mm', cushioning: 'Maximum' },
  { id: 'mz-neo', brand: 'Mizuno', model: 'Neo Vista', name: 'Mizuno Neo Vista', colorway: 'White/Pink', gender: 'Unisex', retailPrice: 200, description: 'Mizuno의 카본 레이스화. ENERZY CORE 폼 + 카본 플레이트.', weight: '218g', drop: '6mm', stack_height: '40mm', cushioning: 'Race' },
]

export function searchRunningShoes(query: string): SneakerSearchResult[] {
  const q = query.toLowerCase().trim()
  if (!q) return []

  return RUNNING_SHOES.filter(shoe => {
    const haystack = `${shoe.brand} ${shoe.model} ${shoe.name} ${shoe.colorway ?? ''}`.toLowerCase()
    return q.split(' ').every(word => haystack.includes(word))
  }).slice(0, 10)
}

export function getRunningShoeById(id: string): SneakerSearchResult | undefined {
  return RUNNING_SHOES.find(s => s.id === id)
}

export function findRunningShoeByBrandModel(brand: string, model: string): SneakerSearchResult | undefined {
  const b = brand.toLowerCase()
  const m = model.toLowerCase()
  return RUNNING_SHOES.find(s =>
    s.brand.toLowerCase() === b &&
    (s.model.toLowerCase() === m ||
     s.model.toLowerCase().includes(m) ||
     m.includes(s.model.toLowerCase()))
  )
}
