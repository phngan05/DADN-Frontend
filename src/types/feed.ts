export type FeedCategory =
  | "Temperature"
  | "Humidity"
  | "Illuminance"
  | "LED Intensity"
  | "Fan Speed"
  | "Servo";

export interface Adafruit {
    server_id: string;
    username: string;
}

export interface Feed {
    feed_id: string;
    feed_key: string;
    category: FeedCategory;
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


