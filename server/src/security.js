import crypto from 'node:crypto';
const key=()=>process.env.TOKEN_ENCRYPTION_KEY;
export function protect(value){
  if(!value||!key()) return value;
  if(!/^[a-f0-9]{64}$/i.test(key())) throw new Error('TOKEN_ENCRYPTION_KEY must contain exactly 64 hexadecimal characters');
  const iv=crypto.randomBytes(12), cipher=crypto.createCipheriv('aes-256-gcm',Buffer.from(key(),'hex'),iv);
  const encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
  return `enc:${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
}
export function reveal(value){
  if(!value?.startsWith('enc:')) return value;
  const [,iv,tag,data]=value.split(':');
  const decipher=crypto.createDecipheriv('aes-256-gcm',Buffer.from(key(),'hex'),Buffer.from(iv,'hex'));
  decipher.setAuthTag(Buffer.from(tag,'hex'));
  return Buffer.concat([decipher.update(Buffer.from(data,'hex')),decipher.final()]).toString('utf8');
}
