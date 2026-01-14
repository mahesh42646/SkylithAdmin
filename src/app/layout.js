import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "Admin Dashboard",
  description: "Role-based admin dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={poppins.variable} style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
