const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const Vonage = require("@vonage/server-sdk");
const UserModel = require("./schema/UserSchema");
const MessageModel = require("./schema/MessageSchema");

app.use(express.json());
app.use(cors());

const uri = // using mongoDB atlas
  process.env.MONGODB_URI ||
  "mongodb+srv://gauravverma:gaurav112233@cluster0.hldpuc5.mongodb.net/test?retryWrites=true&w=majority";

const vonage = new Vonage({
  // using vonage to send messages to phone number
  apiKey: "7bdc0df6",
  apiSecret: "lY3a3cA0WEr4teE4",
});

app.get("/", (req, res) => {
  res.send("Hello");
});

app.post("/sendOTP", async (req, res) => {
  // post request to get Otp from frontend
  let data = req.body;
  const from = "Kisan Network";
  const to = "+919810153260"; // phone number given by Kisan Network
  const text = `Hi. Your OTP is: ${data.otp}`; // otp from frontend

  vonage.message.sendSms(from, to, text, (err, res) => {
    if (err) {
      console.log(err);
    } else {
      if (res.messages[0]["status"] === "0") {
        console.log("Message sent successfully.");
      } else {
        console.log("Error: Message not sent");
      }
    }
  });
  let number = await UserModel.find({ number: data.number }); // checking if number is already present in userDetails database
  if (number.length === 0) {
    // if number is not present
    let newUser = await new UserModel({ number: data.number }); // creating new user as per UserSchema
    newUser.save(); // saving new user in useDetails database
    setTimeout(async () => {
      await UserModel.findOneAndUpdate(
        { number: data.number },
        { $push: { otpInfo: data } }
      );
    }, 1000);
    // after saving user details, using setTimeout with 1 sec timer to find that user again and pushing the
    // otp message as per message schema into the otpInfo array
  } else {
    // if number is present in database then simply pushing th otp message into the otpInfo array without
    // saving the number again in database
    await UserModel.findOneAndUpdate(
      { number: data.number },
      { $push: { otpInfo: data } }
    );
  }
  let newMessage = await MessageModel(data); // finally saving the otp message in messages database as well
  // which contains all the sent messages
  newMessage.save();
  res.send("new message saved");
});

app.post("/getList", async (req, res) => {
  // post request to get message list as per phone number
  let { number } = req.body;
  let { page } = req.query;
  let skip = page * 5;
  try {
    let list = await UserModel.find({ number: number });
    let totalList = await UserModel.find({ number: number }); // to use in pagination component
    if (list.length !== 0) {
      // if number is present in database then performing these operation and returning length of list and list
      list = list[0].otpInfo;
      list.sort((a, b) => {
        // sorting list as per timestamp in descending order
        return b.timeStamp - a.timeStamp;
      });
      list = list.splice(skip, skip + 5); // for pagination to show only 5 lists at a time
      let length = totalList[0].otpInfo.length;
      return res.send({ length, list });
    } else {
      // if number is not present in database then simply returning error
      return res.send("error");
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/completeList", async (req, res) => {
  // get request to fetch complete list of messages form messages database
  let { page } = req.query;
  let skip = page * 5;
  try {
    let totalList = await MessageModel.find();
    let length = totalList.length; // length of totalList to use in paginatio component
    let list = await MessageModel.find() // finding all messages
      .sort({ timeStamp: -1 }) // sorting in descending order on the basis of timestamp
      .skip(skip) // skipping 5*page elements on every page, if viewing first page then not skipping anything
      .limit(5); // limit of elements of every page
    if (totalList.length !== 0) {
      // if total messages is not equal to zero
      return res.send({ length, list }); // returning length of totalList and list array
    } else {
      return res.send("error"); // else returning error message
    }
  } catch (err) {
    console.log(err);
  }
});

app.listen(process.env.PORT || 8000, async () => {
  try {
    await mongoose.connect(uri); // connecting to mongoDB server
    console.log("mongodb server connected");
  } catch (err) {
    console.log(err);
  }
});
