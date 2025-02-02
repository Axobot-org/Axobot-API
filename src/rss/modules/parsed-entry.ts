export interface ParsedEntry {
    url: string;
    title: string;
    pubDate: string;
    entryId: string | null;
    author: string | null;
    channel: string | null;
    image: string | null;
    postText: string | null;
    postDescription: string | null;
}
