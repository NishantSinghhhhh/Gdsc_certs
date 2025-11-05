"use client"

import React, { useState } from "react"
import { PDFDocument, StandardFonts } from "pdf-lib"
import Header from "@/components/Header"

type Track = "Frontend" | "Backend"

const Cert_Generation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Track>("Frontend")
  const [feName, setFeName] = useState<string>("")
  const [feReg, setFeReg] = useState<string>("")
  const [beName, setBeName] = useState<string>("")
  const [beReg, setBeReg] = useState<string>("")

  const [busy, setBusy] = useState<boolean>(false)

  const downloadBytes = (bytes: Uint8Array, filename: string) => {
    const copy = new Uint8Array(bytes.length)
    copy.set(bytes)
    const blob = new Blob([copy], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const fetchTemplate = async (track: Track): Promise<ArrayBuffer> => {
    const url = track === "Frontend" ? "/Front-end.pdf" : "/Back-end.pdf"
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to load template: ${url}`)
    return res.arrayBuffer()
  }

  const generateCertificate = async ({
  name,
  reg,
  trackLabel,
}: {
  name: string
  reg: string
  trackLabel: "Frontend" | "Backend"
}) => {
  if (!name.trim() || !reg.trim()) {
    alert(`Please enter both Name and Registration Number for ${trackLabel}.`)
    return
  }

  try {
    setBusy(true)

    const res = await fetch("/api/cert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, reg, track: trackLabel }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const msg = data?.error || "Request failed"
      alert(msg) // ✅ show in UI instead of console
      return
    }

    // ✅ Success — get file
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Certificate-${trackLabel}-${name.replace(/\s+/g, "_")}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error(e)
    alert("Something went wrong while generating the certificate.")
  } finally {
    setBusy(false)
  }
}



  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            Certificate Generator
          </h1>
          <p className="text-lg text-gray-600">
            Switch tabs to generate certificates for Frontend or Backend tracks (uses base PDFs from /public).
          </p>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Certificate tracks" className="border-b border-gray-200 mb-8">
          <button
            role="tab"
            aria-selected={activeTab === "Frontend"}
            aria-controls="panel-frontend"
            id="tab-frontend"
            className={`mr-6 pb-3 text-sm font-medium transition-colors ${
              activeTab === "Frontend"
                ? "text-black border-b-2 border-black"
                : "text-gray-500 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("Frontend")}
          >
            Frontend JAMS
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "Backend"}
            aria-controls="panel-backend"
            id="tab-backend"
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === "Backend"
                ? "text-black border-b-2 border-black"
                : "text-gray-500 hover:text-gray-900"
            }`}
            onClick={() => setActiveTab("Backend")}
          >
            Backend JAMS
          </button>
        </div>

        {/* Panels */}
        {activeTab === "Frontend" && (
          <section
            role="tabpanel"
            id="panel-frontend"
            aria-labelledby="tab-frontend"
            className="border border-gray-200 rounded-lg p-8 bg-white"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frontend Certificates</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Student Name</label>
                <input
                  type="text"
                  value={feName}
                  onChange={(e) => setFeName(e.target.value)}
                  placeholder="e.g., Nishant Singh"
                  className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Registration Number</label>
                <input
                  type="text"
                  value={feReg}
                  onChange={(e) => setFeReg(e.target.value)}
                  placeholder="e.g., FE123"
                  className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <button
              onClick={() => generateCertificate({ name: feName, reg: feReg, trackLabel: "Frontend" })}
              disabled={busy}
              className="mt-6 w-full sm:w-auto bg-black text-white font-medium px-6 py-3 rounded-md hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {busy ? "Generating..." : "Generate Frontend Certificate"}
            </button>
          </section>
        )}

        {activeTab === "Backend" && (
          <section
            role="tabpanel"
            id="panel-backend"
            aria-labelledby="tab-backend"
            className="border border-gray-200 rounded-lg p-8 bg-white"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Backend Certificates</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Student Name</label>
                <input
                  type="text"
                  value={beName}
                  onChange={(e) => setBeName(e.target.value)}
                  placeholder="e.g., Jane Doe"
                  className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-700 mb-1">Registration Number</label>
                <input
                  type="text"
                  value={beReg}
                  onChange={(e) => setBeReg(e.target.value)}
                  placeholder="e.g., BE987"
                  className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <button
              onClick={() => generateCertificate({ name: beName, reg: beReg, trackLabel: "Backend" })}
              disabled={busy}
              className="mt-6 w-full sm:w-auto bg-black text-white font-medium px-6 py-3 rounded-md hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {busy ? "Generating..." : "Generate Backend Certificate"}
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

export default Cert_Generation
