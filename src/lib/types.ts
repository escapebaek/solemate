export interface Shoe {
  id: string
  user_id: string
  brand: string
  model: string
  nickname?: string
  image_url?: string
  color?: string
  size?: string
  purchase_date?: string
  max_mileage: number
  current_mileage: number
  is_retired: boolean
  notes?: string
  specs?: ShoeSpecs
  sneaker_db_id?: string
  sort_order?: number
  created_at: string
}

export interface ShoeSpecs {
  weight?: string
  drop?: string
  stack_height?: string
  cushioning?: string
  category?: string
  msrp?: number
  release_date?: string
  releaseDate?: string
  colorway?: string
  silhouette?: string
  gender?: string
  description?: string
  purchase_price?: number
  purchase_currency?: string
}

export interface Run {
  id: string
  user_id: string
  shoe_id: string
  distance: number
  date: string
  screenshot_url?: string
  notes?: string
  created_at: string
}

export interface SneakerSearchResult {
  id: string
  brand: string
  model: string
  name: string
  colorway?: string
  gender?: string
  releaseDate?: string
  retailPrice?: number
  thumbnail?: string
  image?: string
  description?: string
  cushioning?: string
  // Physical running specs (populated from local DB)
  weight?: string
  drop?: string
  stack_height?: string
  // Community-contributed flag
  isCommunity?: boolean
}
