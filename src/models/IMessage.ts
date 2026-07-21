export interface IMessage {
    _id: string;
    message: string;
    author: string;
    createdAt: string;
    isAppendedLocally?: boolean;
}

export interface IMessageBody {
    message: string;
    author: string;
}