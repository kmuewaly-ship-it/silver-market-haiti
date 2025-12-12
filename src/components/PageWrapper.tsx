import { ReactNode } from "react";
import { useSEO, SEOMetadata } from "@/hooks/useSEO";

interface PageWrapperProps {
  children: ReactNode;
  seo: SEOMetadata;
}

export const PageWrapper = ({ children, seo }: PageWrapperProps) => {
  useSEO(seo);
  return <>{children}</>;
};
