import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PinataSDK } from "pinata";
import dotenv from "dotenv";

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
});

async function uploadToPinata() {
  try {
    const filePath = path.resolve(__dirname, "patientNFT.png");
    const fileBuffer = readFileSync(filePath);

    const blob = new Blob([fileBuffer]);
    const file = new File([blob], "patientNFT.png", { type: "image/png" });

    const result = await pinata.upload.public.file(file);
    const url = `https://gateway.pinata.cloud/ipfs/${result.cid}`;

    console.log("✅ Uploaded successfully. Accessible at:", url);
  } catch (error) {
    console.error("❌ Upload failed:", error);
  }
}

uploadToPinata();
