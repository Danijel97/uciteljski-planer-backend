import mongoose from "mongoose";

const razredSchema = new mongoose.Schema({
    naziv: {
        type: String,
        required: true,
        trim: true
    },
    skolaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skola",
        required: true
    },
    korisnikId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Korisnik",
        required: true
    }
});

// Jedan ucitelj ne moze imati dva razreda istog naziva u istoj skoli
razredSchema.index(
    { skolaId: 1, korisnikId: 1, naziv: 1 },
    { unique: true }
);

const Razred = mongoose.model("Razred", razredSchema, "razredi");

export default Razred;