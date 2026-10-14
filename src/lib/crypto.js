// crypto.js — all cryptography happens in the browser via the Web Crypto API.
// The private key never leaves the browser and is never sent to any server.
import * as pkijs from "pkijs";
import * as asn1js from "asn1js";
import { fromBase64, toBase64, arrayBufferToString } from "pvutils";

// Wire pkijs to the browser's Web Crypto engine.
pkijs.setEngine(
  "webcrypto",
  crypto,
  new pkijs.CryptoEngine({ name: "webcrypto", crypto, subtle: crypto.subtle })
);

function bufferToPem(buffer, label) {
  const b64 = toBase64(arrayBufferToString(buffer));
  const lines = b64.match(/.{1,64}/g).join("\n");
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}

function pemToBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  const binary = fromBase64(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export async function generateKeyPair() {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportPublicKeyPem(publicKey) {
  const spki = await crypto.subtle.exportKey("spki", publicKey);
  return bufferToPem(spki, "PUBLIC KEY");
}

export async function exportPrivateKeyPem(privateKey) {
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey);
  return bufferToPem(pkcs8, "PRIVATE KEY");
}

export async function importPublicKeyPem(pem) {
  return crypto.subtle.importKey(
    "spki",
    pemToBuffer(pem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
}

export async function importPrivateKeyPem(pem) {
  return crypto.subtle.importKey(
    "pkcs8",
    pemToBuffer(pem),
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );
}

// A CSR must be signed, but RSA-OAEP keys cannot sign. We build the CSR for
// the journalist's encryption public key and sign it with an ephemeral
// RSASSA-PKCS1-v1_5 keypair that is discarded immediately afterwards.
export async function generateCsr(publicKeyPem, username) {
  const signingKeys = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );

  const csr = new pkijs.CertificationRequest();
  csr.version = 0;
  csr.subject.typesAndValues.push(
    new pkijs.AttributeTypeAndValue({
      type: "2.5.4.3", // commonName
      value: new asn1js.Utf8String({ value: username }),
    })
  );

  await csr.subjectPublicKeyInfo.importKey(
    await importPublicKeyPem(publicKeyPem)
  );

  await csr.sign(signingKeys.privateKey, "SHA-256");

  return bufferToPem(csr.toSchema().toBER(false), "CERTIFICATE REQUEST");
}

export async function encryptMessage(publicKey, text) {
  const data = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    data
  );
  return toBase64(arrayBufferToString(encrypted));
}

export async function decryptMessage(privateKey, base64Cipher) {
  const binary = fromBase64(base64Cipher);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const decrypted = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    bytes.buffer
  );
  return new TextDecoder().decode(decrypted);
}

export function downloadPrivateKey(pem, filename = "private.key") {
  const blob = new Blob([pem], { type: "application/x-pem-file" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
