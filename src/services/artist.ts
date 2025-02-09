import axios from 'axios'
import { IArtist } from '../Interfaces'

//const baseUrl = 'http://ec2-13-53-170-200.eu-north-1.compute.amazonaws.com:5000'
const baseUrl = 'http://localhost:8080'
const basePath = 'artists'


const getAll = (): Promise<IArtist[]> => {
  return axios
    .get<IArtist[]>(baseUrl + '/' + basePath)
    .then(response => response.data)
}

const patch = (id: number, changes: {}): Promise<IArtist> => {
  const request = axios.patch(baseUrl  + '/' + basePath + '/' + id, changes)
  return request.then(response => response.data)
}

const remove = (id: number): Promise<IArtist> => {
  const request = axios.delete(baseUrl  + '/' + basePath + '/' + id)
  return request.then(response => response.data)
}

const create = (artist: IArtist): Promise<IArtist> => {
  const request = axios.post(baseUrl + '/' + basePath, artist)
  return request.then(response => response.data)
}

const exportedObject = {
  getAll,
  patch,
  remove,
  create
}

export default exportedObject