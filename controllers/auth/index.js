// controllers/auth/index.js
const loginController = require("./loginController");
const registerController = require("./registerController");
const passwordController = require("./passwordController");
const emailController = require("./emailController");

// Exportar todos los controladores
module.exports = {
  ...loginController,
  ...registerController,
  ...passwordController,
  ...emailController,
};
