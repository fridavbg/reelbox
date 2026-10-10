import type { Metadata } from "next";
import { Layout } from "@/components/Layout/Layout";
import { TermsOfUse } from "./terms-of-use";

export const metadata: Metadata = { title: "Terms of use · Reelbox" };

export default function TermsPage() {
  return (
    <Layout>
      <TermsOfUse />
    </Layout>
  );
}
