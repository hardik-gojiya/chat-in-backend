import { User } from "../models/User.model.js";
import { Message } from "../models/Message.model.js";
import { deleteFromCloudinary, uploadOnClodinary } from "../utils/Cloudnary.js";
import { PinChat } from "../models/PinChat.model.js";
import mongoose from "mongoose";

const getuserfordashboard = async (req, res) => {
  try {
    const loggedinUser = req.user._id;
    const fethcPinChatModel = await PinChat.findOne({ user: loggedinUser });

    const pinUsers = fethcPinChatModel ? fethcPinChatModel.pinUsers : [];

    const allChat = await User.find({ _id: { $ne: loggedinUser } }).select(
      "-otp"
    );
    let pinChats = allChat.filter((chat) => {
      return pinUsers.includes(chat._id.toString());
    });
    const unpinchat = allChat.filter((chat) => {
      return !pinUsers.includes(chat._id.toString());
    });
    return res.status(200).json({ pinChats, unpinchat });
  } catch (error) {
    console.log("error in getuserfordashboard ", error);
    return res.status(500).json({ error: "internal server error" });
  }
};

const getmessages = async (req, res) => {
  try {
    const { id: uertochatid } = req.params;
    const myid = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender: myid, recipient: uertochatid },
        { sender: uertochatid, recipient: myid },
      ],
    }).populate({
      path: "replyTo",
      populate: {
        path: "sender",
        select: "-otp",
      },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("error while getmessages ", error);
    res.status(500).json({ error: "internal server error" });
  }
};

const sendmessage = async (req, res) => {
  try {
    const sentMsg = req.body.sentMsg;
    const replyTo = req.body.replyTo
      ? new mongoose.Types.ObjectId(req.body.replyTo)
      : null;
    const selectedFile = req.file ? req.file.path : null;
    const { id: recieverid } = req.params;
    const senderid = req.user._id;

    if (!sentMsg && !selectedFile) {
      return res.status(400).json({ error: "Message or file is required" });
    }

    let fileurl = null;

    if (selectedFile) {
      const result = await uploadOnClodinary("chat-image", selectedFile);
      fileurl = result.secure_url || result.url;
      if (!fileurl) {
        return res.status(500).json({ error: "Internal server error" });
      }
    }

    const newmsg = new Message({
      sender: senderid,
      recipient: recieverid,
      message: sentMsg || "",
      replyTo: replyTo,
      file: fileurl || null,
    });

    await newmsg.save();

    res.status(200).json(newmsg);
  } catch (error) {
    console.log("error in sending message ", error);
    res.status(500).json({ error: "internal server error" });
  }
};

const deleteMsg = async (req, res) => {
  try {
    const { id } = req.params;
    const myid = req.user._id;

    if (!id) {
      return res.status(400).json({ error: "Message id is required" });
    }

    const msg = await Message.findById(id);
    if (!msg) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (myid.toString() === msg.sender.toString()) {
      const file = msg.file;
      if (file) {
        await deleteFromCloudinary(file);
      }
      await msg.deleteOne();
      return res.status(200).json({ message: "Message deleted successfully" });
    } else {
      return res
        .status(403)
        .json({ error: "You can only delete your own messages" });
    }
  } catch (error) {
    console.log("error in deleteMsg ", error);
    res.status(500).json({ error: "internal server error" });
  }
};

const editMsg = async (req, res) => {
  try {
    const { id } = req.params;
    const { newMsg } = req.body;
    const myid = req.user._id;

    if (!newMsg) {
      return res.status(400).json({ error: "Message is require" });
    }
    const oldmsg = await Message.findById(id);
    if (!oldmsg) {
      return res.status(400).json({ error: "Message not found" });
    }

    if (oldmsg.sender.toString() != myid.toString()) {
      return res.status(400).json({ error: "you only edit your own messages" });
    }
    oldmsg.message = newMsg;
    await oldmsg.save();
    return res.status(200).json({ error: "Message edited succesfully" });
  } catch (error) {
    console.log("error in editMsg ", error);
    res.status(500).json({ error: "internal server error" });
  }
};

export { getuserfordashboard, getmessages, sendmessage, deleteMsg, editMsg };
