export type PlayerRole = 'Batter' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';
export type BattingStyle = 'Right Hand' | 'Left Hand';
export type BowlingStyle = 'Fast' | 'Medium' | 'Spin' | 'None';
export type PlayerStatus = 'Available' | 'Sold' | 'Unsold';
export type PlayerAuctionStatus = 'PENDING' | 'CURRENT' | 'SOLD' | 'UNSOLD';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type AuctionStatus = 'NOT_STARTED' | 'LIVE' | 'PAUSED' | 'ENDED';
export type SeasonStatus = 'active' | 'ended';

export type AuctionEventType =
  | 'BID'
  | 'SOLD'
  | 'UNSOLD'
  | 'NEW_PLAYER'
  | 'TEAM_FULL'
  | 'ADMIN_ASSIGNED'
  | 'STATUS'
  | 'RESET'
  | 'UNDO'
  | 'SEASON';

export type Season = {
  id: string;
  season_number: number;
  name: string;
  status: SeasonStatus;
  started_at: string;
  ended_at?: string | null;
  created_at: string;
};

export type Player = {
  id: string;
  season_id?: string | null;
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
  season_id?: string | null;
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
  season_id?: string | null;
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
  season_id?: string | null;
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
  season_id?: string | null;
  current_player_id: string | null;
  auction_status: AuctionStatus;
  highest_bid: number;
  highest_bidder_id: string | null;
  highest_bidder_team_id?: string | null;
  highest_bidder_captain_name?: string | null;
  highest_team_name: string | null;
  manual_picker_hidden?: boolean | null;
  bid_processing?: boolean | null;
  bid_lock_started_at?: string | null;
  bid_lock_player_id?: string | null;
  created_at: string;
  updated_at: string;
  started_at?: string | null;
  ended_at?: string | null;
};

export type AuctionEvent = {
  id: string;
  season_id?: string | null;
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

export type PointRow = {
  id: string;
  season_id: string;
  team_id: string;
  matches_played: number;
  wins: number;
  losses: number;
  no_result: number;
  points: number;
  net_run_rate: number;
  runs_scored: number;
  overs_faced: number;
  runs_conceded: number;
  overs_bowled: number;
  created_at: string;
};

export type MatchRow = {
  id: string;
  season_id: string;
  team_a_id: string | null;
  team_b_id: string | null;
  venue: string | null;
  match_date: string | null;
  status: 'upcoming' | 'live' | 'completed' | string;
  winner_team_id?: string | null;
  toss_winner_id?: string | null;
  created_by_ai?: boolean | null;
  created_at: string;
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
