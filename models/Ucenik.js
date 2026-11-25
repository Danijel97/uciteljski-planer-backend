import mongoose from "mongoose";

const ucenikSchema = new mongoose.Schema({
    ime: {
        type: String,
        required: true,
        trim: true
    },
    prezime: {
        type: String,
        required: true,
        trim: true
    },
    razredId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Razred",
        required: true
    },
    korisnikId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Korisnik",
        required: true
    }
});

const Ucenik = mongoose.model("Ucenik", ucenikSchema, "ucenici");

export default Ucenik;