import bcrypt from 'bcryptjs'

export const authService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
    // return Bun.password.hash(password,{
      // algorithm: 'bcrypt',
      // cost: 10,
    // })           // usa bcrypt por defecto
  },

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
    // return Bun.password.verify(password, hash, 'bcrypt')
  },
}