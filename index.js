import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ poruka: "Dobrodosli u API aplikacije Uciteljski planer" });
});

app.listen(PORT, () => {
    console.log(`Server pokrenut na portu ${PORT}`);
});