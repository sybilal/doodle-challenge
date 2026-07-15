import { useEffect } from 'react';
import styles from './Chat.module.css'
import Conversation from '../../components/Conversation';
import Footer from '../../components/Footer';


const Chat = () => {

  useEffect(() => {
    console.log(`Chat mounted`)
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Conversation />
      </div>
      <Footer />
    </div>
  )
}

export default Chat;
