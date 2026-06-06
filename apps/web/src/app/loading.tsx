export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-3 border-graphPurple/30 border-t-graphPurple rounded-full animate-spin" style={{ borderWidth: "3px" }} />
        <p className="text-secondaryText text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
