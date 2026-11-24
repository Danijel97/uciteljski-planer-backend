import mongoose from "mongoose";

const korisnikSchema = new mongoose.Schema({
    ime: {
        type: String,
        required: true
    },
    prezime: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    lozinka: {
        type: String,
        required: true
    }
});

const Korisnik = mongoose.model("Korisnik", korisnikSchema);

export default Korisnik;