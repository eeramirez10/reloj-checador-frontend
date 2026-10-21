import type { CreateDeviceInput, Device } from '../types/device'

export interface DeviceFormValues {
  branchId: string
  name: string
  ipAddress: string
  tcpPort: string
  syncIntervalSeconds: string
  enabled: boolean
}

export type DeviceFormErrors = Partial<Record<keyof DeviceFormValues, string>>

export const initialDeviceFormValues: DeviceFormValues = {
  branchId: '',
  name: '',
  ipAddress: '',
  tcpPort: '4370',
  syncIntervalSeconds: '60',
  enabled: true,
}

function isIpv4Address(value: string): boolean {
  const octets = value.trim().split('.')
  return octets.length === 4 && octets.every((octet) => {
    if (!/^\d{1,3}$/.test(octet)) return false
    const number = Number(octet)
    return number >= 0 && number <= 255
  })
}

function isIntegerInRange(value: string, min: number, max: number): boolean {
  const number = Number(value)
  return Number.isInteger(number) && number >= min && number <= max
}

export function getDeviceFormValues(device?: Device): DeviceFormValues {
  return device ? {
    branchId: device.branchId ?? '', name: device.name, ipAddress: device.ipAddress,
    tcpPort: String(device.tcpPort), syncIntervalSeconds: String(device.syncIntervalSeconds), enabled: device.enabled,
  } : initialDeviceFormValues
}

export function validateDeviceForm(values: DeviceFormValues, requireBranch = true): DeviceFormErrors {
  const errors: DeviceFormErrors = {}
  const name = values.name.trim()
  if (requireBranch && !values.branchId) errors.branchId = 'Selecciona la sucursal del reloj.'

  if (!name) errors.name = 'Escribe un nombre para el reloj.'
  else if (name.length > 120) errors.name = 'El nombre no puede superar 120 caracteres.'

  if (!isIpv4Address(values.ipAddress)) errors.ipAddress = 'Escribe una dirección IPv4 válida.'
  if (!isIntegerInRange(values.tcpPort, 1, 65535)) errors.tcpPort = 'Usa un puerto entre 1 y 65535.'
  if (!isIntegerInRange(values.syncIntervalSeconds, 15, 86400)) {
    errors.syncIntervalSeconds = 'Usa un intervalo entre 15 y 86400 segundos.'
  }

  return errors
}

export function toCreateDeviceInput(values: DeviceFormValues): CreateDeviceInput {
  return {
    branchId: values.branchId,
    name: values.name.trim(),
    ipAddress: values.ipAddress.trim(),
    tcpPort: Number(values.tcpPort),
    syncIntervalSeconds: Number(values.syncIntervalSeconds),
    enabled: values.enabled,
  }
}
