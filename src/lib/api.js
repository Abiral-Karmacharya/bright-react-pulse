// api.js — single source of truth for all backend calls.
// Set BASE_URL to your Go backend (e.g. "http://localhost:8080") to use a real
// server. Leave it as null to run in demo mode, where a local in-browser
// stand-in backend stores data in localStorage so the full flow works
// without any server running.
const BASE_URL = null;

const DB_KEY = "hollows_db";

function loadDb() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY)) || { users: [], messages: [] };
  } catch {
    return { users: [], messages: [] };
  }
}

function saveDb(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

async function POST(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function GET(url) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) {
    const err = new Error(`Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// ---- Demo backend (localStorage) ----
const demo = {
  async register(body) {
    const db = loadDb();
    if (db.users.some((u) => u.username === body.username)) {
      throw new Error("Username already taken");
    }
    if (db.users.some((u) => u.email === body.email)) {
      throw new Error("Email already registered");
    }
    const user = {
      user_id: db.users.length + 1,
      username: body.username,
      email: body.email,
      password: body.password,
      public_key: body.public_key,
      csr: body.csr,
      created_at: new Date().toISOString(),
    };
    db.users.push(user);
    saveDb(db);
    return { user_id: user.user_id, username: user.username };
  },

  async login(body) {
    const db = loadDb();
    const user = db.users.find(
      (u) => u.email === body.email && u.password === body.password
    );
    if (!user) throw new Error("Invalid email or password");
    return { user_id: user.user_id, username: user.username };
  },

  async verify(username) {
    const db = loadDb();
    const user = db.users.find((u) => u.username === username);
    if (!user) {
      const err = new Error("Identity could not be verified");
      err.status = 404;
      throw err;
    }
    return { user_id: user.user_id, valid: true };
  },

  async getPubKey(userId) {
    const db = loadDb();
    const user = db.users.find((u) => u.user_id === Number(userId));
    if (!user) throw new Error("Journalist not found");
    return { public_key: user.public_key };
  },

  async drop(body) {
    const db = loadDb();
    db.messages.push({
      message_id: db.messages.length + 1,
      user_id: Number(body.user_id),
      cipher_text: body.message,
      created_at: new Date().toISOString(),
    });
    saveDb(db);
    return { ok: true };
  },

  async getMessages(userId) {
    const db = loadDb();
    return db.messages.filter((m) => m.user_id === Number(userId));
  },
};

// ---- Public API ----
export const api = {
  register: (body) =>
    BASE_URL ? POST(`${BASE_URL}/register`, body) : demo.register(body),
  login: (body) => (BASE_URL ? POST(`${BASE_URL}/login`, body) : demo.login(body)),
  verify: (username) =>
    BASE_URL
      ? GET(`${BASE_URL}/verify?username=${encodeURIComponent(username)}`)
      : demo.verify(username),
  getPubKey: (userId) =>
    BASE_URL
      ? GET(`${BASE_URL}/pub?user_id=${encodeURIComponent(userId)}`)
      : demo.getPubKey(userId),
  drop: (body) => (BASE_URL ? POST(`${BASE_URL}/drop`, body) : demo.drop(body)),
  getMessages: (userId) =>
    BASE_URL
      ? GET(`${BASE_URL}/messages?user_id=${encodeURIComponent(userId)}`)
      : demo.getMessages(userId),
};
