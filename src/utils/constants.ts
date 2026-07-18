export const CURRENT_USER = 'Syed Bilal';

/**
 * Upper bound on how many new messages to pull in one delta fetch. Since we
 * only ever fetch messages created after the latest one we already have, this
 * just needs to comfortably cover any that arrived since the last fetch.
 */
export const MESSAGES_LIMIT = 10;
export const QUERY_KEY = ['messages'];