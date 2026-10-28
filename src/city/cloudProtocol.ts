/** Room encryption protects names/positions. Signatures preserve host and controller identity. */
export type CityIdentity = { publicKey: JsonWebKey; privateKey: JsonWebKey }
export type CityEnvelope = { sender: string; sequence: number; body: Record<string, unknown> }
export type SealedMessage = { iv: string; data: string }
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes))
const decode = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0))
const text = new TextEncoder()
export async function cityIdentity(): Promise<CityIdentity> {
 const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
 return { publicKey: await crypto.subtle.exportKey('jwk', pair.publicKey), privateKey: await crypto.subtle.exportKey('jwk', pair.privateKey) }
}
export async function cityCipher(secret: string, identity: CityIdentity) {
 const encryption = await crypto.subtle.importKey('raw', decode(secret), 'AES-GCM', false, ['encrypt', 'decrypt'])
 const signing = await crypto.subtle.importKey('jwk', identity.privateKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
 const verifying = new Map<string, CryptoKey>(), seen = new Map<string, number>()
 let sequence = Date.now() * 1000
 return {
  async trust(sender: string, jwk: JsonWebKey) { verifying.set(sender, await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])) },
  forget(sender: string) { verifying.delete(sender); seen.delete(sender) },
  async seal(sender: string, body: Record<string, unknown>): Promise<SealedMessage> {
   const payload = JSON.stringify({ sender, sequence: ++sequence, body })
   const signature = encode(new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, signing, text.encode(payload))))
   const iv = crypto.getRandomValues(new Uint8Array(12))
   const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encryption, text.encode(JSON.stringify({ payload, signature })))
   return { iv: encode(iv), data: encode(new Uint8Array(encrypted)) }
  },
  async open(message: SealedMessage): Promise<CityEnvelope | null> {
   try {
    if (typeof message?.data !== 'string' || message.data.length > 50000 || typeof message.iv !== 'string') return null
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(message.iv) }, encryption, decode(message.data))
    const { payload, signature } = JSON.parse(new TextDecoder().decode(decrypted))
    const envelope = JSON.parse(payload) as CityEnvelope, key = verifying.get(envelope.sender)
    if (!key || !Number.isSafeInteger(envelope.sequence) || !envelope.body || typeof envelope.body !== 'object') return null
    if (!await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, decode(signature), text.encode(payload))) return null
    if (envelope.sequence <= (seen.get(envelope.sender) ?? 0)) return null
    seen.set(envelope.sender, envelope.sequence)
    return envelope
   } catch { return null }
  },
 }
}
