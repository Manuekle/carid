// lib/qr-generator.ts
import crypto from 'crypto';

interface QRCarData {
  type: 'CAR_ID';
  carId: string;
  vin: string;
  timestamp: string;
}

/**
 * Genera un token único para el QR del vehículo
 * @param carId ID del vehículo
 * @param vin VIN del vehículo
 * @returns Token único para el QR
 */
export function generateCarQR(carId: string, vin: string): string {
  const qrData: QRCarData = {
    type: 'CAR_ID',
    carId,
    vin,
    timestamp: new Date().toISOString(),
  };

  // Crear un token único basado en los datos del vehículo
  const dataString = JSON.stringify(qrData);
  const hash = crypto.createHash('sha256').update(dataString).digest('hex');

  // Crear un token más corto y legible
  const shortToken = hash.substring(0, 16).toUpperCase();

  // Combinar con el ID del carro para hacer un token único
  const qrToken = `CAR_${carId.substring(0, 8)}_${shortToken}`;

  return qrToken;
}

/**
 * Parsea y valida un código QR de vehículo
 * @param qrCode Token del código QR
 * @returns Datos del vehículo extraídos del QR
 */
export function parseCarQR(qrCode: string): QRCarData {
  try {
    // Si es nuestro formato de token
    if (qrCode.startsWith('CAR_')) {
      // Extraer el ID del vehículo del token
      const parts = qrCode.split('_');
      if (parts.length >= 3) {
        const carIdPart = parts[1];

        // El formato del token contiene información básica
        // Para obtener datos completos, necesitaremos consultar la base de datos
        return {
          type: 'CAR_ID',
          carId: carIdPart, // Esto será un fragmento, necesitaremos buscar en BD
          vin: '', // Se llenará desde la BD
          timestamp: new Date().toISOString(),
        };
      }
    }

    // Intentar parsear como JSON (formato anterior)
    const parsed = JSON.parse(qrCode);

    if (parsed.type !== 'CAR_ID' || !parsed.carId || !parsed.vin) {
      throw new Error('Formato de QR inválido');
    }

    return parsed;
  } catch (error) {
    throw new Error('Código QR inválido o formato no reconocido');
  }
}

/**
 * Valida si un token de QR es válido
 * @param qrToken Token a validar
 * @returns boolean indicando si es válido
 */
export function isValidQRToken(qrToken: string): boolean {
  // Validar formato básico
  if (!qrToken || typeof qrToken !== 'string') {
    return false;
  }

  // Validar que comience con CAR_
  if (!qrToken.startsWith('CAR_')) {
    return false;
  }

  // Validar longitud mínima
  if (qrToken.length < 10) {
    return false;
  }

  return true;
}

/**
 * Extrae el ID del vehículo de un token QR (fragmento para búsqueda)
 * @param qrToken Token del QR
 * @returns Fragmento del ID del vehículo para búsqueda
 */
export function extractCarIdFragment(qrToken: string): string | null {
  if (!isValidQRToken(qrToken)) {
    return null;
  }

  const parts = qrToken.split('_');
  if (parts.length >= 2) {
    return parts[1];
  }

  return null;
}
