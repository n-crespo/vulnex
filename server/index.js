


import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// this is needed to load the environment vars from the .env file
dotenv.config();

// this creates an express app
const app = express();
// cors is needed to allow cross-origin requests -- such as from frontend to backend
app.use(cors());
// express.json() is handles middleware/json parsing
app.use(express.json());

// connect to MongoDB:
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/vulnexdatabase")
    .then(() => console.log('Connected to MongoDB!'))
    .catch((err) => console.error('MongoDB connection error:', err));

// mongoose schema for authentication
const userAuthenticationSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true, lowercase: true},
    passwordHash: {type: String, required: true} // storing passwords in hashed form with bcrypt
});

// this does a pre-save as a hook so that the password can be hashed before saving to db
userAuthenticationSchema.pre('save', async function(next) {
    if (!this.isModified('passwordHash')) return next(); // hash password when modified
    {
        // randomness generator with salt for bcrypt
        const salt = await bcrypt.genSalt(10);
        // use bcrypt to hash passwordHash into hashed passwordHash
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    }
    next();
});

// create the "class" (model) for userAuthenticationSchema that can be used to create new users:
const User = mongoose.model("User", userAuthenticationSchema); // "User" is the name of the model


// TODO: Add routes for new user account registration and past user login authentication



// a simple route to test the server
app.get('/', (req, res) => {
    res.send("The VulnEx Backend MongoDB Server is running!");
});




// start the server (open the door to connection linking traffic):
const PORT = process.env.PORT || 5000; // NOT 27017!!! 27017 is used by MongoDB!!! -- not for html traffic!
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));