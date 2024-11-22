import Link from "next/link";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="flex justify-between items-center mb-8">
      <Link href="/" className="text-2xl font-bold hover:text-gray-700">
        byte-map
      </Link>
      <nav className="flex gap-4">
        <Link
          href="/"
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            pathname === "/"
              ? "bg-blue-500 text-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Convert
        </Link>
        <Link
          href="/map"
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            pathname === "/map"
              ? "bg-blue-500 text-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Map
        </Link>
      </nav>
    </header>
  );
}
