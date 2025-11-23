// This file needs to create routes for the user's front end to connect to the mongo db backend

// bring in router from express and the new/returning user controllers
import { Router } from "express";
import { newUserRegister, returningUserLogin } from "../controllers/newUserLogin.controller.js";

// create a router
const router = Router();

// list the routes for login/register
router.post("/register", newUserRegister);
router.post("/login", returningUserLogin);

// make router visible in index.js
export default router;

