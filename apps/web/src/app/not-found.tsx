import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-mesh px-4">
      <div className="card p-12 text-center max-w-md">
        <div className="text-6xl mb-6">404</div>
        <h1 className="text-2xl font-bold text-primaryText mb-3">
          Page Not Found
        </h1>
        <p className="text-secondaryText text-sm mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
          <Link href="/explore" className="btn-secondary">
            Browse Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
