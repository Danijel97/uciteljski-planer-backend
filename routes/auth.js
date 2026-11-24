import express from "express";
import bcrypt from "bcrypt";
import Korisnik from "../models/Korisnik.js";

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

export default router;