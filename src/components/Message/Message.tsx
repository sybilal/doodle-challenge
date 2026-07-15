import styles from "./Message.module.css"

interface IMessage {
  isYou: boolean;
}

const Message = ({ isYou = false }: IMessage) => {
  return (
    <div className={`${styles.container} ${isYou ? styles.is_you : ''}`}>
      <div className={styles.message_box}>
        {isYou ? "Me" : "others"}
      </div>
    </div>
  )
}

export default Message;
