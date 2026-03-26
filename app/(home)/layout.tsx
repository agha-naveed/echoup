import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import MainWrapper from "@/components/wrapper/MainWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Echoup",
  description: "Echo Up",
};

export default function RootLayout(props: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MainWrapper>
          <div className="xl:w-[600px] lg:w-full sm:w-[600px] w-full usm:px-10 nsm:px-5 flex justify-center">
            {props.children}
            {props.modal}
          </div>
        </MainWrapper>
      </body>
    </html>
  );
}
