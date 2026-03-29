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
  /** Slack username / bot 표시명 등 (history 응답의 username·bot_profile.name) */
  author?: string;
  user?: string;
  userInfo?: UserInfo;
  text?: string;
  permalink?: string;
  reactions?: { name: string; count: number; users?: string[] }[];
  files?: { name?: string; url?: string }[];
  thread?: {
    replies: FetchedMessage[];
  };
  // スレッドメタ情報（conversations.historyから取得可能）
  thread_ts?: string;        // スレッドの親メッセージのタイムスタンプ
  reply_count?: number;      // スレッドの返信数（親メッセージの場合）
  latest_reply?: string;     // 最新の返信のタイムスタンプ（親メッセージの場合）
};

export type ChannelData = {
  messages: FetchedMessage[];
  emailList?: string[];
  channelInfo?: {
    id: string;
    name: string;
    description?: string;
    topic?: string;
    numMembers?: number;
  };
};


