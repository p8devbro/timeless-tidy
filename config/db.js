const mongoose = require("mongoose");
const seedAdmin = require("./seeder");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/timeless-tidy",
      {
        // These options are no longer needed in newer versions of Mongoose
        // but kept for compatibility with older versions
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed initial admin
    await seedAdmin();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
