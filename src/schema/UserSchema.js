const { Schema, model } = require("mongoose");

const UserSchema = new Schema(
  // user schema, in this storing messages from individual user to their collection inside otpInfo array
  {
    number: { type: Number },
    otpInfo: { type: Array },
  },
  {
    versionKey: false,
  }
);

const UserModel = model("userDetail", UserSchema); // userDetails database for every user

module.exports = UserModel;
