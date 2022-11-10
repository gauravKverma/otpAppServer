const { Schema, model } = require("mongoose");

const MessageSchema = new Schema( 
  // message schema, when we send a message it will be sent in this format
  {
    firstName: String,
    lastName: String,
    number: Number,
    otp: Number,
    date: String,
    time: String,
    timeStamp:String
  },
  {
    versionKey: false,
  }
);

const MessageModel = model("message", MessageSchema); 
// this messages database has information of all the messages sent 

module.exports = MessageModel;
