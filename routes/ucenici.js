import express from "express";
import mongoose from "mongoose";
import Ucenik from "../models/Ucenik.js";
import Razred from "../models/Razred.js";
import provjeriToken from "../middleware/auth.js";

const router = express.Router();

// Sve rute zahtijevaju prijavu
router.use(provjeriToken);

// POST - dodavanje ucenika u razred
router.post("/razredi/:razredId/ucenici", async (req, res) => {
    try {
        const razredId = req.params.razredId;
        const { ime, prezime } = req.body;

        if (!mongoose.isValidObjectId(razredId)) {
            return res.status(400).json({
                greska: "Neispravan ID razreda"
            });
        }

        if (typeof ime !== "string" || typeof prezime !== "string" ||
            !ime.trim() || !prezime.trim()) {
            return res.status(400).json({
                greska: "Potrebno je unijeti ime i prezime ucenika"
            });
        }

        // Provjera pripada li razred ucitelju
        const razred = await Razred.findOne({
            _id: razredId,
            korisnikId: req.korisnikId
        });

        if (!razred) {
            return res.status(404).json({
                greska: "Razred nije pronaden"
            });
        }

        const noviUcenik = new Ucenik({
            ime: ime.trim(),
            prezime: prezime.trim(),
            razredId: razredId,
            korisnikId: req.korisnikId
        });

        await noviUcenik.save();

        return res.status(201).json({
            poruka: "Ucenik je uspjesno dodan",
            ucenik: noviUcenik
        });

    } catch (greska) {
        console.error(greska);
        return res.status(500).json({
            greska: "Greska na serveru"
        });
    }
});

// GET - prikaz svih ucenika odredenog razreda
router.get("/razredi/:razredId/ucenici", async (req, res) => {
    try {
        const razredId = req.params.razredId;

        if (!mongoose.isValidObjectId(razredId)) {
            return res.status(400).json({
                greska: "Neispravan ID razreda"
            });
        }

        const razred = await Razred.findOne({
            _id: razredId,
            korisnikId: req.korisnikId
        });

        if (!razred) {
            return res.status(404).json({
                greska: "Razred nije pronaden"
            });
        }

        const ucenici = await Ucenik.find({
            razredId: razredId,
            korisnikId: req.korisnikId
        }).sort({ prezime: 1, ime: 1 });

        return res.status(200).json(ucenici);

    } catch (greska) {
        console.error(greska);
        return res.status(500).json({
            greska: "Greska na serveru"
        });
    }
});

// GET - prikaz pojedinog ucenika
router.get("/ucenici/:id", async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                greska: "Neispravan ID ucenika"
            });
        }

        const ucenik = await Ucenik.findOne({
            _id: id,
            korisnikId: req.korisnikId
        });

        if (!ucenik) {
            return res.status(404).json({
                greska: "Ucenik nije pronaden"
            });
        }

        return res.status(200).json(ucenik);

    } catch (greska) {
        console.error(greska);
        return res.status(500).json({
            greska: "Greska na serveru"
        });
    }
});

// PATCH - uredjivanje podataka ucenika
router.patch("/ucenici/:id", async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                greska: "Neispravan ID ucenika"
            });
        }

        const ucenik = await Ucenik.findOne({
            _id: id,
            korisnikId: req.korisnikId
        });

        if (!ucenik) {
            return res.status(404).json({
                greska: "Ucenik nije pronaden"
            });
        }

        const { ime, prezime } = req.body;

        if (ime === undefined && prezime === undefined) {
            return res.status(400).json({
                greska: "Potrebno je unijeti podatke za izmjenu"
            });
        }

        if (ime !== undefined) {
            if (typeof ime !== "string" || !ime.trim()) {
                return res.status(400).json({
                    greska: "Ime ucenika nije ispravno"
                });
            }

            ucenik.ime = ime.trim();
        }

        if (prezime !== undefined) {
            if (typeof prezime !== "string" || !prezime.trim()) {
                return res.status(400).json({
                    greska: "Prezime ucenika nije ispravno"
                });
            }

            ucenik.prezime = prezime.trim();
        }

        await ucenik.save();

        return res.status(200).json({
            poruka: "Podaci ucenika su uspjesno azurirani",
            ucenik: ucenik
        });

    } catch (greska) {
        console.error(greska);
        return res.status(500).json({
            greska: "Greska na serveru"
        });
    }
});

// DELETE - brisanje ucenika
router.delete("/ucenici/:id", async (req, res) => {
    try {
        const id = req.params.id;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                greska: "Neispravan ID ucenika"
            });
        }

        const ucenik = await Ucenik.findOne({
            _id: id,
            korisnikId: req.korisnikId
        });

        if (!ucenik) {
            return res.status(404).json({
                greska: "Ucenik nije pronaden"
            });
        }

        // Provjera postoje li biljeske povezane s ucenikom
        const brojBiljeski = await mongoose.connection
            .collection("biljeske")
            .countDocuments({
                ucenikId: ucenik._id,
                korisnikId: ucenik.korisnikId
            });

        if (brojBiljeski > 0) {
            return res.status(409).json({
                greska: "Ucenik ima povezane biljeske i ne moze se obrisati"
            });
        }

        await Ucenik.deleteOne({
            _id: id,
            korisnikId: req.korisnikId
        });

        return res.status(200).json({
            poruka: "Ucenik je uspjesno obrisan"
        });

    } catch (greska) {
        console.error(greska);
        return res.status(500).json({
            greska: "Greska na serveru"
        });
    }
});

export default router;