import Conversation from '../../components/Conversation';
import Footer from '../../components/Footer';
import styles from './Chat.module.css';


const Chat = () => {

  return (
    <main className={styles.container} aria-label="Chat">
      <h1 className="sr-only">Chat</h1>
      <Conversation />
      <Footer />
    </main>
  )
}

export default Chat;
