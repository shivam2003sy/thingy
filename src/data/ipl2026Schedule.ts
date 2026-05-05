export interface IplMatch {
  id: string;
  matchNo: number;
  home: string;
  away: string;
  homeShort: string;
  awayShort: string;
  venue: string;
  dateTimeIST: string; // ISO with +05:30
}

const S: Record<string, string> = {
  'Royal Challengers Bengaluru': 'RCB', 'Sunrisers Hyderabad': 'SRH',
  'Mumbai Indians': 'MI',              'Kolkata Knight Riders': 'KKR',
  'Rajasthan Royals': 'RR',            'Chennai Super Kings': 'CSK',
  'Punjab Kings': 'PBKS',              'Gujarat Titans': 'GT',
  'Lucknow Super Giants': 'LSG',       'Delhi Capitals': 'DC',
};

function m(no: number, date: string, time: string, home: string, away: string, venue: string): IplMatch {
  return {
    id: `ipl2026_${no}`,
    matchNo: no,
    home, away,
    homeShort: S[home]!, awayShort: S[away]!,
    venue,
    dateTimeIST: `${date}T${time}:00+05:30`,
  };
}

export const IPL2026: IplMatch[] = [
  m(1,  '2026-03-28', '19:30', 'Royal Challengers Bengaluru', 'Sunrisers Hyderabad',         'Bengaluru'),
  m(2,  '2026-03-29', '19:30', 'Mumbai Indians',              'Kolkata Knight Riders',        'Mumbai'),
  m(3,  '2026-03-30', '19:30', 'Rajasthan Royals',            'Chennai Super Kings',          'Guwahati'),
  m(4,  '2026-03-31', '19:30', 'Punjab Kings',                'Gujarat Titans',               'New Chandigarh'),
  m(5,  '2026-04-01', '19:30', 'Lucknow Super Giants',        'Delhi Capitals',               'Lucknow'),
  m(6,  '2026-04-02', '19:30', 'Kolkata Knight Riders',       'Sunrisers Hyderabad',          'Kolkata'),
  m(7,  '2026-04-03', '19:30', 'Chennai Super Kings',         'Punjab Kings',                 'Chennai'),
  m(8,  '2026-04-04', '15:30', 'Delhi Capitals',              'Mumbai Indians',               'Delhi'),
  m(9,  '2026-04-04', '19:30', 'Gujarat Titans',              'Rajasthan Royals',             'Ahmedabad'),
  m(10, '2026-04-05', '15:30', 'Sunrisers Hyderabad',         'Lucknow Super Giants',         'Hyderabad'),
  m(11, '2026-04-05', '19:30', 'Royal Challengers Bengaluru', 'Chennai Super Kings',          'Bengaluru'),
  m(12, '2026-04-06', '19:30', 'Kolkata Knight Riders',       'Punjab Kings',                 'Kolkata'),
  m(13, '2026-04-07', '19:30', 'Rajasthan Royals',            'Mumbai Indians',               'Guwahati'),
  m(14, '2026-04-08', '19:30', 'Delhi Capitals',              'Gujarat Titans',               'Delhi'),
  m(15, '2026-04-09', '19:30', 'Kolkata Knight Riders',       'Lucknow Super Giants',         'Kolkata'),
  m(16, '2026-04-10', '19:30', 'Rajasthan Royals',            'Royal Challengers Bengaluru',  'Guwahati'),
  m(17, '2026-04-11', '15:30', 'Punjab Kings',                'Sunrisers Hyderabad',          'New Chandigarh'),
  m(18, '2026-04-11', '19:30', 'Chennai Super Kings',         'Delhi Capitals',               'Chennai'),
  m(19, '2026-04-12', '15:30', 'Lucknow Super Giants',        'Gujarat Titans',               'Lucknow'),
  m(20, '2026-04-12', '19:30', 'Mumbai Indians',              'Royal Challengers Bengaluru',  'Mumbai'),
  m(21, '2026-04-13', '19:30', 'Sunrisers Hyderabad',         'Rajasthan Royals',             'Hyderabad'),
  m(22, '2026-04-14', '19:30', 'Chennai Super Kings',         'Kolkata Knight Riders',        'Chennai'),
  m(23, '2026-04-15', '19:30', 'Royal Challengers Bengaluru', 'Lucknow Super Giants',         'Bengaluru'),
  m(24, '2026-04-16', '19:30', 'Mumbai Indians',              'Punjab Kings',                 'Mumbai'),
  m(25, '2026-04-17', '19:30', 'Gujarat Titans',              'Kolkata Knight Riders',        'Ahmedabad'),
  m(26, '2026-04-18', '15:30', 'Royal Challengers Bengaluru', 'Delhi Capitals',               'Bengaluru'),
  m(27, '2026-04-18', '19:30', 'Sunrisers Hyderabad',         'Chennai Super Kings',          'Hyderabad'),
  m(28, '2026-04-19', '15:30', 'Kolkata Knight Riders',       'Rajasthan Royals',             'Kolkata'),
  m(29, '2026-04-19', '19:30', 'Punjab Kings',                'Lucknow Super Giants',         'New Chandigarh'),
  m(30, '2026-04-20', '19:30', 'Gujarat Titans',              'Mumbai Indians',               'Ahmedabad'),
  m(31, '2026-04-21', '19:30', 'Sunrisers Hyderabad',         'Delhi Capitals',               'Hyderabad'),
  m(32, '2026-04-22', '19:30', 'Lucknow Super Giants',        'Rajasthan Royals',             'Lucknow'),
  m(33, '2026-04-23', '19:30', 'Mumbai Indians',              'Chennai Super Kings',          'Mumbai'),
  m(34, '2026-04-24', '19:30', 'Royal Challengers Bengaluru', 'Gujarat Titans',               'Bengaluru'),
  m(35, '2026-04-25', '15:30', 'Delhi Capitals',              'Punjab Kings',                 'Delhi'),
  m(36, '2026-04-25', '19:30', 'Rajasthan Royals',            'Sunrisers Hyderabad',          'Jaipur'),
  m(37, '2026-04-26', '15:30', 'Chennai Super Kings',         'Gujarat Titans',               'Chennai'),
  m(38, '2026-04-26', '19:30', 'Lucknow Super Giants',        'Kolkata Knight Riders',        'Lucknow'),
  m(39, '2026-04-27', '19:30', 'Delhi Capitals',              'Royal Challengers Bengaluru',  'Delhi'),
  m(40, '2026-04-28', '19:30', 'Punjab Kings',                'Rajasthan Royals',             'New Chandigarh'),
  m(41, '2026-04-29', '19:30', 'Mumbai Indians',              'Sunrisers Hyderabad',          'Mumbai'),
  m(42, '2026-04-30', '19:30', 'Gujarat Titans',              'Royal Challengers Bengaluru',  'Ahmedabad'),
  m(43, '2026-05-01', '19:30', 'Rajasthan Royals',            'Delhi Capitals',               'Jaipur'),
  m(44, '2026-05-02', '19:30', 'Chennai Super Kings',         'Mumbai Indians',               'Chennai'),
  m(45, '2026-05-03', '15:30', 'Sunrisers Hyderabad',         'Kolkata Knight Riders',        'Hyderabad'),
  m(46, '2026-05-03', '19:30', 'Gujarat Titans',              'Punjab Kings',                 'Ahmedabad'),
  m(47, '2026-05-04', '19:30', 'Mumbai Indians',              'Lucknow Super Giants',         'Mumbai'),
  m(48, '2026-05-05', '19:30', 'Delhi Capitals',              'Chennai Super Kings',          'Delhi'),
  m(49, '2026-05-06', '19:30', 'Sunrisers Hyderabad',         'Punjab Kings',                 'Hyderabad'),
  m(50, '2026-05-07', '19:30', 'Lucknow Super Giants',        'Royal Challengers Bengaluru',  'Lucknow'),
  m(51, '2026-05-08', '19:30', 'Delhi Capitals',              'Kolkata Knight Riders',        'Delhi'),
  m(52, '2026-05-09', '19:30', 'Rajasthan Royals',            'Gujarat Titans',               'Jaipur'),
  m(53, '2026-05-10', '15:30', 'Chennai Super Kings',         'Lucknow Super Giants',         'Chennai'),
  m(54, '2026-05-10', '19:30', 'Royal Challengers Bengaluru', 'Mumbai Indians',               'Raipur'),
  m(55, '2026-05-11', '19:30', 'Punjab Kings',                'Delhi Capitals',               'Dharamshala'),
  m(56, '2026-05-12', '19:30', 'Gujarat Titans',              'Sunrisers Hyderabad',          'Ahmedabad'),
  m(57, '2026-05-13', '19:30', 'Royal Challengers Bengaluru', 'Kolkata Knight Riders',        'Raipur'),
  m(58, '2026-05-14', '19:30', 'Punjab Kings',                'Mumbai Indians',               'Dharamshala'),
  m(59, '2026-05-15', '19:30', 'Lucknow Super Giants',        'Chennai Super Kings',          'Lucknow'),
  m(60, '2026-05-16', '19:30', 'Kolkata Knight Riders',       'Gujarat Titans',               'Kolkata'),
  m(61, '2026-05-17', '15:30', 'Punjab Kings',                'Royal Challengers Bengaluru',  'Dharamshala'),
  m(62, '2026-05-17', '19:30', 'Delhi Capitals',              'Rajasthan Royals',             'Delhi'),
  m(63, '2026-05-18', '19:30', 'Chennai Super Kings',         'Sunrisers Hyderabad',          'Chennai'),
  m(64, '2026-05-19', '19:30', 'Rajasthan Royals',            'Lucknow Super Giants',         'Jaipur'),
  m(65, '2026-05-20', '19:30', 'Kolkata Knight Riders',       'Mumbai Indians',               'Kolkata'),
  m(66, '2026-05-21', '19:30', 'Gujarat Titans',              'Chennai Super Kings',          'Ahmedabad'),
  m(67, '2026-05-22', '19:30', 'Sunrisers Hyderabad',         'Royal Challengers Bengaluru',  'Hyderabad'),
  m(68, '2026-05-23', '19:30', 'Lucknow Super Giants',        'Punjab Kings',                 'Lucknow'),
  m(69, '2026-05-24', '15:30', 'Mumbai Indians',              'Rajasthan Royals',             'Mumbai'),
  m(70, '2026-05-24', '19:30', 'Kolkata Knight Riders',       'Delhi Capitals',               'Kolkata'),
];

const MATCH_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

export type MatchStatus = 'past' | 'live' | 'upcoming';

export function getMatchStatus(match: IplMatch): MatchStatus {
  const start = new Date(match.dateTimeIST).getTime();
  const now   = Date.now();
  if (now > start + MATCH_DURATION_MS) return 'past';
  if (now >= start)                    return 'live';
  return 'upcoming';
}

export function formatMatchDate(dateTimeIST: string): string {
  const d = new Date(dateTimeIST);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatMatchTime(dateTimeIST: string): string {
  const d = new Date(dateTimeIST);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
