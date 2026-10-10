import type { Metadata } from "next";
import { Layout } from "@/components/Layout/Layout";
import { PrivacyPolicy } from "./privacy-policy";

export const metadata: Metadata = { title: "Privacy policy · Reelbox" };

export default function PrivacyPage() {
  return (
    <Layout>
      <PrivacyPolicy />
    </Layout>
  );
}
