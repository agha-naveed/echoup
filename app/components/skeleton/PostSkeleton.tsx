export default function PostSkeleton({ variant = "text-image" }) {
  return (
    <div className="bg-primary rounded-2xl border border-main-border shadow-lg md:w-[600px] w-full">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-[45px] h-[45px] rounded-full skeleton" />

          <div className="flex flex-col gap-2">
            <div className="h-[16px] w-[120px] rounded-md skeleton" />
            <div className="h-[12px] w-[70px] rounded-md skeleton" />
          </div>
        </div>

        <div className="w-[30px] h-[30px] rounded-full skeleton" />
      </div>

      {/* TEXT VARIANT */}
      {(variant === "text" || variant === "text-image") && (
        <div className="px-5 pb-3 flex flex-col gap-2">
          <div className="h-[14px] w-full rounded-md skeleton" />
          <div className="h-[14px] w-[85%] rounded-md skeleton" />
          <div className="h-[14px] w-[60%] rounded-md skeleton" />
        </div>
      )}

      {/* IMAGE VARIANT */}
      {(variant === "image" || variant === "text-image") && (
        <div className="aspect-[4/2] w-full skeleton" />
      )}

      {/* Actions */}
      <div className="px-5 py-4 flex items-center gap-4">
        <div className="h-[32px] w-[85px] rounded-full skeleton" />
        <div className="h-[32px] w-[85px] rounded-full skeleton" />
        <div className="h-[32px] w-[85px] rounded-full skeleton" />
      </div>
    </div>
  );
}
