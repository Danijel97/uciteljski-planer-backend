import express from "express";
import mongoose from "mongoose";
import Razred from "../models/Razred.js";
import Skola from "../models/Skola.js";
import provjeriToken from "../middleware/auth.js";

const router = express.Router();

// Sve rute za razrede zahtijevaju prijavu
router.use(provjeriToken);

// POST - dodavanje novog razreda u skolu
router.post("/skole/:skolaId/razredi", async (req, res) => {
    try {
        const skolaId = req.params.skolaId;
        const { naziv } = req.body;

        // Provjera ID-a skole
        if (!mongoose.isValidObjectId(skolaId)) {
            return res.status(400).json({
                greska: "Neispravan ID skole"
            });
        }

        // Provjera naziva razreda
        if (typeof naziv !== "string" || !naziv.trim()) {
            return res.status(400).json({
                greska: "Potrebno je unijeti naziv razreda"
            });
        }

        // Provjera postoji li skola i pripada li ucitelju
        const skola = await Skola.findOne({
            _id: skolaId,
            korisnikId: req.korisnikId
        });

        if (!skola) {
            return res.status(404).json({
                greska: "Skola nije pronadena"
            });
        }

        // Provjera postoji li vec razred istog naziva u skoli
        const postojeciRazred = await Razred.findOne({
            naziv: naziv.trim(),
            skolaId: skolaId,
            korisnikId: req.korisnikId
        });

        if (postojeciRazred) {
            return res.status(409).json({
                greska: "Razred s ovim nazivom vec postoji u skoli"
            });
        }

        // Spremanje novog razreda
        const noviRazred = new Razred({
            naziv: naziv.trim(),
            skolaId: skolaId,
            korisnikId: req.korisnikId
        });

        await noviRazred.save();

        return res.status(201).json({
            poruka: "Razred je uspjesno dodan",
            razred: noviRazred
        });

    } catch (greska) {
        if (greska.code === 11000) {
            return res.status(409).json({
                greska: "Razred s ovim nazivom vec postoji u skoli"
            });
        }

        console.error(greska);

        return res.status(500).json({
            greska: "Greska na serveru"
        });
    }
});

// GET - prikaz svih razreda odredene skole
router.get("/skole/:skolaId/razredi", async (req, res) => {
    try {
        const skolaId = req.params.skolaId;

        if (!mongoose.isValidObjectId(skolaId)) {
            return res.status(400).json({
                greska: "Neispravan ID skole"
            });
        }

        // Provjera pripada li skola prijavljenom ucitelju
        const skola = await Skola.findOne({
            _id: skolaId,
            korisnikId: req.korisnikId
        });

        if (!skola) {
            return res.status(404).json({
                greska: "Skola nije pronadena"
            });
        }

        const razredi = await Razred.find({
            skolaId: skolaId,
            korisnikId: req.korisnikId
        }).sort({ naziv: 1 });

        return res.status(200).json(razredi);

    } catch (greska) {
        console.error(greska);

        return res.status(500).json({
            greska: "Greska na serveru"
        });
    }
});

// GET - prikaz pojedinog razreda
router.get("/razredi/:id", async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                greska: "Neispravan ID razreda"
            });
        }

        const razred = await Razred.findOne({
            _id: id,
            korisnikId: req.korisnikId
        });

        if (!razred) {
            return res.status(404).json({
                greska: "Razred nije pronaden"
            });
        }

        return res.status(200).json(razred);

    } catch (greska) {
        console.error(greska);

        return res.status(500).json({
            greska: "Greska na serveru"
        });
    }
});

// PATCH - uredjivanje naziva razreda
router.patch("/razredi/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const { naziv } = req.body;

        // Provjera ID-a razreda
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                greska: "Neispravan ID razreda"
            });
        }

        // Provjera novog naziva
        if (typeof naziv !== "string" || !naziv.trim()) {
            return res.status(400).json({
                greska: "Potrebno je unijeti naziv razreda"
            });
        }

        // Provjera postoji li razred i pripada li ucitelju
        const razred = await Razred.findOne({
            _id: id,
            korisnikId: req.korisnikId
        });

        if (!razred) {
            return res.status(404).json({
                greska: "Razred nije pronaden"
            });
        }

        // Provjera postoji li vec razred s istim nazivom u skoli
        const postojeciRazred = await Razred.findOne({
            naziv: naziv.trim(),
            skolaId: razred.skolaId,
            korisnikId: req.korisnikId,
            _id: { $ne: id }
        });

        if (postojeciRazred) {
            return res.status(409).json({
                greska: "Razred s ovim nazivom vec postoji u skoli"
            });
        }

        // Spremanje promjene
        razred.naziv = naziv.trim();
        await razred.save();

        return res.status(200).json({
            poruka: "Razred je uspjesno azuriran",
            razred: razred
        });

    } catch (greska) {
        if (greska.code === 11000) {
            return res.status(409).json({
                greska: "Razred s ovim nazivom vec postoji u skoli"
            });
        }

        console.error(greska);

        return res.status(500).json({
            greska: "Greska na serveru"
        });
    }
});

// DELETE - brisanje razreda
router.delete("/razredi/:id", async (req, res) => {
    try {
        const id = req.params.id;

        // Provjera ID-a razreda
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                greska: "Neispravan ID razreda"
            });
        }

        // Provjera postoji li razred i pripada li ucitelju
        const razred = await Razred.findOne({
            _id: id,
            korisnikId: req.korisnikId
        });

        if (!razred) {
            return res.status(404).json({
                greska: "Razred nije pronaden"
            });
        }

        // Provjera postoje li povezani podaci
        const kolekcije = [
            "ucenici",
            "nastavnisati",
            "biljeske",
            "rasporedi",
            "provjere"
        ];

        for (const nazivKolekcije of kolekcije) {
            const brojZapisa = await mongoose.connection
                .collection(nazivKolekcije)
                .countDocuments({
                    razredId: razred._id,
                    korisnikId: razred.korisnikId
                });

            if (brojZapisa > 0) {
                return res.status(409).json({
                    greska: "Razred ima povezane podatke i ne moze se obrisati"
                });
            }
        }

        // Brisanje razreda
        await Razred.deleteOne({
            _id: id,
            korisnikId: req.korisnikId
        });

        return res.status(200).json({
            poruka: "Razred je uspjesno obrisan"
        });

    } catch (greska) {
        console.error(greska);

        return res.status(500).json({
            greska: "Greska na serveru"
        });
    }
});

export default router;