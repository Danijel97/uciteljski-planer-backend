import mongoose from "mongoose";

const skolaSchema = new mongoose.Schema({
    naziv: {
        type: String,
        required: true,
        trim: true
    },
    korisnikId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Korisnik",
        required: true
    }
});

const Skola = mongoose.model("Skola", skolaSchema);

export default Skola;