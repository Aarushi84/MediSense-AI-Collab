const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

function attachUserFromToken(req, res, next) {
    delete req.headers["x-user-id"];

    const authHeader = req.headers["authorization"];

    console.log("AUTH HEADER:", authHeader ? "PRESENT" : "MISSING");

    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];

        try {
            const decoded = jwt.verify(token, JWT_SECRET);

            console.log("DECODED USER ID:", decoded.id);

            req.headers["x-user-id"] = decoded.id;
            req.user = decoded;

        } catch (err) {
            console.log("JWT ERROR:", err.message);
        }
    }

    console.log("FINAL USER ID:", req.headers["x-user-id"]);

    next();
}

module.exports = { attachUserFromToken, JWT_SECRET };