const mongoose = require('mongoose');
const dns = require('dns');

// Optional override to bypass local DNS resolvers that refuse SRV/A queries.
if (process.env.DNS_SERVERS) {
  dns.setServers(process.env.DNS_SERVERS.split(',').map(s => s.trim()).filter(Boolean));
}

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI or MONGODB_URI is not set");
  }

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 20000,
  });
  console.log("MongoDB connected successfully");
};

module.exports = connectDB;
