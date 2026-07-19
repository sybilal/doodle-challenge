import styles from './ErrorBar.module.css'

interface PropTypes {
  message: string;
  retryFn?: () => void
}

const ErrorBar = ({ message, retryFn }: PropTypes) => {
  return (
    <div className={styles.container} role="alert">
      <span>{message}</span>
      {retryFn && (
        <button type="button" onClick={retryFn} aria-label={`Retry: ${message}`}>
          Retry
        </button>
      )}
    </div>
  )
}

export default ErrorBar;
