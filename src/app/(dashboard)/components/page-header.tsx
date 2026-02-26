
import { appConfig } from "@/app/utils/config";
import Head from "next/head";
import Link from "next/link";
import { ReactNode } from "react";
import { HiOutlineArrowNarrowLeft } from "react-icons/hi";

const pageHeaderStyles = `
  /* Mobile responsiveness: Hide header behind menu icon fix */
  @media (max-width: 767.98px) {
    .page-header-mobile {
      margin-top: 90px !important;      /* Clear hamburger button (48px height + 20px top + buffer) */
      padding-left: 20px;                 /* Avoid overlap with menu icon area */
      padding-right: 20px;
      position: relative;
      z-index: 10;                        /* Below menu icon (z-index: 999) but above content */
    }
  }
  
  /* Ensure desktop displays normally */
  @media (min-width: 768px) {
    .page-header-mobile {
      margin-top: 0;
      padding-left: 0;
      position: static;
      z-index: auto;
    }
  }
`;



type PageHeaderProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  responsive?: boolean;
  type?: "parent" | "child";
  parentUrl?: string;
};
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  responsive,
  children,
  type = "parent",
  parentUrl,
}) => {
  return (
    <>
      <Head>
        <title>{`${appConfig.companyName} - ${title}`}</title>
      </Head>
      <style>{pageHeaderStyles}</style>
      <section
        className={`page-header-mobile d-flex justify-content-between align-items-lg-center my-3 ${
          responsive ? "flex-column flex-lg-row" : "flex-row"
        }`}
      >
        <div>
          {type == "parent" ? (
            <h4 className="my-0 fs-4 fw-bold">{title}</h4>
          ) : (
            <div className="d-flex align-items-center gap-2">
              {parentUrl && (
                <Link href={parentUrl}>
                  <HiOutlineArrowNarrowLeft />
                </Link>
              )}
              <h5 className="my-0 fs-6">{title}</h5>
            </div>
          )}
          {description && (
            <p className="my-0 tw-text-sm tw-text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        <div>{children}</div>
      </section>
    </>
  );
};
export default PageHeader;
