import Link from "next/link";

export function Header() {
  return (
    <div className="flex justify-between items-center mb-8">
      <Link href="/" className="text-2xl font-bold hover:text-gray-700">
        byte-map
      </Link>
      <nav className="flex gap-4">
        <Link
          href="/"
          className="text-blue-500 hover:text-blue-700 font-medium"
        >
          Convert
        </Link>
        <Link
          href="/map"
          className="text-blue-500 hover:text-blue-700 font-medium"
        >
          Map
        </Link>
      </nav>
    </div>
  );
}
