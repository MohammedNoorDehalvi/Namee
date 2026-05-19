export type PlayerRole = 'Batter' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';
export type BattingStyle = 'Right Hand' | 'Left Hand';
export type BowlingStyle = 'Fast' | 'Medium' | 'Spin' | 'None';
export type PlayerStatus = 'Available' | 'Sold' | 'Unsold';
export type PlayerAuctionStatus = 'PENDING' | 'CURRENT' | 'SOLD' | 'UNSOLD';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type AuctionStatus = 'NOT_STARTED' | 'LIVE' | 'PAUSED' | 'ENDED';
export type AuctionEventType =
  | 'BID'
  | 'SOLD'
  | 'UNSOLD'
  | 'NEW_PLAYER'
  | 'TEAM_FULL'
  | 'ADMIN_ASSIGNED'
  | 'STATUS'
  | 'RESET'
  | 'UNDO';

export type Player = {
  id: string;
  name: string;
  phone: string;
  normalized_phone?: string | null;
  role: PlayerRole;
  batting_style: BattingStyle;
  bowling_style: BowlingStyle;
  base_price: number | null;
  photo_url: string | null;
  status: PlayerStatus;
  auction_status?: PlayerAuctionStatus | null;
  approval_status: ApprovalStatus;
  current_bid: number | null;
  sold_to_team: string | null;
  sold_to_team_id?: string | null;
  sold_to_captain_id: string | null;
  sold_price: number | null;
  assigned_by_admin?: boolean | null;
  created_at: string;
  updated_at?: string | null;
};

export type Captain = {
  id: string;
  captain_name: string;
  team_name: string;
  team_id?: string | null;
  photo_url?: string | null;
  budget: number;
  remaining_budget: number;
  created_at: string;
};

export type Team = {
  id: string;
  team_name: string;
  captain_id: string;
  captain_name: string;
  logo_url?: string | null;
  captain_photo_url?: string | null;
  budget: number;
  remaining_budget: number;
  max_players: number;
  created_at: string;
  updated_at?: string | null;
};

export type Bid = {
  id: string;
  player_id: string;
  captain_id: string;
  captain_name?: string | null;
  team_id?: string | null;
  team_name: string;
  bid_amount: number;
  created_at: string;
};

export type Auction = {
  id: number;
  current_player_id: string | null;
  auction_status: AuctionStatus;
  highest_bid: number;
  highest_bidder_id: string | null;
  highest_bidder_team_id?: string | null;
  highest_bidder_captain_name?: string | null;
  highest_team_name: string | null;
  manual_picker_hidden?: boolean | null;
  created_at: string;
  updated_at: string;
  started_at?: string | null;
  ended_at?: string | null;
};

export type AuctionEvent = {
  id: string;
  event_type: AuctionEventType;
  message: string;
  player_id: string | null;
  team_id: string | null;
  captain_id: string | null;
  amount: number | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

export type AuctionSummary = {
  totalApprovedPlayers: number;
  totalSoldPlayers: number;
  totalUnsoldPlayers: number;
  mostExpensivePlayer: Player | null;
  cheapestSoldPlayer: Player | null;
  teamsFull: Team[];
  teamsLessThanFour: Team[];
};

export type AppSession = {
  role: 'captain' | 'admin';
  id: string;
  name: string;
  team_name?: string;
  team_id?: string;
  token: string;
  expires_at: number;
};
