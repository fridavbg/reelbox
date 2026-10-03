import { Layout } from "@/components/Layout/Layout";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <Layout>
      <div className={styles.intro}>
        <h1 className={styles.title}>Work in progress</h1>
        <p className={styles.text}>
          Reelbox will help you tag, filter and find the reels you save. Coming
          soon.
        </p>
      </div>
    </Layout>
  );
}
