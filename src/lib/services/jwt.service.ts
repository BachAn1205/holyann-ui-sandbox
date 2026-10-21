
import jwt from 'jsonwebtoken'
import {UserRole} from '../types/auth.types.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = '7d'

export interface JWTPayload {
    userId: string
    email: string
    role: UserRole
}

export class JWTService {
    /**
     * Tạo JWT token
     */
    static generateToken(payload: JWTPayload): string {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        })
    }

    /**
     * Xác thực JWT token
     */
    static verifyToken(token: string): JWTPayload | null {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
            return decoded
        } catch (error) {
            console.error('Error verifying token:', error)
            return null
        }
    }

    /**
     * Decode token không verify (dùng để debug)
     */
    static decodeToken(token: string): JWTPayload | null {
        try {
            const decoded = jwt.decode(token) as JWTPayload
            return decoded
        } catch (error) {
            console.error('Error decoding token:', error)
            return null
        }
    }
}

