import express from "express";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";
import bcrypt from "bcryptjs";
import { authenticate, requireRole, requireRoles } from "../middleware/auth.js";

const router = express.Router();

// Apply auth to all routes
router.use(authenticate);

// GET all users - only admin
// router.get("/", requireRole(["admin", "manager"]), async (req, res) => {
//     const users = await User.find().select("-password");
//     res.json(users);
// });
// GET all users - admin, manager, kitchen staff
router.get("/", async (req, res) => {
    const allowedRoles = ["admin", "manager", "kitchen", "kitchen staff", "staff"];
    if (!allowedRoles.includes(req.user.role?.toLowerCase())) {
        return res.status(403).json({ message: "Access denied" });
    }
    const users = await User.find().select("-password");
    res.json(users);
});

// CREATE user – with duplicate email check
router.post("/", requireRole("admin"), async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists. Please use a different email." });
        }
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashed, role });
        await ActivityLog.create({ user: req.user.id, action: "User Created", details: `Created user: ${name} (${email}) with role: ${role}` });
        res.status(201).json({ message: "User created", user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// UPDATE user
router.put("/:id", requireRole("admin"), async (req, res) => {
    const { name, email, role, isActive } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;
        await user.save();
        await ActivityLog.create({ user: req.user.id, action: "User Updated", details: `Updated user: ${user.name} (${user.email})` });
        res.json({ message: "User updated" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE user
router.delete("/:id", requireRole("admin"), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        await user.deleteOne();
        await ActivityLog.create({ user: req.user.id, action: "User Deleted", details: `Deleted user: ${user.name} (${user.email})` });
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Reset password
router.post("/:id/reset-password", requireRole("admin"), async (req, res) => {
    const { newPassword } = req.body;
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;
        await user.save();
        await ActivityLog.create({ user: req.user.id, action: "Password Reset", details: `Reset password for user: ${user.name} (${user.email})` });
        res.json({ message: "Password reset successful" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;