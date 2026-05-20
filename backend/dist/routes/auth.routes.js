"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// register
router.post("/register", (req, res) => {
    res.json({ message: "register route working" });
});
// login
router.post("/login", (req, res) => {
    res.json({ message: "login route working" });
});
// refresh
router.post("/refresh", (req, res) => {
    res.json({ message: "refresh route working" });
});
// logout
router.post("/logout", (req, res) => {
    res.json({ message: "logout route working" });
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map