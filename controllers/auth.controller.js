// import twilio from "twilio";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import dotenv from "dotenv";
import { deleteFromCloudinary, uploadOnClodinary } from "../utils/Cloudnary.js";
import { PinChat } from "../models/PinChat.model.js";
import mongoose from "mongoose";
import emailjs from "@emailjs/nodejs";
import axios from "axios";

dotenv.config();

// const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  service: "gmail",
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateOtp = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET);
};

const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const newotp = generateOtp();

  let user = await User.findOne({ email: String(email) });
  try {
    if (user) {
      user.otp = newotp;
      await user.save();
    } else {
      try {
        user = new User({ email, otp: newotp });
        await user.save();
      } catch (err) {
        if (err.code === 11000) {
          user = await User.findOneAndUpdate(
            { email },
            { otp: newotp },
            { new: true }
          );
        } else {
          throw err;
        }
      }
    }

    // Send email using EmailJS Node SDK
    // const serviceID = process.env.EMAILJS_SERVICE_ID;
    // const templateID = process.env.EMAILJS_TEMPLATE_ID;
    // const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    // const privateKey = process.env.EMAILJS_PRIVATE_KEY; // highly recommended

    // const templateParams = {
    //   to_email: email,
    //   otp: newotp,
    //   app_name: "Chat-In",
    // };

    // const response = await emailjs.send(
    //   serviceID,
    //   templateID,
    //   templateParams,
    //   {
    //     privateKey,
    //   }
    // );

    // console.log("EmailJS Response:", response);

    return res
      .status(200)
      .json({ otp: newotp, message: "OTP sent successfully" });
  } catch (error) {
    console.log("Error sending OTP:", error);

    if (user) {
      user.otp = undefined;
      await user.save();
    }
    return res.status(500).json({ error: "Error sending OTP" });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  if (!otp) {
    return res.status(400).json({ error: "otp is required" });
  }

  let user = await User.findOne({
    email: String(email),
  });

  try {
    if (user) {
      if (user.otp === String(otp)) {
        user.isVerified = true;
        user.otp = undefined;
        await user.save();
        const token = generateToken(user);

        res.cookie("token", token, {
          httpOnltly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 5 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({ message: "OTP varifying succesfully" });
      } else {
        return res.status(400).json({ error: "Enter valid otp" });
      }
    }
    return res.status(200).json({ error: "error while verifying otp" });
  } catch (error) {
    console.log("Error verifying OTP: ", error);
    if (user) {
      user.otp = undefined;
      await user.save();
    }
    return res
      .status(500)
      .json({ error: "Error verifying OTP, check your otp" });
  }
};

// const handleOtp = async (req, res) => {
//   const { email, mobileno, otp, action } = req.body;

//   if (!mobileno) {
//     return res.status(400).json({ message: "Phone number is required" });
//   }
//   if (!email) {
//     return res.status(400).json({ message: "Email is required" });
//   }

//   const newotp = generateOtp();
//   let user = await User.findOne({
//     $or: [{ mobileno: String(mobileno) }, { email: String(email) }],
//   });

//   const mailOptions = {
//     from: `Chat-In <${process.env.EMAIL_USER}>`,
//     to: email,
//     subject: "Your OTP for Verification for Chat-In",
//     text: `Your OTP for Chat-In application is: ${newotp}`,
//     html: `<h2>Your OTP for Chat-In application is: <b>${newotp}</b></h2>`,
//   };

//   try {
//     if (action === "send") {
//       if (!user) {
//         user = new User({
//           email: String(email),
//           mobileno: String(mobileno),
//           otp: String(newotp),
//         });
//       } else {
//         user.email = String(email);
//         user.mobileno = String(mobileno);
//         user.otp = String(newotp);
//       }

//       await user.save();

//       // await client.messages.create({
//       //   body: `Your OTP for login chatapp is ${newotp}`,
//       //   from: process.env.TWILIO_PHONE_NUMBER,
//       //   to: `+91${mobileno}`,
//       // });

//       const info = await transporter.sendMail(mailOptions);
//       if (!info || !info.accepted || info.accepted.length === 0) {
//         return res.status(500).json({ message: "Failed to send OTP" });
//       }

//       return res.status(200).json({ message: "OTP sent successfully" });
//     }
//   } catch (error) {
//     console.log("Error sending OTP: ", error);
//     user.otp = undefined;
//     await user.save();
//     return res.status(500).json({ message: "Error sending OTP" });
//   }
//   try {
//     if (action === "verify") {
//       const user = await User.findOne({ mobileno: String(mobileno) });

//       if (user && user.otp === String(otp)) {
//         user.isVerified = true;
//         user.otp = undefined;
//         await user.save();

//         const token = generateToken(user);

//         res.cookie("token", token, {
//           httpOnly: true,
//           secure: process.env.NODE_ENV === "production",
//           sameSite: "strict",
//           maxAge: 5 * 24 * 60 * 60 * 1000,
//         });

//         return res.status(200).json({ message: "OTP verified successfully" });
//       } else {
//         return res.status(400).json({ message: "Invalid OTP" });
//       }
//     }
//     return res.status(400).json({ message: "Invalid action" });
//   } catch (error) {
//     console.log("Error verifying OTP: ", error);
//     user.otp = undefined;
//     await user.save();
//     return res.status(500).json({ message: "Error verifying OTP" });
//   }
// };

const userLogout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "An error occurred" });
  }
};

const checkAuth = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res
        .status(401)
        .json({ isLoggedIn: false, message: "Invalid token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    return res.status(200).json({
      isLoggedIn: true,
      userId: user._id,
      email: user.email,
      bio: user.bio,
      mobileno: user.mobileno,
      name: user.name || "",
      profilepic: user.profilepic,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return res
      .status(401)
      .json({ isLoggedIn: false, message: "Invalid token" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { name, email, mobileno, bio } = req.body;
    const profilepic = req.file?.path;

    const user = await User.findOne({ email: String(email) });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) {
      user.name = name;
    }
    if (mobileno) {
      user.mobileno = mobileno;
    }
    if (bio) {
      user.bio = bio;
    }

    if (profilepic) {
      const oldimage = user.profilepic;
      const cloudinarypic = await uploadOnClodinary("profile-pics", profilepic);

      if (cloudinarypic && cloudinarypic.url) {
        user.profilepic = cloudinarypic.secure_url;
        if (oldimage) {
          await deleteFromCloudinary(oldimage);
        }
      } else {
        console.log("Error uploading to Cloudinary");
        return res.status(500).json({ message: "Error uploading image" });
      }
    }

    await user.save();
    return res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    console.log("Error in update profile: ", error);
    return res.status(500).json({ message: "An error occurred" });
  }
};

const fetchUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (user) {
      const name = user.name;
      const email = user.email;
      const mobileno = user.mobileno;
      const profilepic = user.profilepic;
      return res.status(200).json({ name, email, mobileno, profilepic });
    }
  } catch (error) {
    console.log("error while fetching user", error);
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);

    if (user) {
      return res
        .status(200)
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
        })
        .json({ message: "User deleted successfully" });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.log("error while deleting user", error);
    return res
      .status(500)
      .json({ message: "An error occurred while deleting profile" });
  }
};

const addpinUser = async (req, res) => {
  const { userTopinid } = req.body;
  if (!userTopinid) {
    return res.status(400).json({ error: "userid is require" });
  }
  if (!mongoose.Types.ObjectId.isValid(userTopinid)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  const loginuser = req.user;

  try {
    let userToPin = await User.findById(userTopinid).select("-otp");

    if (!userToPin) {
      return res.status(404).json({ error: "user not found" });
    }

    let user = await User.findById(loginuser).select("-otp");
    let pinchat = await PinChat.findOne({ user: user });

    if (!pinchat) {
      pinchat = new PinChat({
        user: user,
        pinUsers: [userToPin],
      });

      await pinchat.save();
      return res.status(201).json({ message: "user added to pin", pinchat });
    } else {
      const findIndex = pinchat.pinUsers.findIndex((id) => {
        return id.toString() === userToPin._id.toString();
      });

      if (findIndex !== -1) {
        pinchat.pinUsers.splice(findIndex, 1);
      } else {
        pinchat.pinUsers.push(userTopinid);
      }
    }
    await pinchat.save();
    return res.json({ message: "user pin list updated", pinchat });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

export {
  sendOtp,
  verifyOtp,
  userLogout,
  checkAuth,
  updateUserProfile,
  fetchUser,
  deleteUser,
  addpinUser,
};
