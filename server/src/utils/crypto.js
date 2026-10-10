import crypto from 'crypto';

/**
 * Calculate CRC32 checksum for buffer integrity verification
 */
export function crc32(buffer) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

const crc32Table = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

/**
 * Encrypt secret text using AES-256-CBC
 * @param {string} text Plaintext message
 * @param {string} passphrase User password
 * @returns {{ ciphertext: Buffer, salt: Buffer, iv: Buffer }}
 */
export function encryptText(text, passphrase) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(16);
  // Derive 32-byte key using scrypt
  const key = crypto.scryptSync(passphrase, salt, 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

  return { ciphertext, salt, iv };
}

/**
 * Decrypt ciphertext using AES-256-CBC
 * @param {Buffer} ciphertext
 * @param {string} passphrase
 * @param {Buffer} salt
 * @param {Buffer} iv
 * @returns {string} Decrypted plaintext
 */
export function decryptText(ciphertext, passphrase, salt, iv) {
  const key = crypto.scryptSync(passphrase, salt, 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}
