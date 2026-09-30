import { HeaderSearch } from "./header-search";
import { ProfileMenu } from "./profile-menu";

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-[52px] shrink-0 items-center gap-4 border-b border-line-soft bg-surface px-7">
      <div className="flex-1" />
      <HeaderSearch />
      <div className="flex flex-1 justify-end">
        <ProfileMenu />
      </div>
    </header>
  );
}
