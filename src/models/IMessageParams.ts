export interface IGetMessagesParams {
    /** ISO timestamp — only messages created after this are returned (exclusive). */
    after?: string;
    /** ISO timestamp — only messages created before this are returned (exclusive). */
    before?: string;
    /** Maximum number of messages to return. */
    limit?: number;
}
