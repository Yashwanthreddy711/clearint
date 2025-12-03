"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = exports.loginUser = void 0;
const loginUser = (req, res) => {
    // Logic to validate user and return JWT
    res.json({ token: 'sample-token' });
};
exports.loginUser = loginUser;
const registerUser = (req, res) => {
    // Create user
    res.json({ message: 'User registered' });
};
exports.registerUser = registerUser;
//# sourceMappingURL=authController.js.map