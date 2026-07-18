import type { IMessage } from "../models/IMessage";

export const mergeMessages = (existing: IMessage[], incoming: IMessage[]): IMessage[] => {
    const map = new Map<string, IMessage>();
    for (const m of existing) {
        map.set(m._id, m);
    }
    for (const m of incoming) {
        map.set(m._id, m);
    }
    return [...map.values()].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}