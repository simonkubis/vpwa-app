// src/transmit.ts
import { Transmit } from '@adonisjs/transmit-client'

let transmitInstance: Transmit | null = null

export function getTransmit() {
  if (!transmitInstance) {
    transmitInstance = new Transmit({
      baseUrl: 'http://localhost:3333'
      
    })
  }
  return transmitInstance
}

export function useTransmit() {
  return {
    transmit: getTransmit()
  }
}