export interface IMessage {
    _id: string;
    message: string;
    author: string;
    createdAt: string;
}

export interface IMessageBody {
    message: string;
    author: string;
}