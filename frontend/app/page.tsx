import Image from "next/image";
import Cert_Generation from "@/components/CertGenerator";

export default function Home() {
  return (
    <div className="w-full h-screen bg-zinc-50 font-sans dark:bg-black">
      <Cert_Generation />
    </div>
  );
}
