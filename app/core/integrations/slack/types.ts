export type UserInfo = {
  id: string;
  name?: string;
  real_name?: string;
  display_name?: string;
  profile?: {
    display_name?: string;
    real_name?: string;
    email?: string;
    image_72?: string;
  };
};

export type FetchedMessage = {
  ts: string;
  user?: string;
  userInfo?: UserInfo;
  text?: string;
  permalink?: string;
  reactions?: { name: string; count: number; users?: string[] }[];
  files?: { name?: string; url?: string }[];
  thread?: {
    replies: FetchedMessage[];
  };
};


