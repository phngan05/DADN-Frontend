export interface User {
  user_id: string;
  full_name: string;
  username: string;
  photo_url: string | null;

}

export interface UserUpdate {
  full_name?: string;
  username?: string;
  photo_url?: string | null;
}

export interface UserCreate {
  full_name: string,
  username: string,
  password: string,
  adafruit_username: string,
  adafruit_api_key: string,
}