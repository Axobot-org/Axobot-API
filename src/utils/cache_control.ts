import { Response } from "express";

export default function setCacheControl(res: Response, maxAge: number, staleWhileRevalidate = 86400) {
    res.setHeader("Cache-Control", `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
}
