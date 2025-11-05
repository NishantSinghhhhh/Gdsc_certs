// app/api/cert/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PDFDocument, StandardFonts } from "pdf-lib"
import fs from "node:fs/promises"
import path from "node:path"
import mongoose, { Schema, model, models, Model } from "mongoose"
import { connectDB } from "@/lib/dbConnect"

export const runtime = "nodejs"

type Track = "Frontend" | "Backend"

// ====== Types ======
interface IAttendee {
  name: string
  reg: string
  track: Track
  attended: boolean
  createdAt?: Date
  updatedAt?: Date
}

interface ICertificate {
  name: string
  reg: string
  track: Track
  issuedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

// ====== Schemas ======
// Map Attendee to your existing collection named EXACTLY "Certificate"
const attendeeSchema = new Schema<IAttendee>(
  {
    name: { type: String, required: true, trim: true },
    reg: { type: String, required: true, trim: true, uppercase: true, index: true },
    track: { type: String, required: true, enum: ["Frontend", "Backend"] },
    attended: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "Certificate" }
)
// optional unique index per (reg, track)
attendeeSchema.index({ reg: 1, track: 1 }, { unique: false })

// Log issued certs in a clean separate collection
const certificateLogSchema = new Schema<ICertificate>(
  {
    name: { type: String, required: true },
    reg: { type: String, required: true },
    track: { type: String, required: true, enum: ["Frontend", "Backend"] },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "certificates" }
)

const Attendee: Model<IAttendee> =
  (models.Attendee as Model<IAttendee>) || model<IAttendee>("Attendee", attendeeSchema)

const Certificate: Model<ICertificate> =
  (models.Certificate as Model<ICertificate>) ||
  model<ICertificate>("Certificate", certificateLogSchema)

// ====== Route ======
export async function POST(req: NextRequest) {
  console.log("[CERT API] POST request received")

  try {
    const body = await req.json()
    console.log("[CERT API] Request body:", body)

    const { reg, track }: { name?: string; reg: string; track: Track } = body

    if (!reg?.trim() || !track) {
      console.log("[CERT API] Invalid payload - reg or track missing")
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    // Normalize inputs to match schema & stored docs
    const normReg = reg.trim().toUpperCase()
    const normTrack: Track = track === "Backend" ? "Backend" : "Frontend"

    console.log("[CERT API] Connecting to database...")
    await connectDB()
    console.log("[CERT API] Database connected successfully")
    console.log("[CERT API] Connected DB:", mongoose.connection.name)

    // ✅ Fix: safely narrow `mongoose.connection.db` before using it
    const db = mongoose.connection.db
    if (db) {
      const cols = await db.listCollections().toArray()
      console.log("[CERT API] Collections:", cols.map((c) => c.name))
    } else {
      console.warn("[CERT API] Warning: mongoose.connection.db is undefined (not ready yet?)")
    }

    console.log("[CERT API] Looking up attendee with:", { reg: normReg, track: normTrack })

    // Typed lean result so TS knows .attended and .name exist
    const attendee = await Attendee.findOne({ reg: normReg, track: normTrack })
      .lean<IAttendee>()
      .exec()

    console.log("[CERT API] Attendee lookup result:", attendee ? attendee : "Not found")

    if (!attendee || attendee.attended === false) {
      console.log("[CERT API] Not eligible (not found or attended=false)")
      return NextResponse.json(
        { error: "You did not attend the class, sorry." },
        { status: 404 }
      )
    }

    const nameFromDB = attendee.name?.trim()
    console.log("[CERT API] Name from database:", nameFromDB)

    if (!nameFromDB) {
      console.log("[CERT API] No name found for this registration number")
      return NextResponse.json(
        { error: "No name on record for this registration number." },
        { status: 404 }
      )
    }

    console.log("[CERT API] Creating certificate record in database...")
    const certRecord = await Certificate.create({
      name: nameFromDB,
      reg: normReg,
      track: normTrack,
    })
    console.log("[CERT API] Certificate record created:", certRecord._id)

    console.log(`[CERT API] Loading PDF template for ${normTrack}...`)
    const templateFile = normTrack === "Frontend" ? "Front-end.pdf" : "Back-end.pdf"
    const filePath = path.join(process.cwd(), "public", templateFile)
    console.log("[CERT API] Template file path:", filePath)

    const templateBytes = await fs.readFile(filePath)
    console.log("[CERT API] Template loaded, size:", templateBytes.length, "bytes")

    console.log("[CERT API] Modifying PDF document...")
    const pdfDoc = await PDFDocument.load(templateBytes)
    const [page] = pdfDoc.getPages()
    const { width, height } = page.getSize()
    console.log(`[CERT API] PDF page size: ${width}x${height}`)

    console.log("[CERT API] Embedding fonts...")
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const centerX = (text: string, size: number, f = font) =>
      (width - f.widthOfTextAtSize(text, size)) / 2
    const yFromTop = (t: number) => height - t

    const nameLine = nameFromDB
    const regLine = `Registration No: ${normReg}`
    const footer = `Issued on ${new Date().toLocaleDateString()}`

    console.log("[CERT API] Drawing text on PDF...")
    page.drawText(nameLine, {
      x: 200,
      y: yFromTop(280),
      size: 32,
      font: fontBold,
    })

    page.drawText(regLine, {
      x: 450,
      y: yFromTop(280),
      size: 14,
      font,
    })

    console.log("[CERT API] Saving PDF document...")
    const pdfBytes = await pdfDoc.save()
    console.log("[CERT API] PDF saved, size:", pdfBytes.length, "bytes")

    const safeName = nameLine.replace(/\s+/g, "_")
    const filenameDownload = `Certificate-${normTrack}-${safeName}.pdf`
    console.log("[CERT API] Sending response with filename:", filenameDownload)

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filenameDownload}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[CERT API] Error occurred:", err)
    console.error("[CERT API] Error stack:", err instanceof Error ? err.stack : "No stack trace")
    return NextResponse.json({ error: "Failed to generate certificate" }, { status: 500 })
  } finally {
    console.log("[CERT API] Request processing complete")
    // keep pooled connection open
  }
}
