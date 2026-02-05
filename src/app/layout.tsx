import "./globals.css";

export const metadata = {
  title: "Snake",
  description: "Classic Snake game"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
