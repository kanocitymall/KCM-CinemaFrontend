
"use client";

import { slugify } from "../../../../utils/index";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { IconType } from "react-icons";
import { MdDashboard } from "react-icons/md";
import { MdKeyboardArrowDown } from "react-icons/md";
import { MdKeyboardArrowUp } from "react-icons/md";

type DropdownType = {
  label: string;
  listPages: string[];
  Icon: IconType;
};

const Dropdown: React.FC<DropdownType> = ({
  label,
  listPages,
  Icon = MdDashboard,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [showSubmenu, setShowSubmenu] = useState(false);
  
  // Special mapping for slugs that don't match folder names
  const slugMapping: Record<string, string> = {
    "Services": "service-type"
  };
  
  const slug = slugMapping[label] || slugify(label);
  const isActive = pathname.startsWith(`/${slug}`);

  const handleMainClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSubmenu((s) => !s);
  };

  const handleSubClick = (page: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/${slug}/${slugify(page)}`);
  };

  return (
    <div className="cursor-pointer">
      <div
        className={`d-flex align-items-center px-1 px-lg-3 py-2 gap-1 nav-link hover:tw-bg-gray-600 transition-colors duration-200 ${
          isActive ? "bg-warning fw-semibold " : "tw-text-gray-500"
        }`}
        onClick={handleMainClick}
        style={{ cursor: 'pointer' }}
      >
        <Icon />
        <span className="flex-grow-1">{label}</span>
        {listPages.length > 0 && (
          <>{showSubmenu ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}</>
        )}
      </div>
      {listPages.length > 0 && showSubmenu && (
        <div className="ms-3 mt-2 me-2 tw-text-sm tw-bg-gray-700">
          {listPages.map((page, i) => (
            <div
              className={`d-block tw-text-inherit tw-no-underline p-2 text-wrap hover:tw-bg-gray-600 transition-colors duration-200 ${
                pathname === `/${slug}/${slugify(page)}` ? "tw-bg-gray-600" : ""
              }`}
              key={i}
              onClick={handleSubClick(page)}
              style={{ cursor: 'pointer', textDecoration: 'none' }}
            >
              {page}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
