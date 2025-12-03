// anket-web/anket-backend/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

// --- TCKN için basit AES-GCM şifreleme (field-level) ---
const PII_SECRET = (process.env.PII_SECRET || "dev-secret").padEnd(32, "0").slice(0, 32);
const ALGO = "aes-256-gcm";

function enc(plain) {
  if (!plain) return undefined;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, Buffer.from(PII_SECRET), iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}
function dec(b64) {
  const raw = Buffer.from(b64, "base64");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const enc = raw.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, Buffer.from(PII_SECRET), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
function maskTCKN(v) { return v ? v.replace(/^(\d{5})\d+(\d{2})$/, "$1******$2") : null; }

// --- Şema ---
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, minlength: 2 },
  lastName: { type: String, required: true, trim: true, minlength: 2 },

  // Şifrelenmiş TCKN alanı (benzersiz)
  tckn_enc: { type: String, unique: true, sparse: true },

  phone: { type: String, unique: true, sparse: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },

  password: { type: String, required: true, minlength: 6 }, // HASH saklanır
  roles: { type: [String], default: ["user"] },
}, { timestamps: true });

// Sanal setter: düz TCKN gelirse tckn_enc'ye şifreleyerek yazar
UserSchema.virtual("tckn")
  .get(function () { return undefined; })
  .set(function (v) { if (v) this.tckn_enc = enc(v); });

// Parola hash
UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  }
  next();
});

// Parola kontrol
UserSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Güvenli JSON (API'ye döneceğimiz versiyon)
UserSchema.methods.safeJSON = function () {
  let tckn = null;
  if (this.tckn_enc) {
    try { tckn = dec(this.tckn_enc); }
    catch { tckn = null; } // anahtar yanlışsa sessizce maskeleme yapar
  }
  return {
    _id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    tcknMasked: maskTCKN(tckn),
    phone: this.phone,
    email: this.email,
    roles: this.roles,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", UserSchema);
