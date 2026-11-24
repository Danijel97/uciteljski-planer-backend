import jwt from "jsonwebtoken";

const provjeriToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            greska: "Niste prijavljeni"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const podaci = jwt.verify(token, process.env.JWT_SECRET);

        req.korisnikId = podaci.id;

        next();
    } catch (greska) {
        return res.status(401).json({
            greska: "Neispravan ili istekao token"
        });
    }
};

export default provjeriToken;