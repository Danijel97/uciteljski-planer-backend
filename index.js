import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ poruka: "Dobrodosli u API aplikacije Uciteljski planer" });
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Uspjesno povezivanje s MongoDB bazom");

        app.listen(PORT, () => {
            console.log(`Server pokrenut na portu ${PORT}`);
        });
    })
    .catch((greska) => {
        console.log("Greska pri povezivanju s MongoDB bazom:", greska.message);
        process.exit(1);
    });