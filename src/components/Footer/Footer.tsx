import { useEffect } from 'react';
import styles from "./Footer.module.css";
const Footer = () => {

  useEffect(() => {
    console.log(`Footer mounted`)
  }, [])

  return (
    <section className={styles.container}>
      <input />
      <button>Send</button>
    </section>
  )
}
export default Footer;
