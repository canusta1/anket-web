// anket-web/anket-backend/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

// --- Şema ---
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, minlength: 2 },
  lastName: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },

  password: { type: String, required: true, minlength: 6 }, // HASH saklanır
  
  // Telefon numarası (isteğe bağlı, benzersiz)
  phone: { type: String, trim: true, unique: true, sparse: true },
  
  // Google OAuth alanları
  googleId: { type: String, unique: true, sparse: true },
  profilePicture: { type: String },
  isGoogleUser: { type: Boolean, default: false },
}, { timestamps: true });

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
  return {
    _id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model("User", UserSchema);
