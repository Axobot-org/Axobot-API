export interface DockerPushEvent {
    callback_url: string;
    push_data: {
        pushed_at: number;
        pusher: string;
        tag: string;
    };
    repository: {
        comment_count: number;
        date_created: number;
        description: string;
        dockerfile: string;
        full_description: string | null;
        is_official: boolean;
        is_private: boolean;
        is_trusted: boolean;
        name: string;
        namespace: string;
        owner: string;
        repo_name: string;
        repo_url: string;
        star_count: number;
        status: string;
    };
}

export interface MinimalDockerPushEvent extends Partial<DockerPushEvent> {
    callback_url: string;
    push_data: Pick<DockerPushEvent["push_data"], "pusher" | "tag"> & Partial<DockerPushEvent["push_data"]>;
    repository: Pick<DockerPushEvent["repository"], "repo_name" | "repo_url"> & Partial<DockerPushEvent["repository"]>;
}