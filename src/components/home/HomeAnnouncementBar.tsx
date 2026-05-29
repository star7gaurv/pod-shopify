import { siteConfig } from "@/lib/site-config";

export function HomeAnnouncementBar() {
  return (
    <div className="border-b border-white/8 bg-[#08111c]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-2 text-center text-xs text-white/78 sm:px-6 md:flex-row md:items-center md:justify-between md:text-left lg:px-8">
        <p className="font-medium">{siteConfig.announcementText}</p>
        <div className="hidden items-center gap-5 text-white/62 md:flex">
          <span>{siteConfig.phone}</span>
        </div>
      </div>
    </div>
  );
}
