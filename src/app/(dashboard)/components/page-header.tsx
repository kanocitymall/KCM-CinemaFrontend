
import { appConfig } from "@/app/utils/config";
import Head from "next/head";
import Link from "next/link";
import { ReactNode } from "react";
import { HiOutlineArrowNarrowLeft } from "react-icons/hi";


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
      <section
        className={`d-flex justify-content-between align-items-lg-center my-3 ${
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
