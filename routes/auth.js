import express from "express";
import bcrypt from "bcrypt";
import Korisnik from "../models/Korisnik.js";
import jwt from "jsonwebtoken";
import provjeriToken from "../middleware/auth.js";

const router = express.Router();

router.post("/registracija", async (req, res) => {
    try {
        const { ime, prezime, email, lozinka } = req.body;

        // Provjera jesu li uneseni svi podaci
        if (!ime || !prezime || !email || !lozinka) {
            return res.status(400).json({
                greska: "Potrebno je unijeti sve podatke"
            });
        }

        // Provjera ispravnosti podataka
        if (typeof ime !== "string" || typeof prezime !== "string" ||
            typeof email !== "string" || typeof lozinka !== "string") {
            return res.status(400).json({
                greska: "Podaci moraju biti tekst"
            });
        }

        if (!ime.trim() || !prezime.trim() || !email.trim()) {
            return res.status(400).json({
                greska: "Ime, prezime i email ne smiju biti prazni"
            });
        }

        const emailKorisnika = email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailKorisnika)) {
            return res.status(400).json({
                greska: "Email adresa nije ispravna"
            });
        }

        if (lozinka.length < 8) {
            return res.status(400).json({
                greska: "Lozinka mora imati najmanje 8 znakova"
            });
        }

        // Provjera postoji li korisnik s istim emailom
        const postojeciKorisnik = await Korisnik.findOne({
            email: emailKorisnika
        });

        if (postojeciKorisnik) {
            return res.status(409).json({
                greska: "Korisnik s ovim emailom vec postoji"
            });
        }

        // Hashiranje lozinke
        const hashLozinke = await bcrypt.hash(lozinka, 10);

        // Spremanje novog korisnika u bazu
        const noviKorisnik = new Korisnik({
            ime: ime.trim(),
            prezime: prezime.trim(),
            email: emailKorisnika,
            lozinka: hashLozinke
        });

        await noviKorisnik.save();

        return res.status(201).json({
            poruka: "Korisnik je uspjesno registriran",
            korisnik: {
                id: noviKorisnik._id,
                ime: noviKorisnik.ime,
                prezime: noviKorisnik.prezime,
                email: noviKorisnik.email
            }
        });

    } catch (greska) {
        if (greska.code === 11000) {
            return res.status(409).json({
                greska: "Korisnik s ovim emailom vec postoji"
            });
        }

        console.error(greska);

        return res.status(500).json({
            greska: "Greska na serveru"
        });
    }
});
router.post("/prijava", async (req, res) => {
    try {
        const { email, lozinka } = req.body;

        // Provjera unesenih podataka
        if (typeof email !== "string" || typeof lozinka !== "string" ||
            !email.trim() || !lozinka) {
            return res.status(400).json({
                greska: "Potrebno je unijeti email i lozinku"
            });
        }

        // Pronalazak korisnika
        const korisnik = await Korisnik.findOne({
            email: email.trim().toLowerCase()
        });

        if (!korisnik) {
            return res.status(401).json({
                greska: "Neispravan email ili lozinka"
            });
        }

        // Provjera lozinke
        const ispravnaLozinka = await bcrypt.compare(
            lozinka,
            korisnik.lozinka
        );

        if (!ispravnaLozinka) {
            return res.status(401).json({
                greska: "Neispravan email ili lozinka"
            });
        }

        // Generiranje JWT tokena
        const token = jwt.sign(
            { id: korisnik._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        // Uspjesna prijava
        return res.status(200).json({
            poruka: "Uspjesna prijava",
            token: token,
            korisnik: {
                id: korisnik._id,
                ime: korisnik.ime,
                prezime: korisnik.prezime,
                email: korisnik.email
            }
        });

    } catch (greska) {
        console.error(greska);

        return res.status(500).json({
            greska: "Greska na serveru"
        });
    }
});
router.get("/profil", provjeriToken, async (req, res) => {
    try {
        const korisnik = await Korisnik.findById(req.korisnikId);

        if (!korisnik) {
            return res.status(401).json({
                greska: "Korisnik nije pronaden"
            });
        }

        return res.status(200).json({
            id: korisnik._id,
            ime: korisnik.ime,
            prezime: korisnik.prezime,
            email: korisnik.email
        });

    } catch (greska) {
        console.error(greska);

        return res.status(500).json({
            greska: "Greska na serveru"
        });
    }
});
export default router;