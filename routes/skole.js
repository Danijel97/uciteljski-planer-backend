import express from "express";
import mongoose from "mongoose";
import Skola from "../models/Skola.js";
import provjeriToken from "../middleware/auth.js";

const router = express.Router();

// Sve rute za skole zahtijevaju prijavu
router.use(provjeriToken);

// GET - prikaz svih skola prijavljenog ucitelja
router.get("/", async (req, res) => {
    try {
        const skole = await Skola.find({
            korisnikId: req.korisnikId
        }).sort({ naziv: 1 });

        return res.status(200).json(skole);
    } catch (greska) {
        console.error(greska);
        return res.status(500).json({ greska: "Greska na serveru" });
    }
});

// GET - prikaz pojedine skole
router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ greska: "Neispravan ID skole" });
        }

        const skola = await Skola.findOne({
            _id: req.params.id,
            korisnikId: req.korisnikId
        });

        if (!skola) {
            return res.status(404).json({ greska: "Skola nije pronadena" });
        }

        return res.status(200).json(skola);
    } catch (greska) {
        console.error(greska);
        return res.status(500).json({ greska: "Greska na serveru" });
    }
});

// POST - dodavanje nove skole
router.post("/", async (req, res) => {
    try {
        const { naziv } = req.body;

        if (typeof naziv !== "string" || !naziv.trim()) {
            return res.status(400).json({
                greska: "Potrebno je unijeti naziv skole"
            });
        }

        const novaSkola = new Skola({
            naziv: naziv.trim(),
            korisnikId: req.korisnikId
        });

        await novaSkola.save();

        return res.status(201).json({
            poruka: "Skola je uspjesno dodana",
            skola: novaSkola
        });
    } catch (greska) {
        console.error(greska);
        return res.status(500).json({ greska: "Greska na serveru" });
    }
});

// PATCH - uredjivanje skole
router.patch("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ greska: "Neispravan ID skole" });
        }

        const { naziv } = req.body;

        if (typeof naziv !== "string" || !naziv.trim()) {
            return res.status(400).json({
                greska: "Potrebno je unijeti ispravan naziv skole"
            });
        }

        const skola = await Skola.findOneAndUpdate(
            {
                _id: req.params.id,
                korisnikId: req.korisnikId
            },
            { naziv: naziv.trim() },
            { new: true, runValidators: true }
        );

        if (!skola) {
            return res.status(404).json({ greska: "Skola nije pronadena" });
        }

        return res.status(200).json({
            poruka: "Skola je uspjesno azurirana",
            skola: skola
        });
    } catch (greska) {
        console.error(greska);
        return res.status(500).json({ greska: "Greska na serveru" });
    }
});

// DELETE - brisanje skole
router.delete("/:id", async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ greska: "Neispravan ID skole" });
        }

        const skola = await Skola.findOne({
            _id: req.params.id,
            korisnikId: req.korisnikId
        });

        if (!skola) {
            return res.status(404).json({ greska: "Skola nije pronadena" });
        }

        // Skola se ne smije brisati ako ima razrede
        const brojRazreda = await mongoose.connection
            .collection("razredi")
            .countDocuments({
                skolaId: skola._id,
                korisnikId: skola.korisnikId
            });

        if (brojRazreda > 0) {
            return res.status(409).json({
                greska: "Skola sadrzi razrede i ne moze se obrisati"
            });
        }

        await Skola.deleteOne({
            _id: skola._id,
            korisnikId: req.korisnikId
        });

        return res.status(200).json({
            poruka: "Skola je uspjesno obrisana"
        });
    } catch (greska) {
        console.error(greska);
        return res.status(500).json({ greska: "Greska na serveru" });
    }
});

export default router;