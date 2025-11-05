import mongoose from "mongoose"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

// emulate __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load your .env.local or .env file
dotenv.config({ path: path.join(__dirname, "../.env.local") })

const attendeeSchema = new mongoose.Schema({
  name: String,
  reg: String,
  track: String,
  attended: Boolean,
})

const Attendee = mongoose.models.Attendee || mongoose.model("Attendee", attendeeSchema)

async function run() {
  try {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      throw new Error("❌ MONGODB_URI is not defined in .env.local")
    }

    await mongoose.connect(uri)
    console.log("✅ Connected to MongoDB")

    await Attendee.deleteMany({})
    await Attendee.insertMany([
      { name: "Nishant Singh", reg: "FE123", track: "Frontend", attended: true },
      { name: "Jane Doe", reg: "BE987", track: "Backend", attended: true },
    ])

    console.log("🌱 Seeded successfully")
  } catch (err) {
    console.error("❌ Seeding failed:", err)
  } finally {
    await mongoose.connection.close()
    console.log("🔌 Connection closed")
  }
}

run()
