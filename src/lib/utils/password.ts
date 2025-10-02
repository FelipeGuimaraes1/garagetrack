import bcrypt from "bcryptjs";

/** Gera um hash seguro para senha (bcrypt) */
export async function hashPassword(plain: string) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
}

/** Compara a senha informada com o hash salvo */
export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
