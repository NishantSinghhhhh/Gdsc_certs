"use client"

import React from "react"
import Image from "next/image"
import logoGdsc from "../public/Group 44.png"
import logoAit from "../public/AIT.png"
const Header: React.FC = () => {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl h-20 px-6 sm:px-10 flex items-center justify-between">
        {/* OSS Club Logo */}
        <a
          href="https://aitoss.club/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center"
        >
          <Image
            src={logoAit || "/placeholder.svg"}
            alt="OSS Club"
            width={80}
            height={80}
            priority
            className="h-12 w-auto sm:h-14 transition-transform duration-200 hover:scale-105"
          />
        </a>

        {/* GDSC Logo */}
        <Image
          src={logoGdsc || "/placeholder.svg"}
          alt="GDSC AIT Logo"
          width={200}
          height={200}
          priority
          className="h-12 w-auto sm:h-14 transition-transform duration-200 hover:scale-105"
        />
      </div>
    </header>
  )
}

export default Header
