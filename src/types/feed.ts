export interface Adafruit {
    server_id: string;
    username: string;
}

export interface Feed {
    feed_id: string;
    feed_key: string;
    category: string;
}

export interface FeedResponse {
    feed_id: string;
    feed_key: string;
    category: string;
    ADAFRUIT_SERVER:{
        server_id: string;
        username: string;
    }
}