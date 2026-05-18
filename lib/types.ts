export type PlayerRole = 'Batter' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';
export type BattingStyle = 'Right Hand' | 'Left Hand';
export type BowlingStyle = 'Fast' | 'Medium' | 'Spin' | 'None';
export type PlayerStatus = 'Available' | 'Sold' | 'Unsold';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type AuctionStatus = 'Not Started' | 'Live' | 'Sold' | 'Unsold';

export type Player = {
  id: string;
  name: string;
  phone: string;
  role: PlayerRole;
  batting_style: BattingStyle;
  bowling_style: BowlingStyle;
  base_price: number | null;
  photo_url: string | null;
  status: PlayerStatus;
  approval_status: ApprovalStatus;
  current_bid: number | null;
  sold_to_team: string | null;
  sold_to_captain_id: string | null;
  sold_price: number | null;
  created_at: string;
};

export type Captain = {
  id: string;
  captain_name: string;
  team_name: string;
  budget: number;
  remaining_budget: number;
  created_at: string;
};

export type Team = {
  id: string;
  team_name: string;
  captain_id: string;
  captain_name: string;
  budget: number;
  remaining_budget: number;
  created_at: string;
};

export type Bid = {
  id: string;
  player_id: string;
  captain_id: string;
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
  highest_team_name: string | null;
  created_at: string;
  updated_at: string;
};

export type AppSession = {
  role: 'captain' | 'admin';
  id: string;
  name: string;
  team_name?: string;
  token: string;
  expires_at: number;
};
