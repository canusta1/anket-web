const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);

// kullanici semasi
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true, minlength: 2 },
  lastName: { type: String, required: true, trim: true, minlength: 2 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, trim: true, unique: true, sparse: true },
  googleId: { type: String, unique: true, sparse: true },
  profilePicture: { type: String },
  isGoogleUser: { type: Boolean, default: false },
}, { timestamps: true });

// kaydetmeden once sifreyi hashle
UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, BCRYPT_ROUNDS);
  }
  next();
});

// sifre kontrolu
UserSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// guvenli json donusu
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
