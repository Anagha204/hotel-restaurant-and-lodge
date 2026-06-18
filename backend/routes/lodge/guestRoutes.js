import express from "express";
import Guest from "../../models/lodge/Guest.js";

const router = express.Router();

/* =========================
   GET ALL GUESTS
========================= */
router.get("/", async (req, res) => {
    try {
        console.log("GET GUESTS API HIT");

        const guests = await Guest.find().sort({ createdAt: -1 });

        res.status(200).json(guests);
    } catch (err) {
        console.error("GET GUESTS ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

// UPDATE GUEST - More explicit version
router.put("/:id", async (req, res) => {
    try {
        console.log("UPDATE BODY:", req.body); // Debug log

        // Explicitly extract fields including idNumber
        const { name, mobile, email, address, idProof, idNumber, nationality } = req.body;

        // Validations
        if (idProof === "Aadhaar Card" && (!idNumber || !/^\d{12}$/.test(idNumber))) {
            return res.status(400).json({ message: "Aadhaar number must be exactly 12 digits." });
        }

        let query = [];
        if (mobile) query.push({ mobile });
        if (email) query.push({ email });
        if (idProof === "Aadhaar Card" && idNumber) query.push({ idNumber });

        if (query.length > 0) {
            const existing = await Guest.findOne({ $or: query, _id: { $ne: req.params.id } });
            if (existing) {
                if (existing.mobile && existing.mobile === mobile) return res.status(400).json({ message: "A guest with this mobile number already exists." });
                if (existing.email && existing.email === email) return res.status(400).json({ message: "A guest with this email already exists." });
                if (existing.idNumber && existing.idNumber === idNumber) return res.status(400).json({ message: "A guest with this Aadhaar number already exists." });
            }
        }

        const updatedGuest = await Guest.findByIdAndUpdate(
            req.params.id,
            {
                name,
                mobile,
                email,
                address,
                idProof,
                idNumber,  // ✅ Explicitly include idNumber
                nationality
            },
            { new: true, runValidators: true }
        );

        if (!updatedGuest) {
            return res.status(404).json({ message: "Guest not found" });
        }

        console.log("UPDATED GUEST:", updatedGuest); // Debug log
        res.status(200).json(updatedGuest);
    } catch (err) {
        console.error("UPDATE GUEST ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

// CREATE GUEST - More explicit version
router.post("/", async (req, res) => {
    try {
        console.log("CREATE BODY:", req.body); // Debug log

        // Explicitly extract fields including idNumber
        const { name, mobile, email, address, idProof, idNumber, nationality } = req.body;

        // Validations
        if (idProof === "Aadhaar Card" && (!idNumber || !/^\d{12}$/.test(idNumber))) {
            return res.status(400).json({ message: "Aadhaar number must be exactly 12 digits." });
        }

        let query = [];
        if (mobile) query.push({ mobile });
        if (email) query.push({ email });
        if (idProof === "Aadhaar Card" && idNumber) query.push({ idNumber });

        if (query.length > 0) {
            const existing = await Guest.findOne({ $or: query });
            if (existing) {
                if (existing.mobile && existing.mobile === mobile) return res.status(400).json({ message: "A guest with this mobile number already exists." });
                if (existing.email && existing.email === email) return res.status(400).json({ message: "A guest with this email already exists." });
                if (existing.idNumber && existing.idNumber === idNumber) return res.status(400).json({ message: "A guest with this Aadhaar number already exists." });
            }
        }

        const guest = new Guest({
            name,
            mobile,
            email,
            address,
            idProof,
            idNumber,  // ✅ Explicitly include idNumber
            nationality
        });

        await guest.save();
        console.log("CREATED GUEST:", guest); // Debug log
        res.status(201).json(guest);
    } catch (err) {
        console.error("CREATE GUEST ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});
/* =========================
   DELETE GUEST
========================= */
router.delete("/:id", async (req, res) => {
    try {
        const deletedGuest = await Guest.findByIdAndDelete(req.params.id);

        if (!deletedGuest) {
            return res.status(404).json({ message: "Guest not found" });
        }

        res.status(200).json({ message: "Deleted successfully" });
    } catch (err) {
        console.error("DELETE GUEST ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

export default router;