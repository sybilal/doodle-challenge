import { useEffect } from 'react';
import styles from './Chat.module.css'
import Conversation from '../../components/Conversation';
import Footer from '../../components/Footer';


const Chat = () => {

  useEffect(() => {
    console.log(`Chat mounted`)
  }, [])

  return (
    <main className={styles.container} aria-label="Chat">
      <h1 className="sr-only">Chat</h1>
      <Conversation />
      <Footer />
    </main>
  )
}

export default Chat;
