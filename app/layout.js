import TopRightStatus from "@/components/TopRightStatus";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <TopRightStatus />
        {children}
      </body>
    </html>
  );
}
