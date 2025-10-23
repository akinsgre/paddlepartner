import api from './api'

export interface WaterType {
  _id: string
  name: string
  description?: string
}

export async function getWaterTypes(): Promise<WaterType[]> {
  const response = await api.get('/water-types')
  return response.data.waterTypes
}
