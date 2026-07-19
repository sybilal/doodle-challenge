import styles from "./LoadingBar.module.css";

interface PropTypes {
  message: string;
  actionFn?: () => void;
  isError?: boolean;
}

const LoadingBar = ({ message, actionFn, isError = false }: PropTypes) => {
  return (
    <section
      className={`${styles.container} ${isError ? styles.failed : ''}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      {actionFn ? (
        <button type="button" className={styles.action} onClick={() => actionFn()}>
          {message}
        </button>
      ) : (
        <span>{message}</span>
      )}
    </section>
  )
}

export default LoadingBar;
