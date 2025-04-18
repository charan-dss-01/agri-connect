import jwt from "jsonwebtoken";
import { User } from "../models/usermodel.js";

const createTokenAndSaveCookies = async (userId, res) => {
    try {
        // Check if JWT secret key is defined
        if (!process.env.JWT_SECRET_KEY) {
            console.error("JWT_SECRET_KEY is not defined in environment variables.");
            return res.status(500).json({ message: "Server configuration error" });
        }

        // Log the userId to ensure it is being passed correctly
        console.log("userId:", userId);

        // Create the JWT token
        const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
            expiresIn: "7d",
        });

        // Log the token for debugging
        console.log("Generated token:", token);

        // Set the token in cookies
        res.cookie("jwt", token, {
            httpOnly: false, // Ensures the cookie is not accessible via JavaScript in the browser
            secure: true,   // Ensures the cookie is only sent over HTTPS
            sameSite: "strict", // Helps prevent CSRF attacks by allowing cookies to only be sent for same-site requests
        });

        // Save the token in the user's document in the database
        const updatedUser = await User.findByIdAndUpdate(userId, { token }, { new: true });

        // Log the updated user for debugging
        if (!updatedUser) {
            console.error("Failed to update token for user:", userId);
            return res.status(404).json({ message: "User not found" });
        }

        console.log("Updated user:", updatedUser);

        // Return the token for use in the response if needed
        return token;
    } catch (error) {
        console.error("Error in createTokenAndSaveCookies:", error);
        return res.status(500).json({ message: "Server error while generating token" });
    }
};

export default createTokenAndSaveCookies;
