import { Bricolage_Grotesque, Figtree } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Footer from "@/components/Footer";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata = {
  title: "UDDESHO | Study Navigator",
  description: "Explore countries, research universities, and plan your future. A gift from Faijul Haque.",
};

export const viewport = {
  themeColor: "#086AFA",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        {/* soft colour washes taken from the logo */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-mint-200/40 blur-3xl" />
          <div className="absolute -bottom-24 left-1/4 h-80 w-80 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="absolute bottom-10 -right-20 h-72 w-72 rounded-full bg-red-200/25 blur-3xl" />
        </div>
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
