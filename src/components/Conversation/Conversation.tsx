import Message from '../Message';
import styles from "./Conversation.module.css";

const Conversation = () => {

  return (
    <section className={styles.container}>
      {[1, 2, 3, 4, 5, 6, 7, 1, 2, 3, 4, 5, 6, 7, 1, 2, 3, 4, 5, 6, 7, 1, 2, 3, 4, 5, 6, 7, 1, 2, 3, 4, 5, 6, 7].map(e => (<Message isYou={e % 2 === 0} />))}

    </section>
  )
}


export default Conversation;
