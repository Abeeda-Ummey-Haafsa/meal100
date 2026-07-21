import dns from "node:dns";

dns.setServers([
  "1.1.1.1",
  "1.0.0.1"
]);

import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../src/db/connect.js";

import {
    UserModel,
    VendorModel,
    MenuPackageModel
} from "../src/db/models.js";

import {
    defaultUsers,
    defaultVendors,
    defaultPackages
} from "../src/seedData.js";


async function seed() {
    await connectDB();

    await UserModel.deleteMany({});
    await VendorModel.deleteMany({});
    await MenuPackageModel.deleteMany({});

    await UserModel.insertMany(defaultUsers);
    await VendorModel.insertMany(defaultVendors);
    await MenuPackageModel.insertMany(defaultPackages);

    console.log("Database seeded!");

    process.exit(0);
}

seed();
