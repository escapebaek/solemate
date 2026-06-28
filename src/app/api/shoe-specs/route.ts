import { NextRequest } from 'next/server'
import { getRunningShoeById, findRunningShoeByBrandModel } from '@/lib/running-shoes-db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const brand = searchParams.get('brand')
  const model = searchParams.get('model')

  let shoe = id ? getRunningShoeById(id) : undefined
  if (!shoe && brand && model) {
    shoe = findRunningShoeByBrandModel(brand, model)
  }

  if (!shoe) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json({
    weight: shoe.weight ?? null,
    drop: shoe.drop ?? null,
    stack_height: shoe.stack_height ?? null,
    cushioning: shoe.cushioning ?? null,
  })
}
