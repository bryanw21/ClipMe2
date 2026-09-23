import "./globals.css";
import { Providers } from "./providers";
import Navbar from "../components/Navbar";
import config from "@/lib/config";

export const metadata = {
  title: "ClipMee — Turn your videos into clips that travel",
  description: "Create, caption, export, and publish short-form clips from your authorized videos.",
};

export default function RootLayout({ children }) {
  const theme = config?.theme || "slate-indigo";

  return (
    <html lang="en" className="h-full w-full" data-theme={theme}>
      <body className="h-full w-full flex flex-col antialiased bg-bg-page text-primary-text font-sans lg:overflow-hidden overflow-y-auto">
        <Providers>
          <Navbar />
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
