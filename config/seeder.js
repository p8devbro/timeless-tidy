const Admin = require("../models/Admin");

const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const adminExists = await Admin.findOne({ email: "john.doe@example.com" });

    if (!adminExists)
      await Admin.create({
        name: "John Doe",
        email: "john.doe@example.com",
        password: "admin123", // This will be hashed automatically by the pre-save hook
      });
  } catch (error) {
    console.error("Error seeding admin:", error);
  }
};

module.exports = seedAdmin;
