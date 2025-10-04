export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="mx-auto max-w-md p-4">{children}</main>;
}
